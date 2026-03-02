// Generic API request/response types for abstraction
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  /** Number of times to retry the request on failure (default: 3) */
  retries?: number;
  /** Base delay in ms before retrying, grows exponentially (default: 500) */
  retryDelayMs?: number;
  /**
   * If provided, avoids throwing an error after all retries fail,
   * instead returning this fallback object in the success channel.
   * Required for critical UI components to gracefully degrade.
   */
  skeletonFallback?: any;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Centralized interfaces for SmartMettr Expo app
// Generated from OpenAPI and Postman collection

export enum ROLE_TYPE {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STATE_ADMIN = 'STATE_ADMIN',
  BOARD_ADMIN = 'BOARD_ADMIN',
  SUPPORT_AGENT = 'SUPPORT_AGENT',
  AUDITOR = 'AUDITOR',
  // CONSUMER is a separate model — not a User role
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: ROLE_TYPE;
  stateId?: string;
  boardId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email?: string;
  phone?: string;
  role: ROLE_TYPE;
  stateId?: string;
  boardId?: string | null;
}

export interface UpdateRoleInput {
  role: ROLE_TYPE;
}

export interface UpdateScopeInput {
  stateId?: string;
  boardId?: string;
}

export interface UserConsent {
  consentType: 'ENERGY_TRACKING' | 'AI_QUERY_PROCESSING';
  granted: boolean;
  grantedAt: string;
}

export interface UpdateConsentInput {
  consentType: 'ENERGY_TRACKING' | 'AI_QUERY_PROCESSING';
  granted: boolean;
}

export interface Consumer {
  id: string;
  name: string;
  phoneNumber: string;
  address: string;
  stateId: string;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterConsumerInput {
  name: string;
  phoneNumber: string;
  address: string;
  stateId: string;
  boardId: string;
}

export interface UpdateConsumerInput {
  name?: string;
  phoneNumber?: string;
  address?: string;
}

export interface CustomerConsent {
  id: string;
  consumerId: string;
  consentType: 'ENERGY_TRACKING' | 'AI_QUERY_PROCESSING';
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
}

export interface SmartMeter {
  id: string;
  meterNumber: string;
  status: 'ACTIVE' | 'INACTIVE' | 'FAULTY' | 'DISCONNECTED';
  consumerId?: string;
  tariffId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeterInput {
  meterNumber: string;
  tariffId: string;
}

export interface AssignMeterInput {
  consumerId: string;
}

export interface UpdateMeterStatusInput {
  status: 'ACTIVE' | 'INACTIVE' | 'FAULTY' | 'DISCONNECTED';
}

export interface ConsumptionSummary {
  meterId: string;
  totalConsumption: number;
  averageDailyConsumption: number;
  peakConsumption: number;
  readingCount: number;
}

export interface MeterReading {
  id: string;
  meterId: string;
  consumption: number;   // ← Prisma field name (was 'reading')
  timestamp: string;
  voltage?: number;
  current?: number;
}

export interface BillingReport {
  id: string;
  meterId: string;
  tariffId: string;
  billingStart: string;
  billingEnd: string;
  totalUnits: number;    // ← Prisma field name (was 'totalConsumption')
  energyCharge: number;
  fixedCharge: number;
  taxAmount?: number;
  totalAmount: number;
  version: number;
  isLatest: boolean;     // ← backend flag (replaced fake 'status' field)
  generatedAt: string;
}

export interface GenerateBillingInput {
  meterId: string;
  billingStart: string;
  billingEnd: string;
}

export interface AggregateInput {
  meterId: string;
  periodStart: string;
  periodEnd: string;
  granularity: 'DAILY' | 'MONTHLY';
}

export interface Notification {
  id: string;
  consumerId: string;
  title: string;
  message: string;
  type: string;          // flexible — backend stores as plain String
  isRead: boolean;       // ← Prisma field name (was 'read')
  createdAt: string;
}

export interface CreateNotificationInput {
  consumerId: string;
  title: string;
  message: string;
  type: string;
}

export interface Query {
  id: string;
  consumerId: string;
  queryText: string;
  aiCategory?: string;
  aiConfidence?: number;
  status: 'PENDING' | 'AI_REVIEWED' | 'RESOLVED' | 'REJECTED'; // ← matches Prisma QueryStatus
  adminReply?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQueryInput {
  queryText: string;
}

export interface UpdateQueryStatusInput {
  status: 'PENDING' | 'AI_REVIEWED' | 'RESOLVED' | 'REJECTED';
}

export interface AdminReplyInput {
  adminReply: string;
}

export interface AiClassifyInput {
  category: string;
  confidence: number;
}

export interface AiAutoResolveInput {
  category: string;
  confidence: number;
  resolutionText: string;
}

export interface ReportFormat {
  id: string;
  boardId: string;
  name: string;
  schema: object;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportFormatInput {
  boardId: string;
  name: string;
  schema: object;
}

export interface GeneratedReportFile {
  id: string;
  reportType: string;
  format: string;
  fileUrl: string;
  createdAt: string;
}

export interface GenerateReportInput {
  reportType: string;
  format: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  createdAt: string;     // ← Prisma field name (was 'timestamp')
  metadata?: object | null; // ← Prisma field name (was 'details')
}

export interface DataRetentionPolicy {
  id: string;
  entityType: string;
  retentionDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRetentionPolicyInput {
  entityType: string;
  retentionDays: number;
}

export interface UpdateRetentionPolicyInput {
  entityType?: string;
  retentionDays?: number;
}

export interface State {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStateInput {
  name: string;
  code: string;
}

export interface ElectricityBoard {
  id: string;
  name: string;
  code: string;
  stateId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardInput {
  name: string;
  code: string;
  stateId: string;
}

export interface UpdateBoardInput {
  name?: string;
  code?: string;
  stateId?: string;
}
