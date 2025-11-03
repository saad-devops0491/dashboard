interface TokenData {
  token: string;
  expiresAt: number;
  rememberMe: boolean;
}

class TokenService {
  private readonly TOKEN_KEY = 'saher_auth_token';
  private readonly REFRESH_TOKEN_KEY = 'saher_refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'saher_token_expiry';
  private readonly REMEMBER_ME_KEY = 'saher_remember_me';

  // Store token with expiration and remember me preference
  setToken(token: string, expiresIn: number = 3600, rememberMe: boolean = false): void {
    const expiresAt = Date.now() + (expiresIn * 1000);
    const tokenData: TokenData = {
      token,
      expiresAt,
      rememberMe,
    };

    if (rememberMe) {
      // Store in localStorage for persistent login
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiresAt.toString());
      localStorage.setItem(this.REMEMBER_ME_KEY, 'true');
    } else {
      // Store in sessionStorage for session-only login
      sessionStorage.setItem(this.TOKEN_KEY, token);
      sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiresAt.toString());
      localStorage.removeItem(this.REMEMBER_ME_KEY);
    }
  }

  // Get token if valid
  getToken(): string | null {
    const rememberMe = localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    
    const token = storage.getItem(this.TOKEN_KEY);
    const expiryStr = storage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (!token || !expiryStr) {
      return null;
    }

    const expiresAt = parseInt(expiryStr, 10);
    const now = Date.now();
    
    // Check if token is expired (with 5 minute buffer for refresh)
    if (now >= expiresAt - (5 * 60 * 1000)) {
      this.clearToken();
      return null;
    }

    return token;
  }

  // Check if token exists and is valid
  isTokenValid(): boolean {
    return this.getToken() !== null;
  }

  // Get token expiration time
  getTokenExpiry(): number | null {
    const rememberMe = localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    const expiryStr = storage.getItem(this.TOKEN_EXPIRY_KEY);
    
    return expiryStr ? parseInt(expiryStr, 10) : null;
  }

  // Check if remember me is enabled
  isRememberMeEnabled(): boolean {
    return localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
  }

  // Clear all token data
  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.REMEMBER_ME_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  // Set refresh token
  setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Auto-refresh token before expiry
  scheduleTokenRefresh(refreshCallback: () => Promise<void>): void {
    const expiry = this.getTokenExpiry();
    if (!expiry) return;

    const now = Date.now();
    const timeUntilRefresh = expiry - now - (10 * 60 * 1000); // Refresh 10 minutes before expiry

    if (timeUntilRefresh > 0) {
      setTimeout(async () => {
        try {
          await refreshCallback();
        } catch (error) {
          console.error('Token refresh failed:', error);
          this.clearToken();
        }
      }, timeUntilRefresh);
    }
  }
}

export const tokenService = new TokenService();