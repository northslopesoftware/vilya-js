import { JTDSchemaType } from "ajv/dist/jtd";
interface BasePacket {
    packetType: string;
    messageId: string;
    respondsTo?: string;
}
export declare type ControlPayload = {
    type: "ping";
    inert?: string;
} | {
    type: "pong";
    inert?: string;
};
export declare const ControlPayloadSchema: JTDSchemaType<ControlPayload>;
export interface ControlPacket extends BasePacket {
    packetType: "control";
    payload: ControlPayload;
}
export interface MessagePacket<MessageType> extends BasePacket {
    packetType: "message";
    message: MessageType;
}
export declare type Packet<MessageType> = ControlPacket | MessagePacket<MessageType>;
export declare const buildSerializer: <MessageType>(messageSchema: JTDSchemaType<MessageType, Record<string, never>>) => {
    serializePacket: (data: Packet<MessageType>) => string;
    parsePacket: import("ajv/dist/types").JTDParser<Packet<MessageType>>;
};
export {};
