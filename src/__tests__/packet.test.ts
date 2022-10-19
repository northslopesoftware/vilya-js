import { JTDSchemaType } from "ajv/dist/core";
import { randomUUID } from "crypto";
import { Packet, buildSerializer } from "..";

interface Message {
  message: string;
}

const schema: JTDSchemaType<Message> = {
  properties: {
    message: { type: "string" },
  },
};

const { serializePacket, parsePacket } = buildSerializer<Message>(schema);

describe("Packet", () => {
  it("serializes and deserializes", () => {
    const packet: Packet<Message> = {
      packetType: "control",
      messageId: randomUUID(),
      payload: { type: "ping" },
    };

    const json = serializePacket(packet);
    const result = parsePacket(json);
    expect(packet).toEqual(result);
  });
});
