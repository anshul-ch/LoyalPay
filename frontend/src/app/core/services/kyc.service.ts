import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KycService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/profile/kyc`;

  getStatus(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  submitKyc(payload: { documentType: string, documentNumber: string, fileBase64: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  getDocument(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/document`, { responseType: 'blob' });
  }
}
