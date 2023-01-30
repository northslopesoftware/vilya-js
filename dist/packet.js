"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSerializer = exports.ControlPayloadSchema = void 0;
const jtd_1 = __importDefault(require("ajv/dist/jtd"));
const ajv = new jtd_1.default();
exports.ControlPayloadSchema = {
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
const buildSerializer = (messageSchema) => {
    const PacketSchema = {
        discriminator: "packetType",
        mapping: {
            control: {
                properties: {
                    payload: exports.ControlPayloadSchema,
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
        serializePacket: ajv.compileSerializer(PacketSchema),
        parsePacket: ajv.compileParser(PacketSchema),
    };
    return serializers;
};
exports.buildSerializer = buildSerializer;
