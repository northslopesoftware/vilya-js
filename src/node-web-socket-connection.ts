import { ConnectionError } from "./connection-error";
import { Packet } from "./packet";
import SocketConnection, { SocketConnectionOptions } from "./socket-conection";
import WebSocket from "ws";
import { randomUUID } from "crypto";

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

    this.ws = ws;
    this.initSocket();

    if (options?.url) {
      this.connect(options.url);
    }
  }

  /**
   * Get WebSocket ready state.
   */
  public get status() {
    return this.ws?.readyState;
  }

  /**
   * Use crypto module to generate a UUID v4
   *
   * @returns a random UUID (v4)
   */
  protected getUUID() {
    return randomUUID();
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

    this.initSocket();
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

    this.ws.on("message", this.onData.bind(this));

    this.ws.on("error", console.error);

    // listen to the close event
    this.ws.on("close", () => this.onClose());
  }

  /**
   * Disconnect the websocket, notify listeners, and clear heartbeat timer.
   */
  public disconnect(): void {
    this.url = undefined;
    this.ws?.close();
    this.ws = undefined;
    this.heartbeatInterval?.unref();
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
