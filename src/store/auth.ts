import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  avatar?: string | null;
  emailVerified?: boolean;
  role?: 'USER' | 'ADMIN' | 'MODERATOR';
  blogs: Blog[];
}

export interface Blog {
  id: string;
  name: string;
  url: string;
  title: string;
  description?: string;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
};

// Persist auth state in localStorage (user data only, not tokens)
// Tokens are managed via HttpOnly cookies
export const authAtom = atomWithStorage<AuthState>('auth', initialAuthState);

// Derived atoms
export const isAuthenticatedAtom = atom(get => get(authAtom).isAuthenticated);
export const userAtom = atom(get => get(authAtom).user);

// Action atoms
export const loginAtom = atom(
  null,
  (_get, set, user: User) => {
    set(authAtom, {
      isAuthenticated: true,
      user,
    });
  }
);

export const logoutAtom = atom(null, (_get, set) => {
  set(authAtom, initialAuthState);
});

