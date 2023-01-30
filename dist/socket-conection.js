"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketConnection = void 0;
class SocketConnection {
    /**
     * Create a new WebSocketConnection.
     *
     * @param url (optional) The url to connect to. Empty url will connect later.
     * @param options (optional) Options object
     */
    constructor(options) {
        this.heartbeatAlive = false;
        // listeners for the close and message events
        this.openListeners = [];
        this.closeListeners = [];
        this.errorListeners = [];
        this.messageListeners = [];
        // Messages that are awaiting a response
        this.pendingMessages = new Map();
        this.msgTimeout = (options === null || options === void 0 ? void 0 : options.msgTimeout) || 60000;
        this.serialize = (options === null || options === void 0 ? void 0 : options.serialize) || JSON.stringify;
        this.parse = (options === null || options === void 0 ? void 0 : options.parse) || JSON.parse;
        this.connectTimeout = (options === null || options === void 0 ? void 0 : options.connectTimeout) || 5000;
        this.shouldReconnect = (options === null || options === void 0 ? void 0 : options.shouldReconnect) || false;
        this.url = options === null || options === void 0 ? void 0 : options.url;
    }
    /**
     * Remove all listeners
     */
    clearListeners() {
        this.openListeners = [];
        this.closeListeners = [];
        this.messageListeners = [];
        this.errorListeners = [];
    }
    /**
     * Send a heartbeat ping every 30 seconds to avoid nginx closing connection.
     *
     * Close the websocket if no pong response is received.
     *
     * NOTE: nginx by default closes websockets that are open more than 60s
     * without activity.
     */
    startHeartbeatTimer() {
        this.heartbeatInterval = setInterval(() => {
            if (!this.heartbeatAlive) {
                if (this.url && this.shouldReconnect) {
                    this.connect(this.url);
                }
                return;
            }
            this.heartbeatAlive = false;
            this.ping();
        }, 30000);
    }
    onOpen() {
        this.openListeners.forEach((l) => l());
    }
    onError(err) {
        this.errorListeners.forEach((l) => l(err));
    }
    /**
     * Handler method for the udnerlying WebSocket "close" event.
     */
    onClose() {
        // stop monitoring heartbeat
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = undefined;
        // Run all the close event callbacks.
        this.closeListeners.forEach((c) => c());
        if (this.shouldReconnect) {
            setTimeout(() => {
                if (this.url) {
                    this.connect(this.url);
                }
            }, this.connectTimeout);
        }
    }
    /**
     * Add a message listener to the WebSocket Connection.
     *
     * @param listener The function to run when a message is received
     */
    addMessageListener(listener) {
        this.messageListeners.push(listener);
    }
    /**
     * Add a socket open listener to the WebSocket Connection.
     *
     */
    addOpenListener(listener) {
        this.openListeners.push(listener);
    }
    /**
     * Add a socket close listener to the WebSocket Connection.
     *
     */
    addCloseListener(listener) {
        this.closeListeners.push(listener);
    }
    /**
     * Add a socket error listener
     *
     * @param listener the listener
     */
    addErrorListener(listener) {
        this.errorListeners.push(listener);
    }
    /**
     * Send a control packet with a "ping" payload.
     */
    ping() {
        const pingPacket = {
            packetType: "control",
            messageId: this.getUUID(),
            payload: { type: "ping" },
        };
        this.transmit(pingPacket);
    }
    /**
     * Send a control packet with a "pong" payload.
     */
    pong(respondsTo) {
        const pongPacket = {
            packetType: "control",
            messageId: this.getUUID(),
            payload: { type: "pong" },
            respondsTo,
        };
        this.transmit(pongPacket);
    }
    /**
     * Handler for the underlying WebSocket "message" event
     *
     * @param data Data received from the websocket
     */
    onData(data) {
        let packet;
        try {
            packet = this.parse(data.toString());
        }
        catch (e) {
            console.error(e);
            return;
        }
        if (packet === undefined) {
            return undefined;
        }
        this.heartbeatAlive = true;
        if (packet.packetType === "message") {
            const msgPacket = packet;
            this.messageListeners.forEach((m) => {
                void m(msgPacket.message, msgPacket.messageId);
            });
        }
        else if (packet.packetType === "control") {
            if (packet.payload.type === "ping") {
                this.pong(packet.messageId);
            }
        }
        if (packet.respondsTo) {
            const msgResolver = this.pendingMessages.get(packet.respondsTo);
            msgResolver === null || msgResolver === void 0 ? void 0 : msgResolver.resolve(packet.packetType === "message" ? packet.message : undefined);
        }
    }
    /**
     * Send a message and return a Promise to wait for the response.
     *
     * This method handles putting the message in a message packet and
     * transmitting it.
     *
     * @param message The message to send.
     * @returns A promise that resolves when the message is answered.
     */
    request(message) {
        const messageId = this.getUUID();
        const packet = {
            packetType: "message",
            messageId,
            message,
        };
        let timeout;
        const promise = new Promise((resolve, reject) => {
            this.pendingMessages.set(messageId, { resolve, reject });
            timeout = setTimeout(() => {
                reject(new Error(`Timeout for message ${messageId}`));
                this.pendingMessages.delete(messageId);
            }, this.msgTimeout);
        }).finally(() => clearTimeout(timeout));
        this.transmit(packet);
        return promise;
    }
    /**
     * Send a message and do not wait for a response.
     *
     * This method handles putting the message in a message packet and
     * transmitting it.
     *
     * @param message the message to send
     */
    send(message, respondsTo) {
        const packet = {
            packetType: "message",
            messageId: this.getUUID(),
            respondsTo,
            message,
        };
        this.transmit(packet);
    }
}
exports.SocketConnection = SocketConnection;
exports.default = SocketConnection;
