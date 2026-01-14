// ============================================================================
// AUTH SERVICE - API Communication Layer
// ============================================================================

import type {
    LoginCredentials,
    LoginResponse,
    RegisterCredentials,
    RegisterResponse,
    OAuthCredentials,
    OAuthResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    RefreshTokenResponse,
    User,
    AuthError,
} from '@/types/auth';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const AUTH_ENDPOINTS = {
    // Core authentication
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh',
    
    // User profile
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
    
    // Password reset (if implemented)
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    
    // Email verification (if implemented)
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    
    // OAuth - redirect endpoints
    oauthGoogle: '/auth/google',
    oauthGoogleCallback: '/auth/google/callback',
    oauthFacebook: '/auth/facebook',
    oauthFacebookCallback: '/auth/facebook/callback',
    oauthApple: '/auth/apple',
} as const;

// ============================================================================
// Token Management
// ============================================================================

const TOKEN_KEYS = {
    ACCESS: 'tv_partner_access_token',
    REFRESH: 'tv_partner_refresh_token',
    USER: 'tv_partner_user',
} as const;

export const TokenManager = {
    getAccessToken: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(TOKEN_KEYS.ACCESS);
    },

    getRefreshToken: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(TOKEN_KEYS.REFRESH);
    },

    setTokens: (accessToken: string, refreshToken: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
        localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
    },

    clearTokens: (): void => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(TOKEN_KEYS.ACCESS);
        localStorage.removeItem(TOKEN_KEYS.REFRESH);
        localStorage.removeItem(TOKEN_KEYS.USER);
    },

    getStoredUser: (): User | null => {
        if (typeof window === 'undefined') return null;
        const user = localStorage.getItem(TOKEN_KEYS.USER);
        return user ? JSON.parse(user) : null;
    },

    setStoredUser: (user: User): void => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
    },

    isTokenExpired: (token: string): boolean => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    },
};

// ============================================================================
// HTTP Client with Auth Headers
// ============================================================================

interface FetchOptions extends RequestInit {
    requiresAuth?: boolean;
}

async function authFetch<T>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const { requiresAuth = false, ...fetchOptions } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
    };

    if (requiresAuth) {
        const token = TokenManager.getAccessToken();
        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    if (!response.ok) {
        const error: AuthError = await response.json().catch(() => ({
            code: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred',
        }));
        throw error;
    }

    return response.json();
}

// ============================================================================
// Auth Service Methods
// ============================================================================

export const AuthService = {
    // -------------------------------------------------------------------------
    // Authentication
    // -------------------------------------------------------------------------

    /**
     * Login with email and password
     */
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const response = await authFetch<LoginResponse>(AUTH_ENDPOINTS.login, {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        TokenManager.setTokens(response.accessToken, response.refreshToken);
        TokenManager.setStoredUser(response.user);

        return response;
    },

    /**
     * Register a new account
     */
    async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
        // Strip frontend-only fields before sending to backend
        const { confirmPassword, acceptTerms, subscribeNewsletter, ...backendCredentials } = credentials;
        
        const response = await authFetch<RegisterResponse>(AUTH_ENDPOINTS.register, {
            method: 'POST',
            body: JSON.stringify(backendCredentials),
        });

        return response;
    },

    /**
     * Logout and clear tokens
     */
    async logout(): Promise<void> {
        try {
            await authFetch(AUTH_ENDPOINTS.logout, {
                method: 'POST',
                requiresAuth: true,
            });
        } catch {
            // Ignore errors on logout
        } finally {
            TokenManager.clearTokens();
        }
    },

    /**
     * Get current authenticated user
     */
    async getCurrentUser(): Promise<User> {
        const response = await authFetch<User>(AUTH_ENDPOINTS.profile, {
            requiresAuth: true,
        });

        TokenManager.setStoredUser(response);
        return response;
    },
    
    /**
     * Update user profile
     */
    async updateProfile(data: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'avatar'>>): Promise<User> {
        const response = await authFetch<User>(AUTH_ENDPOINTS.profile, {
            method: 'PUT',
            body: JSON.stringify(data),
            requiresAuth: true,
        });

        TokenManager.setStoredUser(response);
        return response;
    },

    /**
     * Change password
     */
    async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
        return authFetch<{ message: string }>(AUTH_ENDPOINTS.changePassword, {
            method: 'PUT',
            body: JSON.stringify(data),
            requiresAuth: true,
        });
    },

    /**
     * Refresh access token
     */
    async refreshToken(): Promise<RefreshTokenResponse> {
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken) {
            throw { code: 'NO_REFRESH_TOKEN', message: 'No refresh token available' };
        }

        const response = await authFetch<RefreshTokenResponse & { refreshToken?: string }>(
            AUTH_ENDPOINTS.refreshToken,
            {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
            }
        );

        TokenManager.setTokens(
            response.accessToken,
            response.refreshToken || refreshToken
        );

        return response;
    },

    // -------------------------------------------------------------------------
    // OAuth
    // -------------------------------------------------------------------------

    /**
     * Get OAuth URL for Google (redirect flow)
     * Backend handles the redirect to Google and back
     */
    getGoogleOAuthUrl(): string {
        return `${API_BASE_URL}${AUTH_ENDPOINTS.oauthGoogle}`;
    },

    /**
     * Get OAuth URL for Facebook (redirect flow)
     * Backend handles the redirect to Facebook and back
     */
    getFacebookOAuthUrl(): string {
        return `${API_BASE_URL}${AUTH_ENDPOINTS.oauthFacebook}`;
    },

    /**
     * Get OAuth URL for Apple (redirect flow)
     */
    getAppleOAuthUrl(): string {
        return `${API_BASE_URL}${AUTH_ENDPOINTS.oauthApple}`;
    },

    /**
     * Handle OAuth callback - extract tokens from URL params
     * Backend redirects with tokens in query/hash params
     */
    handleOAuthCallback(params: URLSearchParams): OAuthResponse | null {
        const accessToken = params.get('access_token') || params.get('token');
        const refreshToken = params.get('refresh_token');
        const userJson = params.get('user');
        const error = params.get('error');

        if (error) {
            throw { code: 'OAUTH_ERROR', message: error };
        }

        if (!accessToken) {
            return null;
        }

        let user: User | null = null;
        if (userJson) {
            try {
                user = JSON.parse(decodeURIComponent(userJson));
            } catch {
                // User data not in URL, will fetch from profile endpoint
            }
        }

        TokenManager.setTokens(accessToken, refreshToken || '');
        if (user) {
            TokenManager.setStoredUser(user);
        }

        return {
            accessToken,
            refreshToken: refreshToken || '',
            expiresIn: 3600,
            user: user!,
            isNewUser: params.get('is_new_user') === 'true',
        };
    },

    // -------------------------------------------------------------------------
    // Password Reset
    // -------------------------------------------------------------------------

    /**
     * Request password reset email
     */
    async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
        return authFetch<ForgotPasswordResponse>(AUTH_ENDPOINTS.forgotPassword, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Reset password with token
     */
    async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
        return authFetch<ResetPasswordResponse>(AUTH_ENDPOINTS.resetPassword, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // -------------------------------------------------------------------------
    // Email Verification
    // -------------------------------------------------------------------------

    /**
     * Verify email with token
     */
    async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
        const response = await authFetch<VerifyEmailResponse>(AUTH_ENDPOINTS.verifyEmail, {
            method: 'POST',
            body: JSON.stringify(data),
        });

        TokenManager.setStoredUser(response.user);
        return response;
    },

    /**
     * Resend verification email
     */
    async resendVerification(
        data: ResendVerificationRequest
    ): Promise<ResendVerificationResponse> {
        return authFetch<ResendVerificationResponse>(AUTH_ENDPOINTS.resendVerification, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // -------------------------------------------------------------------------
    // Utilities
    // -------------------------------------------------------------------------

    /**
     * Check if user is authenticated (has valid token)
     */
    isAuthenticated(): boolean {
        const token = TokenManager.getAccessToken();
        if (!token) return false;
        return !TokenManager.isTokenExpired(token);
    },

    /**
     * Get stored user without API call
     */
    getStoredUser(): User | null {
        return TokenManager.getStoredUser();
    },
};

export default AuthService;
