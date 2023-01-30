import { Packet } from "./packet";
import SocketConnection, { SocketConnectionOptions } from "./socket-conection";
import WebSocket from "ws";
export interface WebSocketConnectionOptions<T> extends SocketConnectionOptions<T> {
    ws?: WebSocket;
}
export declare class WebSocketConnection<MessageType> extends SocketConnection<MessageType> {
    protected ws?: WebSocket;
    /**
     * Create a new WebSocketConnection.
     *
     * @param url (optional) The url to connect to. Empty url will connect later.
     * @param options (optional) Options object
     */
    constructor(options?: WebSocketConnectionOptions<MessageType>);
    /**
     * Get WebSocket ready state.
     */
    get status(): 0 | 1 | 2 | 3 | undefined;
    /**
     * Use crypto module to generate a UUID v4
     *
     * @returns a random UUID (v4)
     */
    protected getUUID(): string;
    /**
     * Connect the socket listener to the indicated url.
     *
     * This is run from the constructor if a url is provided.
     * It can also be run after constructing.
     *
     * @param url the websocket server url
     * @throws ConnectionError if websocket property already initialized
     */
    connect(url: string): void;
    /**
     * Initialize the websocket handlers
     *
     * @returns void
     */
    protected initSocket(): void;
    /**
     * Disconnect the websocket, notify listeners, and clear heartbeat timer.
     */
    disconnect(): void;
    /**
     * Getter to return current connection state.
     */
    get isConnected(): boolean;
    /**
     * Serialize a packet and send it over the websocket.
     *
     * @param packet the packet to transmit
     */
    protected transmit(packet: Packet<MessageType>): void;
}
export default WebSocketConnection;
