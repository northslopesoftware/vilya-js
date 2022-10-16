export class ConnectionError extends Error {
  constructor(message?: string) {
    super(message ? message : "No connection to server");
  }
}
