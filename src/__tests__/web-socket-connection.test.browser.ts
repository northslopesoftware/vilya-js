import WebSocketConnection from "../web-socket-connection.browser";
import { Server } from "ws";

interface Message {
  testProp: string;
}

let message: Message;
const port = 8899;
const serverUrl = `ws://localhost:${port}`;

describe("WebSocketConnection", () => {
  let server: Server;

  beforeEach(() => {
    server = new Server({ port });
    message = { testProp: "testValue" };
  });

  afterEach(() => {
    server.close();
  });

  it("initializes", () => {
    new WebSocketConnection<Message>();
  });

  it("initializes with ws WebSocket", async () => {
    const ws = new WebSocket(serverUrl);
    new WebSocketConnection<Message>({ ws });
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  it("accepts a message listener", () => {
    const messageListener = () => {
      return;
    };
    const socket = new WebSocketConnection<Message>();
    socket.addMessageListener(messageListener);
  });

  it("accepts an async message listener", () => {
    // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-empty-function
    const messageListener = async () => {};
    const socket = new WebSocketConnection<Message>();
    socket.addMessageListener(messageListener);
  });

  it("routes messages to handlers", async () => {
    const messageHandler = jest.fn();

    server.on("connection", (serverSocket) => {
      const wsc = new WebSocketConnection({
        ws: serverSocket as unknown as WebSocket,
      });
      wsc.send(message);
      wsc.disconnect();
    });

    const clientWs = new WebSocket(serverUrl);
    const socket = new WebSocketConnection(clientWs);
    socket.addMessageListener(messageHandler);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(messageHandler).toHaveBeenCalledWith(message);
  });
});
