import { register, login } from '../controllers/auth.controller.js';
export async function authRoutes(app) {
    app.post('/api/auth/register', register);
    app.post('/api/auth/login', login);
}
//# sourceMappingURL=auth.routes.js.map