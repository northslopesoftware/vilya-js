import { JTDSchemaType } from "ajv/dist/core";
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
      payload: { type: "ping" },
    };
    const json = serializePacket(packet);
    expect(packet).toEqual(parsePacket(json));
  });
});
