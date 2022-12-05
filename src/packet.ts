import Ajv, { JTDSchemaType } from "ajv/dist/jtd";

const ajv = new Ajv();

interface BasePacket {
  packetType: string;
  messageId: string;
  respondsTo?: string;
}

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

export interface ControlPacket extends BasePacket {
  packetType: "control";
  payload: ControlPayload;
}

export interface MessagePacket<MessageType> extends BasePacket {
  packetType: "message";
  message: MessageType;
}

export type Packet<MessageType> = ControlPacket | MessagePacket<MessageType>;

export const buildSerializer = <MessageType>(
  messageSchema: JTDSchemaType<MessageType>
) => {
  const PacketSchema = {
    discriminator: "packetType",
    mapping: {
      control: {
        properties: {
          payload: ControlPayloadSchema,
          messageId: { type: "string" },
        },
        optionalProperties: {
          respondsTo: { type: "string" },
        },
      },
      message: {
        properties: {
          message: messageSchema,
          messageId: { type: "string" },
        },
        optionalProperties: {
          respondsTo: { type: "string" },
        },
      },
    },
  };

  const serializers =
    //  : {
    //   serializePacket: (message: Packet<MessageType>) => string;
    //   parsePacket: (data: string) => Packet<MessageType> | undefined;
    // }
    {
      serializePacket: ajv.compileSerializer<Packet<MessageType>>(PacketSchema),
      parsePacket: ajv.compileParser<Packet<MessageType>>(PacketSchema),
    };

  return serializers;
};
