import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProfileDto, UpdateProfileDto, ChangePasswordDto, KycSubmitDto, KycStatusDto, ApiResponse
} from '../models/api.models';
import { AccountLockService } from './account-lock.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = environment.apiUrl;
  private kycStatusRequest$?: Observable<ApiResponse<KycStatusDto>>;
  private kycStatusToken = '';

  constructor(
    private http: HttpClient,
    private accountLock: AccountLockService
  ) {}

  getProfile(): Observable<ApiResponse<ProfileDto>> {
    return this.http.get<ApiResponse<ProfileDto>>(`${this.api}/profile`).pipe(
      tap(res => {
        const message = res.message?.toLowerCase() ?? '';
        if (!res.success && (message.includes('deactivated') || message.includes('inactive') || message.includes('not active'))) {
          const reason = res.message?.trim() || 'Your account has been deactivated.';
          this.accountLock.lock(`${reason} Please contact support for account reactivation.`);
        }
      })
    );
  }

  updateProfile(dto: UpdateProfileDto): Observable<ApiResponse<ProfileDto>> {
    return this.http.put<ApiResponse<ProfileDto>>(`${this.api}/profile`, dto);
  }

  changePassword(dto: ChangePasswordDto): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.api}/profile/password`, dto);
  }

  submitKyc(dto: KycSubmitDto): Observable<ApiResponse<KycStatusDto>> {
    this.invalidateKycStatusCache();
    return this.http.post<ApiResponse<KycStatusDto>>(`${this.api}/profile/kyc`, dto);
  }

  getKycStatus(forceRefresh: boolean = false): Observable<ApiResponse<KycStatusDto>> {
    const currentToken = sessionStorage.getItem('lp_access') ?? localStorage.getItem('lp_access') ?? '';

    if (this.kycStatusToken !== currentToken) {
      this.kycStatusRequest$ = undefined;
      this.kycStatusToken = currentToken;
    }

    if (forceRefresh || !this.kycStatusRequest$) {
      this.kycStatusRequest$ = this.http
        .get<ApiResponse<KycStatusDto>>(`${this.api}/profile/kyc`)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }

    return this.kycStatusRequest$;
  }

  invalidateKycStatusCache(): void {
    this.kycStatusRequest$ = undefined;
  }
}
