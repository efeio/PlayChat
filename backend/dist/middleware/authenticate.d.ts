import type { FastifyRequest, FastifyReply } from 'fastify';
export interface JwtPayload {
    userId: string;
    username: string;
}
declare module 'fastify' {
    interface FastifyRequest {
        user?: JwtPayload;
    }
}
export declare function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
//# sourceMappingURL=authenticate.d.ts.map