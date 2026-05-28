import { User } from '../types';

export const mockAuth = {
  signup: async (name: string, email: string): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = { name, email };
        localStorage.setItem('user', JSON.stringify(user));
        resolve(user);
      }, 1000);
    });
  },
  login: async (email: string): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = { name: email.split('@')[0], email };
        localStorage.setItem('user', JSON.stringify(user));
        resolve(user);
      }, 1000);
    });
  },
  logout: () => {
    localStorage.removeItem('user');
  },
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
