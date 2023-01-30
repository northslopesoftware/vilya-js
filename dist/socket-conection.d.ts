/// <reference types="node" />
/// <reference types="node" />
import { Packet } from "./packet";
export declare type MessageResolver<MessageType> = {
    resolve: (message?: MessageType) => void;
    reject: (error: Error) => void;
};
export declare type Parser<T> = (data: string) => Packet<T> | undefined;
export declare type Serializer<T> = (t: Packet<T>) => string;
export declare type MessageListener<T> = (message: T, messageId: string) => void | Promise<void>;
export interface SocketConnectionOptions<MessageType> {
    url?: string;
    msgTimeout?: number;
    connectTimeout?: number;
    parse?: Parser<MessageType>;
    serialize?: Serializer<MessageType>;
    shouldReconnect?: boolean;
}
export declare abstract class SocketConnection<MessageType> {
    protected msgTimeout: number;
    protected connectTimeout: number;
    protected url?: string;
    protected shouldReconnect: boolean;
    protected serialize: Serializer<MessageType>;
    protected parse: Parser<MessageType>;
    protected heartbeatInterval?: NodeJS.Timer;
    protected heartbeatAlive: boolean;
    protected openListeners: (() => void)[];
    protected closeListeners: (() => void)[];
    protected errorListeners: ((msg: string) => void)[];
    protected messageListeners: MessageListener<MessageType>[];
    protected pendingMessages: Map<string, MessageResolver<MessageType>>;
    /**
     * Create a new WebSocketConnection.
     *
     * @param url (optional) The url to connect to. Empty url will connect later.
     * @param options (optional) Options object
     */
    constructor(options?: SocketConnectionOptions<MessageType>);
    /**
     * Remove all listeners
     */
    clearListeners(): void;
    /**
     * Get the websocket ready state
     */
    abstract get status(): number | undefined;
    /**
     * Getter for the connection status.
     */
    abstract get isConnected(): boolean;
    /**
     * Send a heartbeat ping every 30 seconds to avoid nginx closing connection.
     *
     * Close the websocket if no pong response is received.
     *
     * NOTE: nginx by default closes websockets that are open more than 60s
     * without activity.
     */
    protected startHeartbeatTimer(): void;
    /**
     * Connect the socket listener to the indicated url.
     *
     * This is run from the constructor if a url is provided.
     * It can also be run after constructing.
     *
     * @param url the websocket server url
     * @throws ConnectionError if websocket property already initialized
     */
    abstract connect(url: string): void;
    /**
     * Disconnect the websocket
     */
    abstract disconnect(): void;
    protected onOpen(): void;
    protected onError(err: string): void;
    /**
     * Handler method for the udnerlying WebSocket "close" event.
     */
    protected onClose(): void;
    /**
     * Add a message listener to the WebSocket Connection.
     *
     * @param listener The function to run when a message is received
     */
    addMessageListener(listener: MessageListener<MessageType>): void;
    /**
     * Add a socket open listener to the WebSocket Connection.
     *
     */
    addOpenListener(listener: () => void): void;
    /**
     * Add a socket close listener to the WebSocket Connection.
     *
     */
    addCloseListener(listener: () => void): void;
    /**
     * Add a socket error listener
     *
     * @param listener the listener
     */
    addErrorListener(listener: (msg: string) => void): void;
    protected abstract getUUID(): string;
    /**
     * Send a control packet with a "ping" payload.
     */
    protected ping(): void;
    /**
     * Send a control packet with a "pong" payload.
     */
    protected pong(respondsTo: string): void;
    /**
     * Handler for the underlying WebSocket "message" event
     *
     * @param data Data received from the websocket
     */
    protected onData(data: string | Buffer | ArrayBuffer | Buffer[]): void;
    /**
     * Send a message and return a Promise to wait for the response.
     *
     * This method handles putting the message in a message packet and
     * transmitting it.
     *
     * @param message The message to send.
     * @returns A promise that resolves when the message is answered.
     */
    request(message: MessageType): Promise<MessageType | undefined>;
    /**
     * Send a message and do not wait for a response.
     *
     * This method handles putting the message in a message packet and
     * transmitting it.
     *
     * @param message the message to send
     */
    send(message: MessageType, respondsTo?: string): void;
    /**
     * Transmit a packet.
     *
     * @param packet The packet to transmit.
     */
    protected abstract transmit(packet: Packet<MessageType>): void;
}
export default SocketConnection;
