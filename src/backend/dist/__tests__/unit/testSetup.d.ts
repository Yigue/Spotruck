/**
 * Shared test setup — must be imported BEFORE any router modules.
 * Mocks Prisma, config, bcrypt, and jsonwebtoken.
 * Provides mockReq with proper Express req shape including headers/auth.
 */
export declare function mockReq(body?: {}, params?: {}, query?: {}, user?: {
    sub: string;
    role: string;
    email: string;
}): {
    body: {};
    params: {};
    query: {};
    user: {
        sub: string;
        role: string;
        email: string;
    };
    headers: {
        authorization: string;
    };
};
export declare function mockRes(): any;
export declare function mockNext(): import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
//# sourceMappingURL=testSetup.d.ts.map