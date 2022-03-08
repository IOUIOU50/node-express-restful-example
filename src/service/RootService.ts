import { v4 } from "uuid";
import IRootRepository from "../database/repository/interface/IRootRepository";
import { sign } from "../lib/jwt";
import { Request, Response } from "express";

export default class RootService {
    private rootRepository: IRootRepository;
    constructor(rootRepository: IRootRepository) {
        this.rootRepository = rootRepository;
    }

    getToken = (req: Request, res: Response) => {
        const { staff } = req.body;
        const uuid = v4();
        this.rootRepository.registerStaff(staff, uuid);
        return {
            status: 201,
            result: {
                staff: sign(uuid),
            },
        };
    };
}
