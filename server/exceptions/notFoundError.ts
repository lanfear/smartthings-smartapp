export default class NotFoundError extends Error {
  type: string; // this should be the name of a TS Type/Interface

  constructor(message: string, type: string) {
    super(message);
    this.name = 'NotFoundError';
    this.type = type;
  }
}
