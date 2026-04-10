import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TokenDto, LoginDto, SignupDto, ForgotPasswordDto, RefreshRequestDto, ApiResponse
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ACCESS_KEY = 'lp_access';
  private readonly REFRESH_KEY = 'lp_refresh';
  private readonly api = environment.apiUrl;

  currentUser$ = new BehaviorSubject<TokenDto | null>(this.loadUser());

  constructor(private http: HttpClient) {}

  private getToken(key: string): string | null {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  }

  private loadUser(): TokenDto | null {
    const token = this.getToken(this.ACCESS_KEY);
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const stored = this.getToken(this.REFRESH_KEY);
      return {
        accessToken: token,
        refreshToken: stored ?? '',
        email: payload.email ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? '',
        fullName: payload.fullName ?? payload.name ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? '',
        phone: payload.phone ?? '',
        role: payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? 'User',
        userId: payload.sub ?? payload.userId ?? payload.nameid ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? ''
      } as TokenDto;
    } catch {
      return null;
    }
  }

  private storeTokens(dto: TokenDto): void {
    sessionStorage.setItem(this.ACCESS_KEY, dto.accessToken);
    sessionStorage.setItem(this.REFRESH_KEY, dto.refreshToken);

    // Cleanup legacy shared storage to avoid cross-tab/session bleeding.
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  clearTokens(): void {
    sessionStorage.removeItem(this.ACCESS_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.currentUser$.next(null);
  }

  getStoredTokens(): { accessToken: string; refreshToken: string } | null {
    const access = this.getToken(this.ACCESS_KEY);
    const refresh = this.getToken(this.REFRESH_KEY);
    if (!access || !refresh) return null;
    return { accessToken: access, refreshToken: refresh };
  }

  isLoggedIn(): boolean {
    return !!this.getStoredTokens();
  }

  isAdmin(): boolean {
    return this.currentUser$.value?.role === 'Admin';
  }

  login(dto: LoginDto): Observable<ApiResponse<TokenDto>> {
    return this.http.post<ApiResponse<TokenDto>>(`${this.api}/login`, dto).pipe(
      tap(res => {
        if (res.data) {
          this.storeTokens(res.data);
          this.currentUser$.next(res.data);
        }
      })
    );
  }

  signup(dto: SignupDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.api}/signup`, dto);
  }

  logout(): Observable<ApiResponse<string>> {
    const tokens = this.getStoredTokens();
    const body: RefreshRequestDto = { refreshToken: tokens?.refreshToken ?? '' };
    return this.http.post<ApiResponse<string>>(`${this.api}/logout`, body).pipe(
      tap(() => this.clearTokens())
    );
  }

  refresh(): Observable<ApiResponse<TokenDto>> {
    const tokens = this.getStoredTokens();
    const body: RefreshRequestDto = { refreshToken: tokens?.refreshToken ?? '' };
    return this.http.post<ApiResponse<TokenDto>>(`${this.api}/refresh`, body).pipe(
      tap(res => {
        if (res.data) {
          this.storeTokens(res.data);
          this.currentUser$.next(res.data);
        }
      })
    );
  }

  forgotPassword(dto: ForgotPasswordDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.api}/forgot-password`, dto);
  }

  updateCurrentUserProfile(partial: Partial<Pick<TokenDto, 'fullName' | 'phone' | 'email'>>): void {
    const current = this.currentUser$.value;
    if (!current) return;

    this.currentUser$.next({
      ...current,
      ...partial
    });
  }
}
