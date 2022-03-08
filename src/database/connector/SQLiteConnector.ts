import Sqlite3 from "better-sqlite3";
import path from "path";
import fs from "fs";

export default class SQLiteConnector {
    private static SQLiteConnector: SQLiteConnector = new SQLiteConnector(
        "posicube"
    );
    private connection: Sqlite3.Database;

    private constructor(database: string) {
        database += ".db";
        try {
            // 'posicube' db가 존재하지 않으면 exception 발생
            this.connection = new Sqlite3(database, { fileMustExist: true });
        } catch (error: any) {
            // 'posicube' db가 존재하지 않음 -> db와 테이블을 먼저 생성
            this.connection = new Sqlite3(database);
            const initQueriesPath = path.join(
                process.env.PWD || path.resolve("./"),
                "sql",
                "init.sql"
            );
            let sql = fs.readFileSync(initQueriesPath).toString();
            this.connection.exec(sql);
        }
    }

    static getInstance() {
        return this.SQLiteConnector.connection;
    }
}
