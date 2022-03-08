import BookController from "./controller/BookController";
import RootController from "./controller/RootController";
import ExpressApp from "./ExpressApp";

new ExpressApp(3000, [
    new RootController("/"),
    new BookController("/book"),
]).startServer();
