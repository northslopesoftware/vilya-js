"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketConnection = void 0;
const crypto_1 = require("crypto");
const ws_1 = __importDefault(require("ws"));
const connection_error_1 = require("./connection-error");
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
        this.ws = ws;
        this.initSocket();
        if (options === null || options === void 0 ? void 0 : options.url) {
            this.connect(options.url);
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
     * Use crypto module to generate a UUID v4
     *
     * @returns a random UUID (v4)
     */
    getUUID() {
        return (0, crypto_1.randomUUID)();
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
        this.url = url;
        if (this.ws) {
            throw new connection_error_1.ConnectionError("Tried connecting but socket already connected.");
        }
        this.url = url;
        this.ws = new ws_1.default(url);
        // begin monitoring socket health
        this.heartbeatAlive = true;
        this.startHeartbeatTimer();
        this.initSocket();
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
        this.ws.on("message", this.onData.bind(this));
        this.ws.on("error", console.error);
        // listen to the close event
        this.ws.on("close", () => this.onClose());
    }
    /**
     * Disconnect the websocket, notify listeners, and clear heartbeat timer.
     */
    disconnect() {
        var _a, _b;
        this.url = undefined;
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.close();
        this.ws = undefined;
        (_b = this.heartbeatInterval) === null || _b === void 0 ? void 0 : _b.unref();
    }
    /**
     * Getter to return current connection state.
     */
    get isConnected() {
        var _a;
        return ((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === ws_1.default.OPEN;
    }
    /**
     * Serialize a packet and send it over the websocket.
     *
     * @param packet the packet to transmit
     */
    transmit(packet) {
        if (this.ws === undefined) {
            throw new connection_error_1.ConnectionError("WebSocket is not connected.");
        }
        const data = this.serialize(packet);
        this.ws.send(data);
    }
}
exports.WebSocketConnection = WebSocketConnection;
exports.default = WebSocketConnection;
