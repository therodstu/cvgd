// User management service
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface User {
  id: number;
  email: string;
  name: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'viewer' | 'editor';
  created_at?: string;
  updated_at?: string;
  active?: number;
}

export interface CreateUserData {
  email: string;
  name: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  role?: 'admin' | 'viewer' | 'editor';
}

class UserService {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // Login user
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store token
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      // Provide more helpful error messages
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please ensure the backend server is running on ' + API_URL);
      }
      throw error;
    }
  }

  // Logout user
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  // Get current user
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  // Get current user info from server
  async getCurrentUserInfo(): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const user = await response.json();
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Create user (admin only)
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(error.error || 'Failed to create user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      // Provide more helpful error messages
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please ensure the backend server is running on ' + API_URL);
      }
      throw error;
    }
  }

  // Update user (admin only)
  async updateUser(id: number, updates: Partial<CreateUserData & { active: boolean }>): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user (admin only)
  async deleteUser(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

export const userService = new UserService();


