import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private userTicketsUrl = `${environment.apiUrl}/support/tickets`;
  private publicTicketsUrl = `${environment.apiUrl}/support/public-ticket`;
  private adminTicketsUrl = `${environment.apiUrl}/admin/support/tickets`;
  private supportAgentsUrl = `${environment.apiUrl}/admin/support-agents`;

  getMyTickets(): Observable<any> { return this.http.get<any>(`${this.userTicketsUrl}/my`); }
  createTicket(payload: any): Observable<any> { return this.http.post<any>(this.userTicketsUrl, payload); }
  createPublicReviewTicket(payload: any): Observable<any> { return this.http.post<any>(this.publicTicketsUrl, payload); }
  getAllTickets(filters: any = {}): Observable<any> {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') params.set(key, filters[key]);
    });
    return this.http.get<any>(`${this.adminTicketsUrl}?${params.toString()}`);
  }
  getTicket(id: string): Observable<any> { return this.http.get<any>(`${this.adminTicketsUrl}/${id}`); }
  updateTicket(id: string, payload: any): Observable<any> { return this.http.put<any>(`${this.adminTicketsUrl}/${id}`, payload); }
  assignTicket(id: string, supportAgentId: string): Observable<any> { return this.http.post<any>(`${this.adminTicketsUrl}/${id}/assign`, { supportAgentId }); }
  requestOwnership(id: string, reason: string): Observable<any> {
    return this.http.post<any>(`${this.adminTicketsUrl}/${id}/ownership-request`, { reason });
  }
  getSupportAgents(): Observable<any> { return this.http.get<any>(this.supportAgentsUrl); }
  createSupportAgent(payload: any): Observable<any> { return this.http.post<any>(this.supportAgentsUrl, payload); }
  
  // User account management
  activateUser(userId: string): Observable<any> { return this.http.post<any>(`${environment.apiUrl}/admin/users/${userId}/activate`, {}); }
  deactivateUser(userId: string, reason: string): Observable<any> { return this.http.post<any>(`${environment.apiUrl}/admin/users/${userId}/deactivate`, { reason }); }
}
