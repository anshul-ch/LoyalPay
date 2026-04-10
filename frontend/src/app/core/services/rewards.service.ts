import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RewardSummaryDto, CatalogItemDto, RedeemDto, RewardTransactionDto, ApiResponse
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class RewardsService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<ApiResponse<RewardSummaryDto>> {
    return this.http.get<ApiResponse<RewardSummaryDto>>(`${this.api}/rewards/summary`);
  }

  getCatalog(): Observable<ApiResponse<CatalogItemDto[]>> {
    return this.http.get<ApiResponse<CatalogItemDto[]>>(`${this.api}/rewards/catalog`);
  }

  redeem(dto: RedeemDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.api}/rewards/redeem`, dto);
  }

  getHistory(): Observable<ApiResponse<RewardTransactionDto[]>> {
    return this.http.get<ApiResponse<RewardTransactionDto[]>>(`${this.api}/rewards/history`);
  }
}
