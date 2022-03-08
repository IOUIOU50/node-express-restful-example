export default interface IBookRepository {
    insertBook(information: Domain.Book): any;
    selectBook(options?: {
        where?: { key: string; value: string };
        order?: string;
    }): any;
    updateBook(serial: number, columns: Domain.Book): any;
    deleteBook(user: string, serial: number): any;
}
