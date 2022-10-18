import WebSocketConnection from "../web-socket-connection";
import WebSocket from "ws";

describe("WebSocketConnection", () => {
  let server: WebSocket.Server;

  beforeAll(async () => {
    server = new WebSocket.Server({ port: 8088 });
  });

  afterAll(() => {
    server.close();
  });

  it("initializes", () => {
    const socket = new WebSocketConnection();
  });

  it("initializes with ws WebSocket", async () => {
    const ws = new WebSocket("ws://localhost:8088");
    const socket = new WebSocketConnection({ ws });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    socket.disconnect();
  });
});
