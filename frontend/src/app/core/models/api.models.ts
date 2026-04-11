// Auth
export interface TokenDto {
  accessToken: string;
  refreshToken: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'User' | 'Admin';
  userId: string;
  requiresPasswordChange: boolean;
}

export interface SignupDto {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface RefreshRequestDto {
  refreshToken: string;
}

export interface UpdateProfileDto {
  fullName: string;
  phone: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface KycSubmitDto {
  documentType: 'Aadhaar' | 'PAN' | 'Passport' | 'DrivingLicense';
  documentNumber: string;
  fileBase64: string;
}

export interface KycStatusDto {
  status: string;
  documentType?: string;
  documentNumber?: string;
  rejectionNote?: string;
  reviewedAt?: string;
}

export interface ProfileDto {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
  inactiveReason?: string;
  kycStatus: string;
  kycDocumentType?: string;
  kycDocumentNumber?: string;
  kycRejectionNote?: string;
  kycReviewedAt?: string;
  createdAt: string;
}

export interface LookupDto {
  userId: string;
  fullName: string;
  email: string;
  kycStatus?: string;
  isActive?: boolean;
}

// Wallet
export interface BalanceDto {
  balance: number;
  walletId: string;
}

export interface TopUpDto {
  amount: number;
  paymentMethod: 'UPI' | 'Card' | 'NetBanking';
}

export interface TopUpResultDto {
  topUpId: string;
  amount: number;
  paymentMethod: string;
  status: string;
}

export interface FinishTopUpDto {
  success: boolean;
}

export interface TransferDto {
  receiverUserId: string;
  amount: number;
  note?: string;
  receiverName?: string;
  senderName?: string;
}

export interface TransactionDto {
  entryId: string;
  entryType: string;
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

// Rewards
export interface RewardSummaryDto {
  totalPoints: number;
  tier: string;
  tierProgress: string;
}

export interface CatalogItemDto {
  itemId: string;
  name: string;
  description?: string;
  itemType: string;
  pointsCost: number;
  isActive: boolean;
  expiresAt?: string;
}

export interface RedeemDto {
  itemId: string;
}

export interface RewardTransactionDto {
  transactionId: string;
  transactionType: string;
  points: number;
  description: string;
  createdAt: string;
}

// Admin
export interface AdminDashboardDto {
  totalUsers: number;
  totalWalletsBalance: number;
  pendingKycCount: number;
  silverCount: number;
  goldCount: number;
  platinumCount: number;
}

export interface UserView {
  userId: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  isActive: boolean;
  inactiveReason?: string;
  kycStatus: string;
  kycDocumentType?: string;
  kycDocumentNumber?: string;
  kycRejectionNote?: string;
  kycReviewedAt?: string;
  createdAt: string;
  balance?: number;
  points?: number;
  tier?: string;
}

export interface PagedUsersResult {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: UserView[];
}

export interface KycSubmissionView {
  submissionId: string;
  userId: string;
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  fileName: string;
  contentType: string;
  status: string;
  rejectionNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface CampaignDto {
  campaignId?: string;
  name: string;
  description?: string;
  bonusPoints: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AdminRewardDto {
  itemId: string;
  name: string;
  description?: string;
  itemType: string;
  pointsCost: number;
  stock: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt?: string;
}

export interface UpdateUserStatusDto {
  isActive: boolean;
  reason?: string;
}

export interface KycRejectDto {
  rejectionNote?: string;
}

// Shared
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
