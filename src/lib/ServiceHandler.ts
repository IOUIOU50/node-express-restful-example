import { Request, Response, NextFunction } from "express";

export const serviceHandler =
    (handler: (req: Request, res: Response) => any) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { status, result } = handler(req, res);
            res.status(status);
            if (status === 204) {
                res.end();
                return next();
            }
            res.json(result);
            next();
        } catch (error) {
            next(error);
        }
    };

export default serviceHandler;
