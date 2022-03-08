import CommonException from "./CommonException";

export default class InvalidAuthorizedTokenException extends CommonException {
    constructor(message?: string) {
        super("invalid token", 403);
        if (message) {
            this.message += ": " + message;
        }
    }
}
