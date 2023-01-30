"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionError = void 0;
class ConnectionError extends Error {
    constructor(message) {
        super(message ? message : "No connection to server");
    }
}
exports.ConnectionError = ConnectionError;
