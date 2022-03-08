import { Request, Response, NextFunction } from "express";
import InvalidAuthorizedTokenException from "../exception/InvalidAuthorizedTokenException";
import { verify } from "../lib/jwt";

const bypassPathList = [["/", "POST"]];

/** 클라이언트의 모든 요청은 첫 번째로 auth 미들웨어를 거친다. */
export const auth = (req: Request, res: Response, next: NextFunction) => {
    try {
        /** 헤더에 jwt token 확인 */
        const token = req.headers["authorization"];

        /**
         * token이 없는 두 가지 상황
         * 1. 사용자 등록 - 토큰을 발급받아야 하는 상황이기 때문에 토큰이 없음
         * 2. /book 경로의 자원을 요청하려고 하나 토큰이 없음 -> exception 발생
         */
        if (!token) {
            const { path, method } = req;
            // case #1: pass
            if (isBypass(path, method)) {
                return next();
            }
            // case #2: throw exception
            throw new InvalidAuthorizedTokenException("no authrozed token");
        }

        /* 헤더에 토큰을 검증하여, 클라이언트가 유효한 직원인 지 확인 */
        const user = verify(String(token));
        if (!user) {
            throw new InvalidAuthorizedTokenException("no user matched token");
        }

        /* 유효한 직원임을 확인 */
        req.user = user as string;
        next();
    } catch (error) {
        next(error);
    }
};

function isBypass(path: string, method: string) {
    for (const bypass of bypassPathList) {
        const [bypassPath, bypassMethod] = bypass;
        if (bypassPath === path && bypassMethod === method) {
            return true;
        }
    }
    return false;
}

export default auth;
