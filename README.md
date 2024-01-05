# Vilya

## Description

Vilya is an abstraction layer for network messages, which handles the connection, control messages, serialization, and schema validation. Currently, vilya supports [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) and [Ajv](https://ajv.js.org) for serialization and schema validation.

> **Note:** We used Vilya for a project, but it is no longer being actively developed.

## Installation

`npm install @northslope/vilya`

## Usage

### Server side (Node.js)
```typescript
import MessageSchema, { MessageType } from './schema';
import WebSocket from 'ws';
import { WebSocketConnection, buildSerializer } from '@northslope/vilya';

// Use ws package to listen for websocket connections
const wss = new WebSocket.Server({ port: 8080 });
wss.on("connection", (newSocket: WebSocket) => {

  // Build the serializer and parser
  const { serializePacket, parsePacket } =
    buildSerializer<Message>(MessageSchema);

  // Create a vilya WebSocketConnection
  const socketConnection = new WebSocketConnection<MessageType>({
        ws: newSocket,
        serialize: serializePacket,
        parse,
      });

  socketConn.addMessageListener((message) => {
    console.log(message);
  });

  socketConn.addCloseListener(() => {
    console.log("Connection closed");
  });
```

### Client side (Browser or Node.js)
```typescript
import MessageSchema, { MessageType } from './schema';
import WebSocketConnection from '@northslope/vilya';

// Build the serializer and parser
const { serializePacket, parsePacket } =
  buildSerializer<Message>(MessageSchema);

// Create the vilya WebSocketConnection object
const socketConnection = new WebSocketConnection<MessageType>({
  serialize: (message) => JSON.stringify(message),
  parse: (message) => JSON.parse(message),
});

// add a message listener
socketConnection.addMessageListener((message) => {
  console.log(message);
});

// add a close listener
socketConnection.addCloseListener(() => {
  console.log("Connection closed");
});

// connect to the server
socketConnection.connect("ws://localhost:8080");
```

## What does vilya mean?

It's nerd stuff. Vilya is one of the elven rings of power from J.R.R. Tolkien literature. Vilya is the ring of air that was owned by Elrond, which apparently helped Elrond conceal Rivendell. Vilya conceals the complexity of message passing through abstraction and encapsulation.
