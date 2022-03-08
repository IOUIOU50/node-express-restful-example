import SQLiteBookRepository from "../database/repository/SQLiteBookRepository";
import serviceHandler from "../lib/ServiceHandler";
import BookService from "../service/BookService";
import BaseController from "./BaseController";

export default class BookController extends BaseController {
    private bookService: BookService;

    constructor(uri: string) {
        super(uri);
        this.bookService = new BookService(new SQLiteBookRepository());
        this.initRouter();
    }

    initRouter(): void {
        this.router.post("/", serviceHandler(this.bookService.addBook));
        this.router.get("/", serviceHandler(this.bookService.searchBook));
        this.router.get(
            "/:key/:value",
            serviceHandler(this.bookService.searchBookWithOption)
        );
        this.router.patch(
            "/:serial",
            serviceHandler(this.bookService.updateBook)
        );
        this.router.delete(
            "/:serial",
            serviceHandler(this.bookService.deleteBook)
        );
    }
}
