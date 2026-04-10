import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BalanceDto, TopUpDto, TopUpResultDto, TransferDto, TransactionDto, ApiResponse, LookupDto
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBalance(): Observable<ApiResponse<BalanceDto>> {
    return this.http.get<ApiResponse<BalanceDto>>(`${this.api}/wallet/balance`);
  }

  startTopUp(dto: TopUpDto): Observable<ApiResponse<TopUpResultDto>> {
    return this.http.post<ApiResponse<TopUpResultDto>>(`${this.api}/wallet/topup`, dto);
  }

  finishTopUp(topUpId: string, success: boolean): Observable<ApiResponse<TransactionDto>> {
    return this.http.post<ApiResponse<TransactionDto>>(
      `${this.api}/wallet/topup/${topUpId}/finish`,
      { success }
    );
  }

  transfer(dto: TransferDto): Observable<ApiResponse<TransactionDto>> {
    return this.http.post<ApiResponse<TransactionDto>>(`${this.api}/wallet/transfer`, dto);
  }

  getTransactions(page: number = 1, size: number = 20): Observable<ApiResponse<{ items: TransactionDto[], total: number, page: number, size: number }>> {
    return this.http.get<ApiResponse<{ items: TransactionDto[], total: number, page: number, size: number }>>(
      `${this.api}/wallet/transactions?page=${page}&size=${size}`
    );
  }

  lookupByEmail(email: string): Observable<ApiResponse<LookupDto>> {
    return this.http.get<ApiResponse<LookupDto>>(
      `${this.api}/profile/lookup?email=${encodeURIComponent(email)}`
    );
  }

  getStatementPdf(from: string, to: string): Observable<Blob> {
    return this.http.get(
      `${this.api}/statement/pdf?from=${from}&to=${to}`,
      { responseType: 'blob' }
    );
  }

  getStatementCsv(from: string, to: string): Observable<Blob> {
    return this.http.get(
      `${this.api}/statement/csv?from=${from}&to=${to}`,
      { responseType: 'blob' }
    );
  }
}
