import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RewardsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/rewards`;

  getSummary(): Observable<any> { return this.http.get<any>(`${this.apiUrl}/summary`); }
  getCatalog(): Observable<any> { return this.http.get<any>(`${this.apiUrl}/catalog`); }
  getHistory(): Observable<any> { return this.http.get<any>(`${this.apiUrl}/history`); }
  redeem(payload: { itemId: string }): Observable<any> { return this.http.post<any>(`${this.apiUrl}/redeem`, payload); }
}
