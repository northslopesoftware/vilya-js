import { ConnectionError } from ".";
import WebSocket from "ws";
import WebSocketConnection, { Parser, Serializer } from "./base-ws-conection";
import { randomUUID } from "crypto";

export class NodeWebSocketConnection<
  MessageType
> extends WebSocketConnection<MessageType> {
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
    ws?: WebSocket;
  }) {
    super(options);

    if (options?.url) {
      this.connect(options.url);
    }
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

    this.ws.on("message", (data: string) => this.onData(data));

    // listen to the close event
    this.ws.on("close", () => this.onClose());
  }
}

export default NodeWebSocketConnection;
