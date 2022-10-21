import { ConnectionError } from ".";
import { v4 as uuid } from "uuid";
import WebSocketConnection, { Parser, Serializer } from "./base-ws-conection";

export class BrowserWebSocketConnection<
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
}

export default BrowserWebSocketConnection;
