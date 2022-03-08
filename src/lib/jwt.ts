import jwt from "jsonwebtoken";
require("dotenv").config();

const jwtSecret = process.env.JWTSECRET || "POSICUBE";

export const verify = (token: string, option?: jwt.VerifyOptions) =>
    jwt.verify(token, jwtSecret, option);
export const sign = (
    payload: string | object | Buffer,
    option?: jwt.SignOptions | undefined
) => {
    return jwt.sign(payload, jwtSecret, {
        algorithm: "HS256",
        ...option,
    });
};
