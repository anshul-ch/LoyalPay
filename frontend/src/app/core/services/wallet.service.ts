import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wallet`;
  private statementUrl = `${environment.apiUrl}/statement`;

  getBalance(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/balance`);
  }

  getTransactions(page: number = 1, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/transactions?page=${page}&size=${size}`);
  }

  startTopUp(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/topup`, payload);
  }

  finishTopUp(topUpId: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/topup/${topUpId}/finish`, payload);
  }

  transfer(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/transfer`, payload);
  }

  downloadStatement(format: 'pdf' | 'csv', from?: string, to?: string): Observable<Blob> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.http.get(`${this.statementUrl}/${format}${query}`, { responseType: 'blob' });
  }
}
