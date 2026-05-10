import jwt from 'jsonwebtoken';
import env from '../config/env.js';
export async function authenticate(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.status(401).send({ error: 'Authentication required' });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        reply.status(401).send({ error: 'Invalid token format' });
        return;
    }
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        request.user = decoded;
    }
    catch {
        reply.status(401).send({ error: 'Invalid or expired token' });
    }
}
//# sourceMappingURL=authenticate.js.map