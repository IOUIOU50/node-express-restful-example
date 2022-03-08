import { Router } from "express";

export default abstract class BaseController {
    protected router: Router;
    protected uri: string;

    constructor(uri: string) {
        this.router = Router();
        this.uri = uri;
    }

    protected abstract initRouter(): void;

    getUri() {
        return this.uri;
    }

    getRouter(): Router {
        return this.router;
    }
}
