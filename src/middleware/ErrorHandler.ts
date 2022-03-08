import { Request, Response, NextFunction } from "express";

const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!err.status) {
        /**
         * 처리하지 않은 예외가 발생
         * log를 저장해 두었다가 확인할 필요가 있음
         * 현재는 서버 콘솔에 출력
         */
        console.log(err);

        res.status(500).json({
            message: "unknown error",
        });
        return next();
    }

    res.status(err.status).json({
        message: err.message,
    });
    next();
};

export default errorHandler;
