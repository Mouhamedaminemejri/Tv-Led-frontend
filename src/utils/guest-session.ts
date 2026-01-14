// ============================================================================
// GUEST SESSION MANAGEMENT
// ============================================================================

const GUEST_TOKEN_KEY = 'tv_partner_guest_token';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Guest Session Manager
 * Handles guest token generation, storage, and retrieval
 */
export const GuestSession = {
    /**
     * Get the current guest token from localStorage
     */
    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(GUEST_TOKEN_KEY);
    },

    /**
     * Set the guest token in localStorage
     */
    setToken(token: string): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(GUEST_TOKEN_KEY, token);
    },

    /**
     * Remove the guest token from localStorage
     */
    clearToken(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(GUEST_TOKEN_KEY);
    },

    /**
     * Check if a guest token exists
     */
    hasToken(): boolean {
        return !!this.getToken();
    },

    /**
     * Generate a new guest token from the backend
     */
    async generateToken(): Promise<string> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/guest-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to generate guest token');
            }

            const data = await response.json();
            const token = data.guestToken;
            
            this.setToken(token);
            return token;
        } catch (error) {
            console.error('Failed to generate guest token:', error);
            // Fallback: generate a client-side UUID if backend is unavailable
            const fallbackToken = crypto.randomUUID();
            this.setToken(fallbackToken);
            return fallbackToken;
        }
    },

    /**
     * Initialize guest session - get existing token or generate new one
     */
    async initialize(): Promise<string> {
        let token = this.getToken();
        
        if (!token) {
            token = await this.generateToken();
        }
        
        return token;
    },

    /**
     * Get or create guest token (synchronous check, async creation if needed)
     */
    async ensureToken(): Promise<string> {
        const existing = this.getToken();
        if (existing) return existing;
        return this.generateToken();
    },
};

export default GuestSession;
