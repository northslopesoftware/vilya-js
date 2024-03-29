import { v4 as uuid } from "uuid";
import { Packet } from "./packet";
import SocketConnection, { SocketConnectionOptions } from "./socket-connection";

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

    // Default to reconnect
    this.shouldReconnect =
      options.shouldReconnect === undefined ? true : options.shouldReconnect;

    if (ws) {
      this.ws = ws;
      this.initSocket();
    } else if (this.url) {
      this.connect(this.url);
    }
  }

  /**
   * Get WebSocket ready state.
   */
  public get status() {
    return this.ws?.readyState;
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

    this.ws.addEventListener("error", (e: Event) => {
      console.error(e);
      this.errorListeners.forEach((l) => l(e.toString()));
    });

    // listen to the message event
    this.ws.addEventListener("message", (event: MessageEvent<string>) =>
      this.onData(event.data)
    );

    // listen to the close event
    this.ws.addEventListener("close", this.onClose.bind(this));
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
  public disconnect() {
    if (this.ws === undefined) return;

    this.url = undefined;
    this.ws.close();
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
      return this.onError("WebSocket is not connected.");
    }

    const data = this.serialize(packet);

    this.ws.send(data);
  }
}

export default WebSocketConnection;
