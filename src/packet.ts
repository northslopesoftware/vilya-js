import Ajv, { JTDSchemaType } from "ajv/dist/jtd";

const ajv = new Ajv();

export type ControlPayload =
  | { type: "ping"; inert?: string }
  | { type: "pong"; inert?: string };

export const ControlPayloadSchema: JTDSchemaType<ControlPayload> = {
  discriminator: "type",
  mapping: {
    ping: {
      optionalProperties: { inert: { type: "string" } },
    },
    pong: {
      optionalProperties: { inert: { type: "string" } },
    },
  },
};

export type ControlPacket = { packetType: "control"; payload: ControlPayload };

export type MessagePacket<MessageType> = {
  packetType: "message";
  messageId?: string;
  message: MessageType;
};

export type Packet<MessageType> = ControlPacket | MessagePacket<MessageType>;

export const PacketSerializer = <MessageType>(
  MessageSchema: JTDSchemaType<MessageType>
) => {
  const PacketSchema = {
    discriminator: "packetType",
    mapping: {
      control: {
        properties: {
          payload: ControlPayloadSchema,
        },
      },
      message: {
        properties: {
          message: MessageSchema,
        },
        optionalProperties: {
          messageId: { type: "string" },
        },
      },
    },
  };

  return {
    serializePacket: ajv.compileSerializer(PacketSchema),
    parsePacket: ajv.compileParser(PacketSchema),
  };
};
