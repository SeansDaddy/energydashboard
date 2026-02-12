
export interface HealthRank {
  site: string;
  score: number;
}

export interface HealthTrend {
  time: string;
  value: number;
}

export interface AlertItem {
  id: string;
  address: string;
  status: 'Critical' | 'Major' | 'Minor' | 'Warning';
  site: string;
  type: string;
  time: string;
}

export interface PreWarningItem {
  id: string;
  site: string;
  device: string;
  description: string;
  prediction: string;
  confidence: number;
}

export interface ClosureStat {
  label: string;
  total: number;
  closed: number;
  rate: number;
}

export interface StockData {
  shipped: number;
  booted: number;
  connected: number;
  connectionRate: number;
}

export interface OfficeCloudSiteStat {
  office: string;
  totalSites: number;
  cloudSites: number;
  rate: number;
  offline: number;
  offlineRate: number;
}

export interface OfficeESSRank {
  office: string;
  essCount: number;
  capacity: string;
}

export interface DeviceTypeStat {
  type: string;
  count: number;
  percentage: number;
}

export interface SoftwareVersion {
  deviceType: string;
  version: string;
  count: number;
  percentage: number;
  isRequiredUpgrade: boolean;
}

export interface OfficeMetric {
  office: string;
  value: number | string;
}

export interface KeyMetric {
  name: string;
  value: number | string;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  status: 'normal' | 'warning' | 'critical';
  offices: OfficeMetric[];
}
