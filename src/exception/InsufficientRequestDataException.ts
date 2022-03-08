import CommonException from "./CommonException";

export default class InsufficientRequestDataException extends CommonException {
    constructor(message?: string) {
        super("insufficient request data", 400);
        if (message) {
            this.message += ": " + message;
        }
    }
}
