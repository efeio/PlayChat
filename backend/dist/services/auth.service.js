import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
const SALT_ROUNDS = 10;
function generateToken(userId, username) {
    return jwt.sign({ userId, username }, env.JWT_SECRET, { expiresIn: '7d' });
}
export async function registerUser(input) {
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ email: input.email }, { username: input.username }],
        },
    });
    if (existingUser) {
        throw new Error(existingUser.email === input.email
            ? 'Email already in use'
            : 'Username already taken');
    }
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await prisma.user.create({
        data: {
            username: input.username,
            displayName: input.displayName,
            email: input.email,
            passwordHash,
            provider: 'LOCAL',
            stats: {
                create: {},
            },
        },
    });
    const token = generateToken(user.id, user.username);
    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
        },
    };
}
export async function loginUser(input) {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
    });
    if (!user) {
        throw new Error('Invalid email or password');
    }
    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
        throw new Error('Invalid email or password');
    }
    await prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true, lastSeen: new Date() },
    });
    const token = generateToken(user.id, user.username);
    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
        },
    };
}
//# sourceMappingURL=auth.service.js.map