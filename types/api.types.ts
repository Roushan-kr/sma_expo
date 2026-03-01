// Generic API request/response types for abstraction
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
}
// Centralized interfaces for SmartMettr Expo app
// Generated from OpenAPI and Postman collection

export enum ROLE_TYPE {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STATE_ADMIN = 'STATE_ADMIN',
  BOARD_ADMIN = 'BOARD_ADMIN',
  CONSUMER = 'CONSUMER',
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

export interface MeterReading {
  id: string;
  meterId: string;
  reading: number;
  timestamp: string;
}

export interface BillingReport {
  id: string;
  meterId: string;
  billingStart: string;
  billingEnd: string;
  totalConsumption: number;
  totalAmount: number;
  status: 'GENERATED' | 'RECALCULATED';
  createdAt: string;
  updatedAt: string;
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
  type: 'INFO' | 'ALERT';
  read: boolean;
  createdAt: string;
}

export interface CreateNotificationInput {
  consumerId: string;
  title: string;
  message: string;
  type: 'INFO' | 'ALERT';
}

export interface Query {
  id: string;
  consumerId: string;
  queryText: string;
  status: 'PENDING' | 'RESOLVED' | 'CLOSED';
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQueryInput {
  queryText: string;
}

export interface UpdateQueryStatusInput {
  status: 'PENDING' | 'RESOLVED' | 'CLOSED';
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
  userId: string;
  timestamp: string;
  details: object;
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
