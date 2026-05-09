import { api } from './api';
import type { AuthResult } from '../types/user.types';

export async function registerUser(data: {
  username: string;
  displayName: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  return api.post<AuthResult>('/api/auth/register', data);
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  return api.post<AuthResult>('/api/auth/login', data);
}
