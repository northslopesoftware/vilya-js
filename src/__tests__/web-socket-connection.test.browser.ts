import { Server } from "ws";
import { WebSocketConnection } from "../browser-web-socket-connection";

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
      const wsc = new WebSocketConnection<Message>({
        ws: serverSocket as unknown as WebSocket,
      });
      wsc.send(message);
    });

    const clientWs = new WebSocket(serverUrl);
    const socket = new WebSocketConnection<Message>({ ws: clientWs });
    socket.addMessageListener(messageHandler);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(messageHandler).toHaveBeenCalledWith(message, expect.any(String));
  });

  it("initializes disconnected", () => {
    const wsc = new WebSocketConnection();
    expect(wsc.isConnected).toBe(false);
  });

  it("runs onClose on disconnection", async () => {
    const ws = new WebSocket(serverUrl);
    const wsc = new WebSocketConnection<Message>({ ws });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(wsc.isConnected).toBe(true);
    const closeListener = jest.fn();
    wsc.addCloseListener(closeListener);
    ws.close();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(closeListener).toBeCalled();
  });
});
