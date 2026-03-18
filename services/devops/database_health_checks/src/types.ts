export interface FirestoreHealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  avgLatencyMs: number;
  p95LatencyMs: number; // 95th percentile
  lastCheck: Date;
  activeConnections: number;
  errorCount: number;
}