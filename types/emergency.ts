export interface Emergency {
  id: string;
  latitude: number;
  longitude: number;
  placename: string;
  contactno: string;
  accuracy: number;
  timestamp: string;
  needs: string[];
  numberOfPeople: number;
  urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  additionalNotes: string;
  status: 'pending' | 'resolved' | 'in-progress' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyResponse {
  success: boolean;
  count: number;
  data: Emergency[];
  cached?: boolean;
  stale?: boolean;
  lastUpdated?: string;
  nextUpdate?: string;
  error?: string;
  cacheSource?: string;
}

export interface StatItem {
  label: string;
  value: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export interface DashboardStats {
  totalEmergencies: number;
  totalPeople: number;
  avgPeople: number;
  pendingCount: number;
  needsStats: StatItem[];
  urgencyStats: StatItem[];
  statusStats: StatItem[];
}
