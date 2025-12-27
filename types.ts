
export enum PunchStatus {
  ACCEPTED = 'Aceita',
  PENDING = 'Pendente',
  REJECTED = 'Recusada'
}

export type UserRole = 'COLABORADOR' | 'ADMIN';

export interface PunchRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
    address?: string;
    distance?: number;
  };
  justification?: string;
  photo?: string;
  status: PunchStatus;
  type: 'IN' | 'OUT' | 'FOLGA' | 'FERIADO';
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  company: string;
  role: string;
  shift: string;
  userType: UserRole;
  password?: string;
}

export type ViewType = 'INDICADORES' | 'CARTAO_PONTO' | 'INCLUIR_PONTO' | 'AJUSTAR_PONTO' | 'JUSTIFICAR' | 'SOLICITACOES' | 'DADOS' | 'CONFIG' | 'ADMIN_DASHBOARD' | 'ADMIN_EMPLOYEES' | 'ADMIN_REPORTS';
