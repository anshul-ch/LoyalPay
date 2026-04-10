import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminDashboardDto, UserView, KycSubmissionView, CampaignDto, KycRejectDto, ApiResponse
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ApiResponse<AdminDashboardDto>> {
    return this.http.get<ApiResponse<AdminDashboardDto>>(`${this.api}/admin/dashboard`);
  }

  getUsers(): Observable<ApiResponse<UserView[]>> {
    return this.http.get<ApiResponse<UserView[]>>(`${this.api}/admin/users`);
  }

  updateUserStatus(userId: string, isActive: boolean): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.api}/admin/users/${userId}/status`, { isActive });
  }

  getPendingKyc(): Observable<ApiResponse<KycSubmissionView[]>> {
    return this.http.get<ApiResponse<KycSubmissionView[]>>(`${this.api}/admin/kyc/pending`);
  }

  getKycByUser(userId: string): Observable<ApiResponse<KycSubmissionView[]>> {
    return this.http.get<ApiResponse<KycSubmissionView[]>>(`${this.api}/admin/kyc/user/${userId}`);
  }

  getKycDocument(submissionId: string): Observable<Blob> {
    return this.http.get(`${this.api}/admin/kyc/${submissionId}/document`, { responseType: 'blob' });
  }

  approveKyc(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.api}/admin/kyc/${id}/approve`, {});
  }

  rejectKyc(id: string, dto: KycRejectDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.api}/admin/kyc/${id}/reject`, dto);
  }

  createCampaign(dto: CampaignDto): Observable<ApiResponse<object>> {
    return this.http.post<ApiResponse<object>>(`${this.api}/admin/campaigns`, dto);
  }
}
