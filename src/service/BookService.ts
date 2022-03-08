import { Request, Response } from "express";

import IBookRepository from "../database/repository/interface/IBookRepository";
import InsufficientRequestDataException from "../exception/InsufficientRequestDataException";
import InvalidUriException from "../exception/InvalidUriException";
import { isNumeric } from "../lib/util";

export default class BookService {
    private bookRepository: IBookRepository;

    constructor(bookRepository: IBookRepository) {
        this.bookRepository = bookRepository;
    }

    addBook = (req: Request, res: Response) => {
        const { user: staff } = req;
        const information = req.body;
        information["staff"] = staff;

        const result = this.bookRepository.insertBook(information);
        return {
            status: 201,
            result: result,
        };
    };

    searchBook = (req: Request, res: Response) => {
        return { status: 200, result: this.bookRepository.selectBook() };
    };

    searchBookWithOption = (req: Request, res: Response) => {
        const { key, value } = req.params;

        const order = req.query.order ? (req.query.order as string) : undefined;
        const result = key
            ? order
                ? this.bookRepository.selectBook({
                      where: { key: key, value: value },
                      order: order as string,
                  })
                : this.bookRepository.selectBook({
                      where: { key: key, value: value },
                  })
            : this.bookRepository.selectBook();
        return { status: 200, result: result };
    };

    updateBook = (req: Request, res: Response) => {
        const { serial } = req.params;
        const columns = req.body;
        if (!isNumeric(serial)) {
            throw new InvalidUriException(`${serial}, serial must be number`);
        }
        if (!columns) {
            throw new InsufficientRequestDataException();
        }
        this.bookRepository.updateBook(Number(serial), columns);
        return { status: 204, result: null };
    };

    deleteBook = (req: Request, res: Response) => {
        const user = req.user;
        const serial = req.params.serial;
        if (!isNumeric(serial)) {
            throw new InvalidUriException(`${serial}, serial must be numeric`);
        }
        this.bookRepository.deleteBook(user, Number(serial));
        return { status: 204, result: null };
    };
}
