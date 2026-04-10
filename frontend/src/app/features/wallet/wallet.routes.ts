import { Routes } from '@angular/router';
import { kycGuard } from '../../core/guards/kyc.guard';

export const WALLET_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./overview/wallet-overview.component').then(m => m.WalletOverviewComponent)
  },
  {
    path: 'topup',
    canActivate: [kycGuard],
    loadComponent: () => import('./topup/topup.component').then(m => m.TopUpComponent)
  },
  {
    path: 'transfer',
    canActivate: [kycGuard],
    loadComponent: () => import('./transfer/transfer.component').then(m => m.TransferComponent)
  },
  {
    path: 'transactions',
    loadComponent: () => import('./transactions/transactions.component').then(m => m.TransactionsComponent)
  }
];
