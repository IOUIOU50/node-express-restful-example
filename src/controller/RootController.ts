import SQLiteRootRepository from "../database/repository/SQLiteRootRepository";
import serviceHandler from "../lib/ServiceHandler";
import RootService from "../service/RootService";
import BaseController from "./BaseController";

export default class RootController extends BaseController {
    private rootService: RootService;

    constructor(uri: string) {
        super(uri);
        this.rootService = new RootService(new SQLiteRootRepository());
        this.initRouter();
    }

    initRouter(): void {
        this.router.post("/", serviceHandler(this.rootService.getToken));
    }
}
