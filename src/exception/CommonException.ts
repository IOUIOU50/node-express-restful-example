export default class CommonException extends Error {
    status: number;
    constructor(message?: string, status?: number) {
        super(message || "unknownError");
        this.status = status || 500;
    }
}
