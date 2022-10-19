import { ConnectionError, Packet } from ".";
import wsWebSocket from "ws";
import { randomUUID } from "crypto";

export type MessageResolver<MessageType> = {
  resolve: (message?: MessageType) => void;
  reject: (error: Error) => void;
};

export type Parser<T> = (data: string) => Packet<T> | undefined;
export type Serializer<T> = (t: Packet<T>) => string;
export type MessageListener<T> = (message: T) => void | Promise<void>;

export class WebSocketConnection<MessageType> {
  protected ws?: WebSocket | wsWebSocket;
  protected timeoutMs;
  protected url?: string;

  // Just use JSON by default; meant to be swapped with ajv serialization
  protected serialize: Serializer<MessageType>;
  protected parse: Parser<MessageType>;

  // holds the id of an interval that pings to update heartbeat
  protected heartbeatInterval?: NodeJS.Timer;
  protected heartbeatAlive = false;

  // listeners for the close and message events
  protected closeListeners: (() => void)[] = [];
  protected messageListeners: MessageListener<MessageType>[] = [];

  // Messages that are awaiting a response
  protected pendingMessages: Map<string, MessageResolver<MessageType>> =
    new Map();

  /**
   * Create a new WebSocketConnection.
   *
   * @param url (optional) The url to connect to. Empty url will connect later.
   * @param options (optional) Options object
   */
  public constructor(options?: {
    url?: string;
    timeoutMs?: number;
    parse?: Parser<MessageType>;
    serialize?: Serializer<MessageType>;
    ws?: WebSocket | wsWebSocket;
  }) {
    this.timeoutMs = options?.timeoutMs || 60000;
    this.serialize = options?.serialize || JSON.stringify;
    this.parse = options?.parse || JSON.parse;
    this.ws = options?.ws;

    if (options?.url) {
      this.connect(options.url);
    }
  }

  /**
   * Getter for the connection status.
   */
  public get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Send a heartbeat ping every 30 seconds to avoid nginx closing connection.
   *
   * Close the websocket if no pong response is received.
   *
   * NOTE: nginx by default closes websockets that are open more than 60s
   * without activity.
   */
  protected startHeartbeatTimer() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.heartbeatAlive) {
        console.log("no heartbeat... closing socket");
        this.ws?.close();
        return;
      }

      this.heartbeatAlive = false;
      this.ping();
    }, 30000);
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
  public connect(url: string) {
    this.url = url;

    if (this.ws) {
      throw new ConnectionError(
        "Tried connecting but socket already connected."
      );
    }

    this.url = url;
    this.ws = new WebSocket(url);

    // begin monitoring socket health
    this.heartbeatAlive = true;
    this.startHeartbeatTimer();

    // listen to the message event
    this.ws.addEventListener("message", (event: MessageEvent<string>) =>
      this.onData(event.data)
    );

    // listen to the close event
    this.ws.addEventListener("close", () => this.onClose());
  }

  /**
   * Disconnect the websocket
   */
  public disconnect() {
    this.url = undefined;
    this.ws?.close();
    this.ws = undefined;
  }

  /**
   * Handler method for the udnerlying WebSocket "close" event.
   */
  protected onClose() {
    // stop monitoring heartbeat
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = undefined;

    // Run all the close event callbacks.
    this.closeListeners.forEach((c) => c());
  }

  /**
   * Add a message listener to the WebSocket Connection.
   *
   * @param listener The function to run when a message is received
   */
  public addMessageListener(listener: MessageListener<MessageType>) {
    this.messageListeners.push(listener);
  }

  /**
   * Add a socket close listener to the WebSocket Connection.
   *
   */
  public addCloseListener(listener: () => void) {
    this.closeListeners.push(listener);
  }

  /**
   * Send a control packet with a "ping" payload.
   */
  protected ping() {
    this.transmit({
      packetType: "control",
      messageId: randomUUID(),
      payload: { type: "ping" },
    });
  }

  /**
   * Handler for the underlying WebSocket "message" event
   *
   * @param data Data received from the websocket
   */
  protected onData(data: string): void {
    const packet: Packet<MessageType> | undefined = this.parse(data);

    if (packet === undefined) {
      throw new Error("Invalid packet received");
    }

    if (packet.packetType === "message") {
      this.messageListeners.forEach((m) => {
        m(packet.message)?.catch(() => {
          throw new Error("Handler failed");
        });
      });
    } else if (packet.packetType === "control") {
      throw new Error("not implemented");
    }

    const msgResolver = this.pendingMessages.get(packet.messageId);
    msgResolver?.resolve(packet.message);
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
  public request(message: MessageType): Promise<MessageType | undefined> {
    const messageId = randomUUID();
    const packet: Packet<MessageType> = {
      packetType: "message",
      messageId,
      message,
    };

    let timeout: NodeJS.Timeout;
    const promise = new Promise<MessageType | undefined>((resolve, reject) => {
      this.pendingMessages.set(messageId, { resolve, reject });
      timeout = setTimeout(() => {
        reject(new Error("Timeout"));
        this.pendingMessages.delete(messageId);
      }, this.timeoutMs);
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
  public send(message: MessageType, respondsTo?: string): void {
    const packet: Packet<MessageType> = {
      packetType: "message",
      messageId: randomUUID(),
      respondsTo,
      message,
    };

    this.transmit(packet);
  }

  /**
   * Transmit a packet.
   *
   * @param packet The packet to transmit.
   */
  public transmit(packet: Packet<MessageType>): void {
    if (this.ws === undefined) {
      throw new ConnectionError("WebSocket is not connected.");
    }
    const data = this.serialize(packet);
    this.ws.send(data);
  }
}

export default WebSocketConnection;
