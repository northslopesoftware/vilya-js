import { Message } from "../../schema";
import { Packet, serializePacket, parsePacket } from "..";

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
