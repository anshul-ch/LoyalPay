import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminDashboardDto, UserView, PagedUsersResult, KycSubmissionView, CampaignDto, KycRejectDto, UpdateUserStatusDto, ApiResponse, AdminRewardDto
} from '../models/api.models';

export interface CreateRewardDto {
  name: string;
  description?: string;
  itemType: 'Cashback' | 'Coupon' | 'Voucher';
  pointsCost: number;
  stock: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ApiResponse<AdminDashboardDto>> {
    return this.http.get<ApiResponse<AdminDashboardDto>>(`${this.api}/admin/dashboard`);
  }

  getUsers(page = 1, pageSize = 10, search = '', kycStatus = '', tier = '', status = ''): Observable<ApiResponse<PagedUsersResult>> {
    const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
    if (search)    params['search']    = search;
    if (kycStatus) params['kycStatus'] = kycStatus;
    if (tier)      params['tier']      = tier;
    if (status)    params['status']    = status;
    return this.http.get<ApiResponse<PagedUsersResult>>(`${this.api}/admin/users`, { params });
  }

  updateUserStatus(userId: string, dto: UpdateUserStatusDto): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.api}/admin/users/${userId}/status`, dto);
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

  getCampaigns(): Observable<ApiResponse<CampaignDto[]>> {
    return this.http.get<ApiResponse<CampaignDto[]>>(`${this.api}/admin/campaigns`);
  }

  deactivateCampaign(campaignId: string): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.api}/admin/campaigns/${campaignId}/deactivate`, {});
  }

  activateCampaign(campaignId: string): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.api}/admin/campaigns/${campaignId}/activate`, {});
  }

  removeCampaign(campaignId: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.api}/admin/campaigns/${campaignId}`);
  }

  createReward(dto: CreateRewardDto): Observable<ApiResponse<object>> {
    return this.http.post<ApiResponse<object>>(`${this.api}/admin/campaigns/rewards`, dto);
  }

  getRewards(): Observable<ApiResponse<AdminRewardDto[]>> {
    return this.http.get<ApiResponse<AdminRewardDto[]>>(`${this.api}/admin/campaigns/rewards`);
  }

  deactivateReward(rewardId: string): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.api}/admin/campaigns/rewards/${rewardId}/deactivate`, {});
  }

  activateReward(rewardId: string): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.api}/admin/campaigns/rewards/${rewardId}/activate`, {});
  }

  removeReward(rewardId: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.api}/admin/campaigns/rewards/${rewardId}`);
  }
}
