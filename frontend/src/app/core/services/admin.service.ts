import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  getDashboard(): Observable<any> { return this.http.get<any>(`${this.apiUrl}/dashboard`); }
  getUsers(filters: any = {}): Observable<any> {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') params.set(key, filters[key]);
    });
    return this.http.get<any>(`${this.apiUrl}/users?${params.toString()}`);
  }
  updateUserStatus(userId: string, payload: { isActive: boolean; reason?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/${userId}/status`, payload);
  }
  getPendingKyc(): Observable<any> { return this.http.get<any>(`${this.apiUrl}/kyc/pending`); }
  approveKyc(id: string): Observable<any> { return this.http.post<any>(`${this.apiUrl}/kyc/${id}/approve`, {}); }
  rejectKyc(id: string, rejectionNote: string): Observable<any> { return this.http.post<any>(`${this.apiUrl}/kyc/${id}/reject`, { rejectionNote }); }
  getKycDocument(submissionId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/kyc/${submissionId}/document`, { responseType: 'blob' });
  }
  getCampaigns(): Observable<any> { return this.http.get<any>(`${this.apiUrl}/campaigns`); }
  createCampaign(payload: any): Observable<any> { return this.http.post<any>(`${this.apiUrl}/campaigns`, payload); }
  setCampaignActive(id: string, active: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/campaigns/${id}/${active ? 'activate' : 'deactivate'}`, {});
  }
  deleteCampaign(id: string): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/campaigns/${id}`); }
  getRewards(): Observable<any> { return this.http.get<any>(`${this.apiUrl}/campaigns/rewards`); }
  createReward(payload: any): Observable<any> { return this.http.post<any>(`${this.apiUrl}/campaigns/rewards`, payload); }
  setRewardActive(id: string, active: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/campaigns/rewards/${id}/${active ? 'activate' : 'deactivate'}`, {});
  }
  deleteReward(id: string): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/campaigns/rewards/${id}`); }
}
