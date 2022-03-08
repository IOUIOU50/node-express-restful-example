import Sqlite3 from "better-sqlite3";
import IBookRepository from "./interface/IBookRepository";
import SQLiteConnector from "../connector/SQLiteConnector";
import InsufficientRequestDataException from "../../exception/InsufficientRequestDataException";
import InvalidUriException from "../../exception/InvalidUriException";
import { isValidDate, isNumeric } from "../../lib/util";
import InvalidAuthorizedTokenException from "../../exception/InvalidAuthorizedTokenException";
import AlreadyExistResourceException from "../../exception/AlreadyExistResourceException";

export default class SQLiteBookRepository implements IBookRepository {
    private connection: Sqlite3.Database;
    private selectQuery: string;
    private bookColumns: string[];
    private foreignConstraintColumns: string[];

    constructor() {
        this.connection = SQLiteConnector.getInstance();
        this.selectQuery =
            "select book.id as serial, book.price, book.title, book.release, " +
            "author.name as author, publisher.name as publisher, category.name as category, staff.name as staff from book " +
            "join staff on staff.id=book.staff_id " +
            "join author on author.id=book.author_id " +
            "join publisher on publisher.id=book.publisher_id " +
            "join category on category.id=book.category_id ";
        this.foreignConstraintColumns = [];
        this.bookColumns = this.connection
            .prepare("SELECT name FROM PRAGMA_TABLE_INFO('book');")
            .all()
            .map((objColumn: { name: string }) => {
                const column = objColumn.name.replace(/\_.*/, "");
                if (objColumn.name.includes("_id")) {
                    this.foreignConstraintColumns.push(column);
                }
                return column;
            });
    }

    insertBook(information: Domain.Book): Domain.ResultInsertBook {
        // 새로운 자원을 생성하기 위해 필요한 정보들이 모두 있는지 확인
        // price, title, release, staff, author, publisher, category
        const requestColumns = Object.keys(information);
        for (const columns of this.bookColumns) {
            if (!requestColumns.includes(columns) && columns !== "id") {
                throw new InsufficientRequestDataException(
                    `need '${columns}' `
                );
            }
        }
        this.connection.exec("BEGIN TRANSACTION;");
        try {
            /**
             * 중복확인
             * 중복된 책의 기준: 작가, 제목, 출판사
             * ISBN을 비교하면 확실하나, 정확한 ISBN을 사용하기 위해서는 외부 API가 필요
             * 이런 제약사항으로 현 프로젝트에서는 위의 기준으로 중복 여부를 판단
             */
            const isConflict = this.connection
                .prepare(
                    "select book.id, book.title as title, author.name as author, publisher.name as publisher from book " +
                        "join author on book.author_id=author.id " +
                        "join publisher on book.publisher_id=publisher.id " +
                        "where title=? and author=? and publisher=?;"
                )
                .get(
                    information.title,
                    information.author,
                    information.publisher
                );
            if (isConflict) {
                throw new AlreadyExistResourceException("duplicated book");
            }

            // staff 테이블에 대한 참조 확인
            let staffId = this.connection
                .prepare("select id from staff where uuid=?;")
                .get(information.staff);
            if (!staffId) {
                // staff 테이블에 staff 정보가 없음
                throw new InsufficientRequestDataException( // staff는 다른 테이블과 달리 먼저 등록한 뒤에 수행할 것
                    "no matching staff. please register staff first."
                );
            } else {
                staffId = staffId.id;
            }

            // author 테이블에 대한 참조 확인
            let authorId = this.connection
                .prepare("select id from author where name=?;")
                .get(information.author);
            if (!authorId) {
                authorId = this.connection
                    .prepare("insert into author(name) values(?);")
                    .run(information.author).lastInsertRowid;
            } else {
                authorId = authorId.id;
            }

            // publisher 테이블에 대한 참조 확인
            let publisherId = this.connection
                .prepare("select id from publisher where name=?;")
                .get(information.publisher);
            if (!publisherId) {
                // 새로운 출판사의 책
                publisherId = this.connection
                    .prepare("insert into publisher(name) values(?);")
                    .run(information.publisher).lastInsertRowid;
            } else {
                publisherId = publisherId.id;
            }

            // category 테이블에 대한 참조 확인
            let categoryId = this.connection
                .prepare("select id from category where name=?;")
                .get(information.category);
            if (!categoryId) {
                // 새로운 카테고리의 책
                categoryId = this.connection
                    .prepare("insert into category(name) values(?);")
                    .run(information.category).lastInsertRowid;
            } else {
                categoryId = categoryId.id;
            }

            // formatting check
            // release 는 date 형식('yyyy-mm-dd')을 따라야 함
            if (!isValidDate(information.release as string)) {
                throw new InsufficientRequestDataException(
                    "date format must be 'yyyy-mm-dd'"
                );
            }
            // price는 number값만을 가져야 함
            if (!isNumeric(information.price as string)) {
                throw new InsufficientRequestDataException(
                    "price must be numeric"
                );
            }

            // 데이터베이스에 새로운 책 정보 삽입
            const serial = this.connection
                .prepare(
                    "insert into book(price, title, release, staff_id, author_id, publisher_id, category_id) values(?,?,?,?,?,?,?);"
                )
                .run(
                    information.price,
                    information.title,
                    information.release,
                    staffId,
                    authorId,
                    publisherId,
                    categoryId
                ).lastInsertRowid;

            this.connection.exec("COMMIT;");
            return {
                serial: serial,
                bookInfo: information,
            };
        } catch (error: any) {
            this.connection.exec("ROLLBACK;");
            throw error;
        }
    }

    selectBook(options?: Domain.SearchOption): Domain.Book[] {
        let sql = this.selectQuery;
        if (options?.where) {
            const { key, value } = options.where;
            if (!this.bookColumns.includes(key) && key !== "serial") {
                throw new InvalidUriException(`no ${key} field`);
            }

            switch (key) {
                case "serial":
                    sql += `where serial=${value} `;
                    break;
                case "release":
                    const [from, to] = value.split("to");
                    sql += `where release between date('${from}') and date('${to}') `;
                    break;
                case "price":
                    const [min, max] = value.split("to");
                    sql += `where price between ${min} and ${max} `;
                    break;
                default:
                    sql += `where ${key} like '%${value}%' `;
                    break;
            }
            if (options.order === "asc" || options.order === "desc") {
                sql += `order by ${key} ${options.order}`;
            }
        }
        return this.connection.prepare(sql + ";").all();
    }

    updateBook(serial: number, columns: Domain.Book) {
        /** 시리얼에 해당하는 책 정보가 있는지 확인 */
        let sql = `select id from book where id=?;`;
        if (this.connection.prepare(sql).all(serial).length < 1) {
            throw new InvalidUriException(`no content on serial ${serial}`);
        }

        /** body에 들어온 변경하고자 하는 데이터가 유효한지 확인 */
        const keys = Object.keys(columns);
        if (keys.includes("serial") || keys.includes("id")) {
            throw new InsufficientRequestDataException(
                `serial is unchangeable`
            );
        }
        for (const key of keys) {
            if (!this.bookColumns.includes(key)) {
                throw new InsufficientRequestDataException(
                    `${key} is not exists`
                );
            }
        }

        this.connection.exec("BEGIN TRANSACTION;");
        try {
            for (const [key, value] of Object.entries(columns)) {
                if (this.foreignConstraintColumns.includes(key)) {
                    /** 외래키 제약조건이 있는 컬럼에 대해서는 해당 테이블의 데이터 확인 후, 없다면 먼저 삽입이 이루어져야 함 */
                    sql = `select id from ${key} where name=?;`;
                    if (this.connection.prepare(sql).all(value).length < 1) {
                        sql = `insert into ${key}(name) values(?);`;
                        const { lastInsertRowid } = this.connection
                            .prepare(sql)
                            .run(value);
                        sql = `update book set ${key}_id=${lastInsertRowid} where id=${serial};`;
                        this.connection.prepare(sql).run();
                    }
                } else {
                    /** 외래키 제약조건이 없는 컬럼에 대해서는 유효한 데이터인지 확인 후 데이터 변경 */
                    if (key === "price" && !isNumeric(value)) {
                        throw new InsufficientRequestDataException(
                            "price must be numeric"
                        );
                    }
                    if (key === "release" && !isValidDate(value)) {
                        throw new InsufficientRequestDataException(
                            "date format must be 'yyyy-mm-dd'"
                        );
                    }
                    sql = `update book set ${key}=? where id=${serial};`;
                    this.connection.prepare(sql).run(value);
                }
            }
            this.connection.exec("COMMIT;");
        } catch (error) {
            this.connection.exec("ROLLBACK;");
            throw error;
        }
    }

    deleteBook(user: string, serial: number) {
        /**
         * 시리얼에 해당하는 책이 있는지 확인함과 동시에 해당 책을 삽입한 직원의 id를 받아옴
         * 책정보가 있는가? && 있으면 그 책을 삽입한 직원의 id를 가져온다.
         */
        this.connection.exec("BEGIN TRANSACTION;");
        try {
            let sql = `select staff_id as inChargeStaffId from book where id=?;`;
            let result = this.connection.prepare(sql).get(serial);
            if (!result) {
                throw new InvalidUriException(`no content on serial ${serial}`);
            }
            const inChargeStaffId = result.inChargeStaffId;

            /** 책 정보 삭제는 책을 삽입한 직원만이 삭제할 수 있음 -> api 인증 jwt에 직원 uuid가 포함되어 있음 */
            sql = "select id as clientId from staff where uuid=?;";
            result = this.connection.prepare(sql).get(user);
            if (!result) {
                throw new InsufficientRequestDataException( // staff는 다른 테이블과 달리 먼저 등록한 뒤에 수행할 것
                    "no matching staff. please register staff first."
                );
            }
            const clientId = result.clientId;

            if (clientId !== inChargeStaffId) {
                throw new InvalidAuthorizedTokenException(
                    "permission denied. only a staff who created resource can delete the resource"
                );
            }

            sql = "delete from book where id=?;";
            this.connection.prepare(sql).run(serial);
            this.connection.exec("COMMIT;");
        } catch (error) {
            this.connection.exec("ROLLBACK;");
            throw error;
        }
    }
}
