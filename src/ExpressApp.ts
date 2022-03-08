import Express from "express";
import http from "http";
import BaseController from "./controller/BaseController";
import auth from "./middleware/Auth";
import errorHandler from "./middleware/ErrorHandler";

export default class ExpressApp {
    private app: Express.Application;
    private port: number;

    constructor(port: number, controllers?: BaseController[]) {
        this.app = Express();
        this.port = port || 3000;

        this.setMiddleware();
        if (controllers) {
            this.setController(controllers);
        }
        // 예외처리 미들웨어는 express middleware 가장 맨 뒤에 위치
        this.app.use(errorHandler);
    }

    private setMiddleware(): void {
        // 기본적인 express middleware를 탑재
        this.app.use(Express.json());
        this.app.use(Express.urlencoded({ extended: false }));

        // 프로젝트에 사용될 커스텀 미들웨어를 탑재
        this.app.use(auth); // 인증 미들웨어
    }

    private setController(controllers: BaseController[]): void {
        controllers.forEach((controller) => {
            this.app.use(controller.getUri(), controller.getRouter());
        });
    }

    startServer(): http.Server {
        return this.app.listen(this.port, () => {
            console.log(`server started at port ${this.port}`);
        });
    }
}
