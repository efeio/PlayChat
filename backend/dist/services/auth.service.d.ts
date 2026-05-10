export interface RegisterInput {
    username: string;
    displayName: string;
    email: string;
    password: string;
}
export interface LoginInput {
    email: string;
    password: string;
}
export interface AuthResult {
    token: string;
    user: {
        id: string;
        username: string;
        displayName: string;
        email: string;
    };
}
export declare function registerUser(input: RegisterInput): Promise<AuthResult>;
export declare function loginUser(input: LoginInput): Promise<AuthResult>;
//# sourceMappingURL=auth.service.d.ts.map