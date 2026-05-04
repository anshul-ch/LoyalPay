import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly accessTokenKey = 'accessToken';
  private readonly refreshTokenKey = 'refreshToken';
  private readonly noticeKey = 'authNotice';
  private readonly sessionCheckHeader = 'X-Session-Check';

  private apiUrl = environment.apiUrl;
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      map(res => {
        if (res?.success === false) {
          throw new Error(res?.message || 'Invalid email or password. Please try again.');
        }
        return res;
      }),
      tap(res => {
        if (res.data && res.data.accessToken) {
          this.setTokens(res.data.accessToken, res.data.refreshToken);
        }
      })
    );
  }

  signup(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/signup`, payload).pipe(
      map(res => {
        if (res?.success === false) {
          throw new Error(res?.message || 'Signup failed.');
        }
        return res;
      }),
      tap(res => {
        if (res.data?.accessToken) {
          this.setTokens(res.data.accessToken, res.data.refreshToken);
        }
      })
    );
  }

  logout() {
    const refreshToken = sessionStorage.getItem(this.refreshTokenKey);
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe({
        next: () => this.clearSession(),
        error: () => this.clearSession()
      });
    } else {
      this.clearSession();
    }
  }

  clearSession(noticeMessage = '') {
    if (noticeMessage) {
      sessionStorage.setItem(this.noticeKey, noticeMessage);
    }
    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  consumeNoticeMessage(): string {
    const message = sessionStorage.getItem(this.noticeKey) || '';
    sessionStorage.removeItem(this.noticeKey);
    return message;
  }

  private setTokens(accessToken: string, refreshToken: string) {
    sessionStorage.setItem(this.accessTokenKey, accessToken);
    sessionStorage.setItem(this.refreshTokenKey, refreshToken);
    this.loadUserFromToken();
  }

  private loadUserFromToken() {
    const token = this.getAccessToken();
    if (!token) {
      this.currentUserSubject.next(null);
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      // Assuming roles are in a standard claim, map it based on .NET JWT structure
      const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      const emailClaim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";

      const user = {
        id: decoded.sub || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier"],
        fullName: decoded.name || decoded.fullName,
        email: decoded[emailClaim] || decoded.email,
        role: decoded[roleClaim] || decoded.role || 'User'
      };
      this.currentUserSubject.next(user);
    } catch (error) {
      this.clearSession();
    }
  }

  ensureActiveSession(): Observable<boolean> {
    if (!this.isAuthenticated()) {
      return of(false);
    }

    return this.http.get<any>(`${this.apiUrl}/profile`, {
      headers: new HttpHeaders({ [this.sessionCheckHeader]: 'true' })
    }).pipe(
      map(res => {
        const isActive = res?.data?.isActive !== false;
        if (!isActive) {
          const reason = res?.data?.inactiveReason ? ` Reason: ${res.data.inactiveReason}` : '';
          this.clearSession(`Your account has been deactivated.${reason}`);
        }
        return isActive;
      }),
      catchError(err => {
        if (err.status === 401 || err.status === 403) {
          const message = err.error?.message || 'Your session is no longer available. Please sign in again.';
          this.clearSession(message);
        }
        return of(false);
      })
    );
  }

  private migrateLegacyLocalStorageToken() {
    const legacyAccessToken = localStorage.getItem(this.accessTokenKey);
    const legacyRefreshToken = localStorage.getItem(this.refreshTokenKey);
    const currentAccessToken = sessionStorage.getItem(this.accessTokenKey);

    // One-time migration to keep currently signed-in users working after switching to per-tab storage.
    if (!currentAccessToken && legacyAccessToken) {
      sessionStorage.setItem(this.accessTokenKey, legacyAccessToken);
      if (legacyRefreshToken) {
        sessionStorage.setItem(this.refreshTokenKey, legacyRefreshToken);
      }
    }

    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  constructor() {
    this.migrateLegacyLocalStorageToken();
    this.loadUserFromToken();
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.accessTokenKey);
  }

  getRole(): string | null {
    if (!this.currentUserSubject.value) {
      this.loadUserFromToken();
    }
    return this.currentUserSubject.value?.role || null;
  }

  getCurrentUserId(): string | null {
    if (!this.currentUserSubject.value) {
      this.loadUserFromToken();
    }
    return this.currentUserSubject.value?.id || null;
  }

  getCurrentUserEmail(): string | null {
    if (!this.currentUserSubject.value) {
      this.loadUserFromToken();
    }
    return this.currentUserSubject.value?.email || null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
