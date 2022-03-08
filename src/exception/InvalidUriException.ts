import CommonException from "./CommonException";

export default class InvalidUriException extends CommonException {
    constructor(message?: string) {
        super("uri not found", 404);
        if (message) {
            this.message += `: ${message}`;
        }
    }
}
