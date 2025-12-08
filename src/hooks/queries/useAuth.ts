import { useMutation, useQuery } from '@tanstack/react-query';
import { useSetAtom, useAtom } from 'jotai';

import { authApi, type LoginData, type RegisterData, type UserSession } from '@/services/api/auth.api';
import { loginAtom, logoutAtom, userAtom } from '@/store/auth';

export function useAuth() {
  const setLogin = useSetAtom(loginAtom);
  const setLogout = useSetAtom(logoutAtom);
  const [user] = useAtom(userAtom);

  const loginMutation = useMutation<UserSession, Error, LoginData>({
    mutationFn: async ({ emailOrUsername, password }: LoginData) => {
      try {
        const userSession = await authApi.login({ emailOrUsername, password });

        const fullUser = {
          ...userSession,
          blogs: [], // You can add blogs later if needed
        };

        setLogin(fullUser);

        return fullUser;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Login failed');
      }
    },
  });

  const registerMutation = useMutation<UserSession, Error, RegisterData>({
    mutationFn: async (data: RegisterData) => {
      try {
        const userSession = await authApi.register(data);

        const fullUser = {
          ...userSession,
          blogs: [],
        };

        setLogin(fullUser);

        return fullUser;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Registration failed');
      }
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      // Call logout API to clear cookies
      await authApi.logout();
      setLogout();
    },
  });

  const changePasswordMutation = useMutation<void, Error, { currentPassword: string; newPassword: string }>({
    mutationFn: async ({ currentPassword, newPassword }) => {
      if (!user?.id) throw new Error('Not authenticated');
      await authApi.changePassword(user.id, currentPassword, newPassword);
    },
  });

  const requestPasswordResetMutation = useMutation<{ message: string }, Error, string>({
    mutationFn: async (emailOrUsername: string) => {
      return await authApi.requestPasswordReset(emailOrUsername);
    },
  });

  const resetPasswordMutation = useMutation<{ message: string }, Error, { token: string; newPassword: string }>({
    mutationFn: async ({ token, newPassword }) => {
      return await authApi.resetPassword(token, newPassword);
    },
  });

  const verifyEmailMutation = useMutation<{ message: string }, Error, string>({
    mutationFn: async (token: string) => {
      const result = await authApi.verifyEmail(token);
      // Refresh user data after verification
      if (user?.id) {
        try {
          const updatedUser = await authApi.refreshToken();
          setLogin({ ...updatedUser, blogs: user.blogs || [] });
        } catch (error) {
          // Token might be expired, ignore
        }
      }
      return result;
    },
  });

  const resendVerificationEmailMutation = useMutation<{ message: string }, Error, void>({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      return await authApi.resendVerificationEmail(user.id);
    },
  });

  const findAccountMutation = useMutation<{ username: string; message: string }, Error, string>({
    mutationFn: async (email: string) => {
      return await authApi.findAccountByEmail(email);
    },
  });

  // Check for existing session on mount using refresh token
  const currentUserQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        // Try to refresh the token (validates cookie and returns user)
        const userSession = await authApi.refreshToken();

        const fullUser = {
          ...userSession,
          blogs: [],
        };

        setLogin(fullUser);
        return fullUser;
      } catch (error) {
        // No valid session, clear auth state
        setLogout();
        return null;
      }
    },
    staleTime: Infinity, // User data doesn't go stale
    retry: false, // Don't retry if refresh fails
  });

  return {
    // Auth actions
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    changePassword: changePasswordMutation.mutateAsync,
    requestPasswordReset: requestPasswordResetMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    verifyEmail: verifyEmailMutation.mutateAsync,
    resendVerificationEmail: resendVerificationEmailMutation.mutateAsync,
    findAccount: findAccountMutation.mutateAsync,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isRequestingReset: requestPasswordResetMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isVerifyingEmail: verifyEmailMutation.isPending,
    isResendingVerification: resendVerificationEmailMutation.isPending,
    isFindingAccount: findAccountMutation.isPending,

    // User state
    currentUser: user,
    isLoadingUser: currentUserQuery.isLoading,

    // Errors
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    changePasswordError: changePasswordMutation.error,
    passwordResetError: requestPasswordResetMutation.error,
    resetPasswordError: resetPasswordMutation.error,
    verifyEmailError: verifyEmailMutation.error,
  };
}