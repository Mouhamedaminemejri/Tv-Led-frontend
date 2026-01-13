"use client";

// ============================================================================
// AUTH CONTEXT - Global Authentication State Management
// ============================================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import type {
    User,
    AuthState,
    AuthAction,
    LoginCredentials,
    RegisterCredentials,
    OAuthCredentials,
} from "@/types/auth";
import { AuthService, TokenManager } from "@/services/auth-service";

// ============================================================================
// Context Types
// ============================================================================

interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<{ requiresVerification: boolean }>;
    loginWithGoogle: () => void;
    loginWithFacebook: () => void;
    loginWithApple: () => void;
    handleOAuthCallback: (params: URLSearchParams) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    refreshUser: () => Promise<void>;
    updateProfile: (data: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'avatar'>>) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

// ============================================================================
// Initial State & Reducer
// ============================================================================

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case "AUTH_START":
            return { ...state, isLoading: true, error: null };
        case "AUTH_SUCCESS":
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        case "AUTH_ERROR":
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload,
            };
        case "AUTH_LOGOUT":
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            };
        case "AUTH_CLEAR_ERROR":
            return { ...state, error: null };
        case "AUTH_UPDATE_USER":
            return {
                ...state,
                user: state.user ? { ...state.user, ...action.payload } : null,
            };
        default:
            return state;
    }
}

// ============================================================================
// Context Creation
// ============================================================================

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Auth Provider Component
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = React.useReducer(authReducer, initialState);
    const router = useRouter();

    // -------------------------------------------------------------------------
    // Initialize auth state on mount
    // -------------------------------------------------------------------------
    React.useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Check for stored user
                const storedUser = TokenManager.getStoredUser();
                const accessToken = TokenManager.getAccessToken();

                if (storedUser && accessToken && !TokenManager.isTokenExpired(accessToken)) {
                    dispatch({ type: "AUTH_SUCCESS", payload: storedUser });
                    
                    // Optionally refresh user data in background
                    AuthService.getCurrentUser()
                        .then((user) => dispatch({ type: "AUTH_SUCCESS", payload: user }))
                        .catch(() => {/* Ignore background refresh errors */});
                } else if (accessToken && TokenManager.isTokenExpired(accessToken)) {
                    // Try to refresh token
                    try {
                        await AuthService.refreshToken();
                        const user = await AuthService.getCurrentUser();
                        dispatch({ type: "AUTH_SUCCESS", payload: user });
                    } catch {
                        TokenManager.clearTokens();
                        dispatch({ type: "AUTH_LOGOUT" });
                    }
                } else {
                    dispatch({ type: "AUTH_LOGOUT" });
                }
            } catch {
                dispatch({ type: "AUTH_LOGOUT" });
            }
        };

        initializeAuth();
    }, []);

    // -------------------------------------------------------------------------
    // Auth Methods
    // -------------------------------------------------------------------------

    const login = React.useCallback(async (credentials: LoginCredentials) => {
        dispatch({ type: "AUTH_START" });
        try {
            const response = await AuthService.login(credentials);
            dispatch({ type: "AUTH_SUCCESS", payload: response.user });
            router.push("/");
        } catch (error: any) {
            const message = error?.message || "Login failed. Please check your credentials.";
            dispatch({ type: "AUTH_ERROR", payload: message });
            throw error;
        }
    }, [router]);

    const register = React.useCallback(async (credentials: RegisterCredentials) => {
        dispatch({ type: "AUTH_START" });
        try {
            const response = await AuthService.register(credentials);
            
            if (!response.requiresVerification) {
                dispatch({ type: "AUTH_SUCCESS", payload: response.user });
                router.push("/");
            } else {
                dispatch({ type: "AUTH_LOGOUT" });
            }
            
            return { requiresVerification: response.requiresVerification };
        } catch (error: any) {
            const message = error?.message || "Registration failed. Please try again.";
            dispatch({ type: "AUTH_ERROR", payload: message });
            throw error;
        }
    }, [router]);

    const loginWithGoogle = React.useCallback(() => {
        const url = AuthService.getGoogleOAuthUrl();
        window.location.href = url;
    }, []);

    const loginWithFacebook = React.useCallback(() => {
        const url = AuthService.getFacebookOAuthUrl();
        window.location.href = url;
    }, []);

    const loginWithApple = React.useCallback(() => {
        const url = AuthService.getAppleOAuthUrl();
        window.location.href = url;
    }, []);

    const handleOAuthCallback = React.useCallback(async (params: URLSearchParams) => {
        dispatch({ type: "AUTH_START" });
        try {
            const response = AuthService.handleOAuthCallback(params);
            
            if (response) {
                // If user data was in the callback, use it
                if (response.user) {
                    dispatch({ type: "AUTH_SUCCESS", payload: response.user });
                } else {
                    // Otherwise, fetch user profile
                    const user = await AuthService.getCurrentUser();
                    dispatch({ type: "AUTH_SUCCESS", payload: user });
                }
                router.push("/");
            } else {
                throw { message: "OAuth authentication failed" };
            }
        } catch (error: any) {
            const message = error?.message || "OAuth login failed. Please try again.";
            dispatch({ type: "AUTH_ERROR", payload: message });
            throw error;
        }
    }, [router]);

    const logout = React.useCallback(async () => {
        dispatch({ type: "AUTH_START" });
        try {
            await AuthService.logout();
        } finally {
            dispatch({ type: "AUTH_LOGOUT" });
            router.push("/");
        }
    }, [router]);

    const clearError = React.useCallback(() => {
        dispatch({ type: "AUTH_CLEAR_ERROR" });
    }, []);

    const refreshUser = React.useCallback(async () => {
        try {
            const user = await AuthService.getCurrentUser();
            dispatch({ type: "AUTH_SUCCESS", payload: user });
        } catch {
            // Ignore refresh errors
        }
    }, []);

    const updateProfile = React.useCallback(async (
        data: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'avatar'>>
    ) => {
        try {
            const updatedUser = await AuthService.updateProfile(data);
            dispatch({ type: "AUTH_UPDATE_USER", payload: updatedUser });
        } catch (error: any) {
            const message = error?.message || "Failed to update profile.";
            throw new Error(message);
        }
    }, []);

    const changePassword = React.useCallback(async (
        currentPassword: string,
        newPassword: string
    ) => {
        try {
            await AuthService.changePassword({ currentPassword, newPassword });
        } catch (error: any) {
            const message = error?.message || "Failed to change password.";
            throw new Error(message);
        }
    }, []);

    // -------------------------------------------------------------------------
    // Context Value
    // -------------------------------------------------------------------------

    const contextValue = React.useMemo<AuthContextType>(
        () => ({
            ...state,
            login,
            register,
            loginWithGoogle,
            loginWithFacebook,
            loginWithApple,
            handleOAuthCallback,
            logout,
            clearError,
            refreshUser,
            updateProfile,
            changePassword,
        }),
        [state, login, register, loginWithGoogle, loginWithFacebook, loginWithApple, handleOAuthCallback, logout, clearError, refreshUser, updateProfile, changePassword]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================================================
// Custom Hook
// ============================================================================

export function useAuth() {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// ============================================================================
// Auth Guard HOC
// ============================================================================

export function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    options?: { redirectTo?: string }
) {
    const { redirectTo = "/auth/login" } = options || {};

    return function AuthGuard(props: P) {
        const { isAuthenticated, isLoading } = useAuth();
        const router = useRouter();

        React.useEffect(() => {
            if (!isLoading && !isAuthenticated) {
                router.push(redirectTo);
            }
        }, [isAuthenticated, isLoading, router]);

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            );
        }

        if (!isAuthenticated) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };
}

// ============================================================================
// Guest Guard HOC (for auth pages - redirect if already logged in)
// ============================================================================

export function withGuest<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    options?: { redirectTo?: string }
) {
    const { redirectTo = "/" } = options || {};

    return function GuestGuard(props: P) {
        const { isAuthenticated, isLoading } = useAuth();
        const router = useRouter();

        React.useEffect(() => {
            if (!isLoading && isAuthenticated) {
                router.push(redirectTo);
            }
        }, [isAuthenticated, isLoading, router]);

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            );
        }

        if (isAuthenticated) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };
}
