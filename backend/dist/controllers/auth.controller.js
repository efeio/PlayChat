import { registerUser, loginUser } from '../services/auth.service.js';
export async function register(request, reply) {
    const { username, displayName, email, password } = request.body;
    if (!username || !displayName || !email || !password) {
        return reply.status(400).send({ error: 'All fields are required' });
    }
    if (password.length < 6) {
        return reply.status(400).send({ error: 'Password must be at least 6 characters' });
    }
    try {
        const result = await registerUser({ username, displayName, email, password });
        return reply.status(201).send(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        return reply.status(400).send({ error: message });
    }
}
export async function login(request, reply) {
    const { email, password } = request.body;
    if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
    }
    try {
        const result = await loginUser({ email, password });
        return reply.status(200).send(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        return reply.status(401).send({ error: message });
    }
}
//# sourceMappingURL=auth.controller.js.map