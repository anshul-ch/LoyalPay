import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PinService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pin`;

  getStatus(): Observable<any> { return this.http.get<any>(`${this.apiUrl}/status`); }
  setPin(payload: { pin: string }): Observable<any> { return this.http.post<any>(`${this.apiUrl}/set`, payload); }
  changePin(payload: { currentPin: string; newPin: string }): Observable<any> { return this.http.post<any>(`${this.apiUrl}/change`, payload); }
  verifyPin(payload: { pin: string }): Observable<any> { return this.http.post<any>(`${this.apiUrl}/verify`, payload); }
  resetPin(payload: { ticketId: string; userId: string; newPin: string }): Observable<any> { return this.http.post<any>(`${this.apiUrl}/reset`, payload); }
}
