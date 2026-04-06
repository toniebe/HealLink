// ── Types ─────────────────────────────────────────────────────────────────────

export interface MedicUser {
  uuid: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  profile: any[] | null;
}

export interface MedicsListResponse {
  success: boolean;
  message: string;
  data: MedicUser[];
  meta: { timestamp: string };
}

export interface Medic {
  uuid: string;
  name: string;
  specialty: string;
  avatar?: string;
  is_online?: boolean;
}
 
export interface Patient {
  uuid: string;
  name: string;
  avatar?: string;
}
 
export interface Consultation {
  uuid: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  notes: string;
  scheduled_at: string;
  started_at: string;
  ended_at: string;
  created_at: string;
  patient: Patient | null;
  medic: Medic | null;
}
 
export interface ConsultationListResponse {
  success: boolean;
  message: string;
  data: Consultation[];
  meta: {
    timestamp: string;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
 
export interface ConsultationResponse {
  success: boolean;
  message: string;
  data: Consultation;
  meta: { timestamp: string };
}
 
// ── Status Config ─────────────────────────────────────────────────────────────
 
export const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'pending',   color: '#F5A623', bg: '#F5A62320' },
  ongoing:   { label: 'ongoing',   color: '#27AE60', bg: '#27AE6020' },
  completed: { label: 'completed', color: '#72BAA9', bg: '#72BAA920' },
  cancelled: { label: 'cancelled', color: '#AE2448', bg: '#AE244820' },
};
 