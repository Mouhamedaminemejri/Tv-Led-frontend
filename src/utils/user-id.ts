// User ID utility - generates and stores a random user ID
// Later this will be replaced with actual authenticated user ID

const USER_ID_STORAGE_KEY = 'tv_partner_user_id';

export function getUserId(): string {
    if (typeof window === 'undefined') {
        // Server-side: return a temporary ID (will be replaced with actual user)
        return 'temp-user-id';
    }

    // Check if we already have a user ID
    let userId = localStorage.getItem(USER_ID_STORAGE_KEY);
    
    if (!userId) {
        // Generate a random user ID
        userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(USER_ID_STORAGE_KEY, userId);
    }
    
    return userId;
}

export function setUserId(userId: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(USER_ID_STORAGE_KEY, userId);
    }
}


