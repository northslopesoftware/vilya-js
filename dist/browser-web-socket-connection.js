"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketConnection = void 0;
const uuid_1 = require("uuid");
const socket_connection_1 = __importDefault(require("./socket-connection"));
class WebSocketConnection extends socket_connection_1.default {
    /**
     * Create a new WebSocketConnection.
     *
     * @param url (optional) The url to connect to. Empty url will connect later.
     * @param options (optional) Options object
     */
    constructor(options) {
        if (options === undefined) {
            super();
            return;
        }
        const { ws, ...superOptions } = options;
        super(superOptions);
        // Default to reconnect
        this.shouldReconnect =
            options.shouldReconnect === undefined ? true : options.shouldReconnect;
        if (ws) {
            this.ws = ws;
            this.initSocket();
        }
        else if (this.url) {
            this.connect(this.url);
        }
    }
    /**
     * Get WebSocket ready state.
     */
    get status() {
        var _a;
        return (_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState;
    }
    /**
     * Initialize the websocket handlers
     *
     * @returns void
     */
    initSocket() {
        if (this.ws === undefined) {
            return;
        }
        this.ws.addEventListener("error", (e) => {
            console.error(e);
            this.errorListeners.forEach((l) => l(e.toString()));
        });
        // listen to the message event
        this.ws.addEventListener("message", (event) => this.onData(event.data));
        // listen to the close event
        this.ws.addEventListener("close", this.onClose.bind(this));
    }
    /**
     * Return a random UUID (v4)
     *
     * @returns UUID v4
     */
    getUUID() {
        return (0, uuid_1.v4)();
    }
    /**
     * Connect the socket listener to the indicated url.
     *
     * This is run from the constructor if a url is provided.
     * It can also be run after constructing.
     *
     * @param url the websocket server url
     * @throws ConnectionError if websocket property already initialized
     */
    connect(url) {
        this.disconnect();
        this.url = url;
        this.ws = new WebSocket(url);
        // begin monitoring socket health
        this.heartbeatAlive = true;
        this.startHeartbeatTimer();
        this.ws.addEventListener("open", () => {
            this.initSocket();
            this.onOpen();
        });
        setTimeout(() => {
            if (!this.isConnected && this.url) {
                this.connect(this.url);
            }
        }, this.connectTimeout);
    }
    /**
     * Disconnect the websocket, notify listeners, and clear heartbeat timer.
     */
    disconnect() {
        if (this.ws === undefined)
            return;
        this.url = undefined;
        this.ws.close();
        this.ws = undefined;
        clearInterval(this.heartbeatInterval);
    }
    /**
     * Getter to return current connection state.
     */
    get isConnected() {
        var _a;
        return ((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN;
    }
    /**
     * Serialize a packet and send it over the websocket.
     *
     * @param packet the packet to transmit
     */
    transmit(packet) {
        if (this.ws === undefined) {
            return this.onError("WebSocket is not connected.");
        }
        const data = this.serialize(packet);
        this.ws.send(data);
    }
}
exports.WebSocketConnection = WebSocketConnection;
exports.default = WebSocketConnection;
