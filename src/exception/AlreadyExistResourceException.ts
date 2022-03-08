import CommonException from "./CommonException";

export default class AlreadyExistResourceException extends CommonException {
    constructor(message?: string) {
        super("resource already exist", 409);
        if (message) {
            this.message += `: ${message}`;
        }
    }
}
