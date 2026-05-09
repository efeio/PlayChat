export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
}

export interface AuthResult {
  token: string;
  user: User;
}
