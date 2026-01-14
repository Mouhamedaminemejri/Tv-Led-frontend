// ============================================================================
// AUTH TYPES & INTERFACES
// ============================================================================

// User Types
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    emailVerified: boolean;
    provider: AuthProvider;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}

export type AuthProvider = 'local' | 'google' | 'facebook' | 'LOCAL' | 'GOOGLE' | 'FACEBOOK' | 'APPLE';
export type UserRole = 'customer' | 'admin' | 'vendor' | 'CUSTOMER' | 'ADMIN' | 'VENDOR';

// Auth State
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// Login Types
export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
    guestSessionId?: string; // For cart migration
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

// Register Types
export interface RegisterCredentials {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone?: string;
    acceptTerms: boolean;
    subscribeNewsletter?: boolean;
    guestSessionId?: string; // For cart migration
}

export interface RegisterResponse {
    user: User;
    message: string;
    requiresVerification: boolean;
}

// OAuth Types
export interface OAuthCredentials {
    provider: 'google' | 'facebook';
    accessToken: string;
    idToken?: string;
}

export interface OAuthResponse extends LoginResponse {
    isNewUser: boolean;
}

// Password Reset Types
export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    message: string;
    expiresIn: number; // seconds until link expires
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
    confirmPassword: string;
}

export interface ResetPasswordResponse {
    message: string;
    success: boolean;
}

// Email Verification Types
export interface VerifyEmailRequest {
    token: string;
}

export interface VerifyEmailResponse {
    message: string;
    user: User;
}

export interface ResendVerificationRequest {
    email: string;
}

export interface ResendVerificationResponse {
    message: string;
    expiresIn: number;
}

// Token Types
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    expiresIn: number;
}

// API Error Response
export interface AuthError {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, string[]>;
}

// Form Validation
export interface ValidationError {
    field: string;
    message: string;
}

// Password Strength
export interface PasswordStrength {
    score: number; // 0-4
    label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
    suggestions: string[];
    color: string;
}

// Auth Context Actions
export type AuthAction =
    | { type: 'AUTH_START' }
    | { type: 'AUTH_SUCCESS'; payload: User }
    | { type: 'AUTH_ERROR'; payload: string }
    | { type: 'AUTH_LOGOUT' }
    | { type: 'AUTH_CLEAR_ERROR' }
    | { type: 'AUTH_UPDATE_USER'; payload: Partial<User> };
