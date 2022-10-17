import WebSocketConnection from "../web-socket-connection";
import WebSocket from "ws";

describe("WebSocketConnection", () => {
  it("initializes", () => {
    const socket = new WebSocketConnection();
  });

  it("initializes with ws WebSocket", () => {
    const ws = new WebSocket(null);
    const socket = new WebSocketConnection(ws);
  });
});
