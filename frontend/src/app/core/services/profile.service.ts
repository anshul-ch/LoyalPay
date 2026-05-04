import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/profile`;

  getProfile(): Observable<any> { return this.http.get<any>(this.apiUrl); }
  updateProfile(payload: any): Observable<any> { return this.http.put<any>(this.apiUrl, payload); }
  changePassword(payload: any): Observable<any> { return this.http.put<any>(`${this.apiUrl}/password`, payload); }
  lookupUser(email: string): Observable<any> { return this.http.get<any>(`${this.apiUrl}/lookup?email=${email}`); }
}
