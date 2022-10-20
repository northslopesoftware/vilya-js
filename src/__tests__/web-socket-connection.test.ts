import WebSocketConnection from "../web-socket-connection";
import WebSocket from "ws";

interface Message {
  testProp: string;
}

let message: Message;

describe("WebSocketConnection", () => {
  let server: WebSocket.Server;

  beforeAll(() => {
    server = new WebSocket.Server({ port: 8888 });
  });

  beforeEach(() => {
    message = { testProp: "testValue" };
  });

  afterAll(() => {
    server.close();
  });

  it("initializes", () => {
    const socket = new WebSocketConnection<Message>();
  });

  it("initializes with ws WebSocket", async () => {
    const ws = new WebSocket("ws://localhost:8088");
    const socket = new WebSocketConnection<Message>({ ws });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    socket.disconnect();
  });

  it("accepts a message listener", () => {
    const messageListener = (msg: Message) => {
      return;
    };
    const socket = new WebSocketConnection<Message>();
    socket.addMessageListener(messageListener);
  });

  it("accepts an async message listener", () => {
    // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-empty-function
    const messageListener = async (msg: Message) => {};
    const socket = new WebSocketConnection<Message>();
    socket.addMessageListener(messageListener);
  });
});
