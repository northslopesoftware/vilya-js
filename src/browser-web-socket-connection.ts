import { ConnectionError } from "./connection-error";
import { Packet } from "./packet";
import { v4 as uuid } from "uuid";
import SocketConnection, { SocketConnectionOptions } from "./socket-conection";

export interface WebSocketConnectionOptions<T>
  extends SocketConnectionOptions<T> {
  ws?: WebSocket;
}

export class WebSocketConnection<
  MessageType
> extends SocketConnection<MessageType> {
  protected ws?: WebSocket;

  /**
   * Create a new WebSocketConnection.
   *
   * @param url (optional) The url to connect to. Empty url will connect later.
   * @param options (optional) Options object
   */
  public constructor(options?: WebSocketConnectionOptions<MessageType>) {
    if (options === undefined) {
      super();
      return;
    }

    const { ws, ...superOptions } = options;
    super(superOptions);

    if (ws !== undefined) {
      this.ws = ws;
      this.initSocket();
    }

    this.shouldReconnect = options.shouldReconnect || true;

    if (options?.url) {
      this.connect(options.url);
    }
  }

  /**
   * Initialize the websocket handlers
   *
   * @returns void
   */
  protected initSocket() {
    if (this.ws === undefined) {
      return;
    }

    this.ws.addEventListener("error", () => {
      this.onClose();
    });

    // listen to the message event
    this.ws.addEventListener("message", (event: MessageEvent<string>) =>
      this.onData(event.data)
    );

    // listen to the close event
    this.ws.addEventListener("close", () => this.onClose());
  }

  /**
   * Return a random UUID (v4)
   *
   * @returns UUID v4
   */
  protected getUUID() {
    return uuid();
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
    this.ws = new WebSocket(url);

    // begin monitoring socket health
    this.heartbeatAlive = true;
    this.startHeartbeatTimer();

    this.ws.addEventListener("open", () => this.initSocket());

    setTimeout(() => {
      if (!this.isConnected && this.url) {
        this.connect(this.url);
      }
    }, this.connectTimeout);
  }

  /**
   * Disconnect the websocket, notify listeners, and clear heartbeat timer.
   */
  public disconnect() {
    this.url = undefined;
    this.ws?.close();
    this.ws = undefined;
    clearInterval(this.heartbeatInterval);
  }

  /**
   * Getter to return current connection state.
   */
  public get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Serialize a packet and send it over the websocket.
   *
   * @param packet the packet to transmit
   */
  protected transmit(packet: Packet<MessageType>) {
    if (this.ws === undefined) {
      throw new ConnectionError("WebSocket is not connected.");
    }

    const data = this.serialize(packet);
    this.ws.send(data);
  }
}

export default WebSocketConnection;