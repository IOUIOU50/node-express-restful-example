namespace Express {
    interface Request {
        user: string;
    }
}

declare namespace Domain {
    export interface Book {
        id?: number;
        title?: string;
        price?: number | string;
        release?: string;
        staff?: string;
        author?: string;
        publisher?: string;
        category?: string;
    }

    export interface SearchOption {
        where?: {
            key: string;
            value: string;
        };
        order?: string;
    }

    export interface ResultInsertBook {
        serial: number | bigInt;
        bookInfo: Domain.Book;
    }
}
