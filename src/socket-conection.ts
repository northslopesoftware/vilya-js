import { MessagePacket, Packet } from "./packet";

export type MessageResolver<MessageType> = {
  resolve: (message?: MessageType) => void;
  reject: (error: Error) => void;
};

export type Parser<T> = (data: string) => Packet<T> | undefined;
export type Serializer<T> = (t: Packet<T>) => string;
export type MessageListener<T> = (
  message: T,
  messageId: string
) => void | Promise<void>;

export interface SocketConnectionOptions<MessageType> {
  url?: string;
  timeoutMs?: number;
  parse?: Parser<MessageType>;
  serialize?: Serializer<MessageType>;
}

export abstract class SocketConnection<MessageType> {
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
  public constructor(options?: SocketConnectionOptions<MessageType>) {
    this.timeoutMs = options?.timeoutMs || 60000;
    this.serialize = options?.serialize || JSON.stringify;
    this.parse = options?.parse || JSON.parse;
  }

  /**
   * Getter for the connection status.
   */
  public abstract get isConnected(): boolean;

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
        this.disconnect();
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
  public abstract connect(url: string): void;

  /**
   * Disconnect the websocket
   */
  public abstract disconnect(): void;

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

  protected abstract getUUID(): string;

  /**
   * Send a control packet with a "ping" payload.
   */
  protected ping() {
    this.transmit({
      packetType: "control",
      messageId: this.getUUID(),
      payload: { type: "ping" },
    });
  }

  /**
   * Send a control packet with a "pong" payload.
   */
  protected pong(respondsTo: string) {
    this.transmit({
      packetType: "control",
      messageId: this.getUUID(),
      payload: { type: "pong" },
      respondsTo,
    });
  }

  /**
   * Handler for the underlying WebSocket "message" event
   *
   * @param data Data received from the websocket
   */
  protected onData(data: string | Buffer | ArrayBuffer | Buffer[]): void {
    let packet: Packet<MessageType> | undefined;
    try {
      packet = this.parse(data.toString());
    } catch (e) {
      console.log(e);
      return;
    }

    if (packet === undefined) {
      return undefined;
    }

    this.heartbeatAlive = true;
    if (packet.packetType === "message") {
      const msgPacket: MessagePacket<MessageType> = packet;
      this.messageListeners.forEach((m) => {
        void m(msgPacket.message, msgPacket.messageId);
      });
    } else if (packet.packetType === "control") {
      if (packet.payload.type === "ping") {
        this.pong(packet.messageId);
      }
    }

    if (packet.respondsTo) {
      const msgResolver = this.pendingMessages.get(packet.respondsTo);
      msgResolver?.resolve(
        packet.packetType === "message" ? packet.message : undefined
      );
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
  public request(message: MessageType): Promise<MessageType | undefined> {
    const messageId = this.getUUID();
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
      messageId: this.getUUID(),
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
  public abstract transmit(packet: Packet<MessageType>): void;
}

export default SocketConnection;
