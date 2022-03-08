import Sqlite3 from "better-sqlite3";
import InsufficientRequestDataException from "../../exception/InsufficientRequestDataException";
import SQLiteConnector from "../connector/SQLiteConnector";
import IRootRepotisory from "./interface/IRootRepository";

export default class SQLiteRootRepository implements IRootRepotisory {
    private connection: Sqlite3.Database;

    constructor() {
        this.connection = SQLiteConnector.getInstance();
    }

    registerStaff(staff: string, uuid: string): any {
        this.connection.exec("BEGIN TRANSACTION;");
        try {
            this.connection
                .prepare("insert into staff(name, uuid) values(?, ?);")
                .run(staff, uuid);
            this.connection.exec("COMMIT;");
        } catch (error) {
            this.connection.exec("ROLLBACK;");
            throw new InsufficientRequestDataException("recheck staff name.");
        }
    }
}
