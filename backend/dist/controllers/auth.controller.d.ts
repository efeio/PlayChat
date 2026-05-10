import type { FastifyRequest, FastifyReply } from 'fastify';
interface RegisterBody {
    username: string;
    displayName: string;
    email: string;
    password: string;
}
interface LoginBody {
    email: string;
    password: string;
}
export declare function register(request: FastifyRequest<{
    Body: RegisterBody;
}>, reply: FastifyReply): Promise<never>;
export declare function login(request: FastifyRequest<{
    Body: LoginBody;
}>, reply: FastifyReply): Promise<never>;
export {};
//# sourceMappingURL=auth.controller.d.ts.map