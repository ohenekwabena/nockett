import { createClient } from "@/api/supabase/client";
import { AuthError, User } from "@supabase/supabase-js";

export interface AuthResponse {
  user?: User | null;
  error?: AuthError | null;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  private supabase = createClient();

  /**
   * Sign up a new user with email and password
   */
  async signUp({ email, password, firstName, lastName }: SignUpData): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: firstName && lastName ? `${firstName} ${lastName}` : undefined,
          },
        },
      });

      return {
        user: data.user,
        error,
      };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign in user with email and password
   */
  async signIn({ email, password }: SignInData): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      return {
        user: data.user,
        error,
      };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error?: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  /**
   * Get the current user session
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      return {
        user: data.user,
        error,
      };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  /**
   * Reset password - sends reset email
   */
  async resetPassword(email: string): Promise<{ error?: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  /**
   * Update password (user must be authenticated)
   */
  async updatePassword(newPassword: string): Promise<{ error?: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  /**
   * Update user metadata
   */
  async updateProfile(updates: { firstName?: string; lastName?: string; email?: string }): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        email: updates.email,
        data: {
          first_name: updates.firstName,
          last_name: updates.lastName,
          full_name: updates.firstName && updates.lastName ? `${updates.firstName} ${updates.lastName}` : undefined,
        },
      });

      return {
        user: data.user,
        error,
      };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign in with OAuth provider (Google, GitHub, etc.)
   */
  async signInWithProvider(provider: "google" | "github" | "discord"): Promise<{ error?: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data } = await this.supabase.auth.getSession();
      return !!data.session;
    } catch {
      return false;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  }
}

// Export a singleton instance
export const authService = new AuthService();

// Export individual functions for convenience
export const {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  resetPassword,
  updatePassword,
  updateProfile,
  signInWithProvider,
  isAuthenticated,
  onAuthStateChange,
} = authService;
