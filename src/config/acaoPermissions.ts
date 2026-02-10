import { AppRole } from '@/contexts/AuthContext';
import {
  BookOpen, MapPin, Eye, MessageSquare, ClipboardCheck, Users, BarChart3,
} from 'lucide-react';

// ── Standardised action types ────────────────────────────────────────────
export type AcaoTipo =
  | 'formacao'
  | 'visita'
  | 'observacao_aula'
  | 'devolutiva_pedagogica'
  | 'autoavaliacao'
  | 'avaliacao_formacao_participante'
  | 'qualidade_atpcs';

export const ACAO_TIPOS: AcaoTipo[] = [
  'formacao',
  'visita',
  'observacao_aula',
  'devolutiva_pedagogica',
  'autoavaliacao',
  'avaliacao_formacao_participante',
  'qualidade_atpcs',
];

export interface AcaoTypeInfo {
  tipo: AcaoTipo;
  label: string;
  icon: typeof BookOpen;
}

export const ACAO_TYPE_INFO: Record<AcaoTipo, AcaoTypeInfo> = {
  formacao:                       { tipo: 'formacao',                       label: 'Formação',                           icon: BookOpen },
  visita:                         { tipo: 'visita',                         label: 'Visita',                             icon: MapPin },
  observacao_aula:                { tipo: 'observacao_aula',                label: 'Observação de Aula',                 icon: Eye },
  devolutiva_pedagogica:          { tipo: 'devolutiva_pedagogica',          label: 'Devolutiva Pedagógica',              icon: MessageSquare },
  autoavaliacao:                  { tipo: 'autoavaliacao',                  label: 'Autoavaliação',                      icon: ClipboardCheck },
  avaliacao_formacao_participante:{ tipo: 'avaliacao_formacao_participante', label: 'Avaliação de Formação – Participante', icon: Users },
  qualidade_atpcs:                { tipo: 'qualidade_atpcs',                label: 'Qualidade de ATPCs',                 icon: BarChart3 },
};

/** Backward compatibility: acompanhamento_aula → observacao_aula */
export function normalizeAcaoTipo(tipo: string): AcaoTipo {
  if (tipo === 'acompanhamento_aula') return 'observacao_aula';
  return tipo as AcaoTipo;
}

export function getAcaoLabel(tipo: string): string {
  const normalized = normalizeAcaoTipo(tipo);
  return ACAO_TYPE_INFO[normalized]?.label || tipo;
}

// ── Permission model ─────────────────────────────────────────────────────
export type ViewScope = 'proprio' | 'entidade' | 'programa' | 'all';

export interface AcaoPermission {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  viewScope: ViewScope;
}

const NONE: AcaoPermission  = { canCreate: false, canEdit: false, canDelete: false, canView: false, viewScope: 'proprio' };
const VIEW_ENT: AcaoPermission = { canCreate: false, canEdit: false, canDelete: false, canView: true, viewScope: 'entidade' };
const VIEW_PRG: AcaoPermission = { canCreate: false, canEdit: false, canDelete: false, canView: true, viewScope: 'programa' };
const CR_OWN: AcaoPermission   = { canCreate: true,  canEdit: false, canDelete: false, canView: true, viewScope: 'proprio' };
const CR_ENT: AcaoPermission   = { canCreate: true,  canEdit: false, canDelete: false, canView: true, viewScope: 'entidade' };
const CR_PRG: AcaoPermission   = { canCreate: true,  canEdit: false, canDelete: false, canView: true, viewScope: 'programa' };
const CRUD_ALL: AcaoPermission = { canCreate: true,  canEdit: true,  canDelete: true,  canView: true, viewScope: 'all' };
const CRUD_PRG: AcaoPermission = { canCreate: true,  canEdit: true,  canDelete: true,  canView: true, viewScope: 'programa' };
const CRUD_ENT: AcaoPermission = { canCreate: true,  canEdit: true,  canDelete: true,  canView: true, viewScope: 'entidade' };

// ── Permission matrix ────────────────────────────────────────────────────
export const ACAO_PERMISSION_MATRIX: Record<AppRole, Record<AcaoTipo, AcaoPermission>> = {
  // N1 – Admin
  admin: {
    formacao: CRUD_ALL, visita: CRUD_ALL, observacao_aula: CRUD_ALL,
    devolutiva_pedagogica: CRUD_ALL, autoavaliacao: CRUD_ALL,
    avaliacao_formacao_participante: CRUD_ALL, qualidade_atpcs: CRUD_ALL,
  },
  // N2 – Gestor
  gestor: {
    formacao: CRUD_PRG, visita: CRUD_PRG, observacao_aula: CRUD_PRG,
    devolutiva_pedagogica: CRUD_PRG, autoavaliacao: CRUD_PRG,
    avaliacao_formacao_participante: CRUD_PRG, qualidade_atpcs: CRUD_PRG,
  },
  // N3 – Coordenador do Programa
  n3_coordenador_programa: {
    formacao: CRUD_PRG, visita: CRUD_PRG, observacao_aula: CRUD_PRG,
    devolutiva_pedagogica: CRUD_PRG, autoavaliacao: CRUD_PRG,
    avaliacao_formacao_participante: CRUD_PRG, qualidade_atpcs: CRUD_PRG,
  },
  // N4.1 – CPed
  n4_1_cped: {
    formacao: CRUD_ENT, visita: CRUD_ENT, observacao_aula: CRUD_ENT,
    devolutiva_pedagogica: CRUD_ENT, autoavaliacao: NONE,
    avaliacao_formacao_participante: NONE, qualidade_atpcs: CRUD_ENT,
  },
  // N4.2 – GPI
  n4_2_gpi: {
    formacao: CRUD_ENT, visita: CRUD_ENT, observacao_aula: CRUD_ENT,
    devolutiva_pedagogica: CRUD_ENT, autoavaliacao: NONE,
    avaliacao_formacao_participante: NONE, qualidade_atpcs: CRUD_ENT,
  },
  // N5 – Formador
  n5_formador: {
    formacao: CRUD_ENT, visita: CRUD_ENT, observacao_aula: CRUD_ENT,
    devolutiva_pedagogica: CRUD_ENT, autoavaliacao: NONE,
    avaliacao_formacao_participante: NONE, qualidade_atpcs: CRUD_ENT,
  },
  // N6 – Coordenador Pedagógico
  n6_coord_pedagogico: {
    formacao: VIEW_ENT, visita: VIEW_ENT, observacao_aula: VIEW_ENT,
    devolutiva_pedagogica: VIEW_ENT, autoavaliacao: CR_OWN,
    avaliacao_formacao_participante: CR_OWN, qualidade_atpcs: VIEW_ENT,
  },
  // N7 – Professor / Vice-Diretor / Diretor
  n7_professor: {
    formacao: NONE, visita: NONE, observacao_aula: CR_ENT,
    devolutiva_pedagogica: NONE, autoavaliacao: NONE,
    avaliacao_formacao_participante: CR_OWN, qualidade_atpcs: NONE,
  },
  // N8 – Equipe Técnica SME
  n8_equipe_tecnica: {
    formacao: VIEW_PRG, visita: VIEW_PRG, observacao_aula: CR_PRG,
    devolutiva_pedagogica: VIEW_PRG, autoavaliacao: NONE,
    avaliacao_formacao_participante: NONE, qualidade_atpcs: VIEW_PRG,
  },
  // Legacy roles – map to operational (same as N5)
  aap_inicial: {
    formacao: CRUD_ENT, visita: CRUD_ENT, observacao_aula: CRUD_ENT,
    devolutiva_pedagogica: CRUD_ENT, autoavaliacao: NONE,
    avaliacao_formacao_participante: NONE, qualidade_atpcs: CRUD_ENT,
  },
  aap_portugues: {
    formacao: CRUD_ENT, visita: CRUD_ENT, observacao_aula: CRUD_ENT,
    devolutiva_pedagogica: CRUD_ENT, autoavaliacao: NONE,
    avaliacao_formacao_participante: NONE, qualidade_atpcs: CRUD_ENT,
  },
  aap_matematica: {
    formacao: CRUD_ENT, visita: CRUD_ENT, observacao_aula: CRUD_ENT,
    devolutiva_pedagogica: CRUD_ENT, autoavaliacao: NONE,
    avaliacao_formacao_participante: NONE, qualidade_atpcs: CRUD_ENT,
  },
};

// ── Helper functions ─────────────────────────────────────────────────────

export function getPermission(role: AppRole | undefined, acaoTipo: AcaoTipo | string): AcaoPermission {
  if (!role) return NONE;
  const matrix = ACAO_PERMISSION_MATRIX[role];
  if (!matrix) return NONE;
  const normalized = normalizeAcaoTipo(acaoTipo);
  return matrix[normalized] || NONE;
}

export function canUserCreateAcao(role: AppRole | undefined, acaoTipo: AcaoTipo | string): boolean {
  return getPermission(role, acaoTipo).canCreate;
}

export function canUserEditAcao(role: AppRole | undefined, acaoTipo: AcaoTipo | string): boolean {
  return getPermission(role, acaoTipo).canEdit;
}

export function canUserDeleteAcao(role: AppRole | undefined, acaoTipo: AcaoTipo | string): boolean {
  return getPermission(role, acaoTipo).canDelete;
}

export function canUserViewAcao(role: AppRole | undefined, acaoTipo: AcaoTipo | string): boolean {
  return getPermission(role, acaoTipo).canView;
}

/** Returns the list of AcaoTipo that the role can CREATE */
export function getCreatableAcoes(role: AppRole | undefined): AcaoTipo[] {
  if (!role) return [];
  return ACAO_TIPOS.filter(tipo => canUserCreateAcao(role, tipo));
}

/** Returns the list of AcaoTipo that the role can VIEW */
export function getViewableAcoes(role: AppRole | undefined): AcaoTipo[] {
  if (!role) return [];
  return ACAO_TIPOS.filter(tipo => canUserViewAcao(role, tipo));
}

// Role display labels for the matrix page
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'N1 – Administrador',
  gestor: 'N2 – Gestor',
  n3_coordenador_programa: 'N3 – Coord. Programa',
  n4_1_cped: 'N4.1 – CPed',
  n4_2_gpi: 'N4.2 – GPI',
  n5_formador: 'N5 – Formador',
  n6_coord_pedagogico: 'N6 – Coord. Pedagógico',
  n7_professor: 'N7 – Professor',
  n8_equipe_tecnica: 'N8 – Equipe Técnica',
  aap_inicial: 'AAP Inicial (legado)',
  aap_portugues: 'AAP Português (legado)',
  aap_matematica: 'AAP Matemática (legado)',
};

/** Main roles (excluding legacy) for the matrix visualization */
export const MAIN_ROLES: AppRole[] = [
  'admin', 'gestor', 'n3_coordenador_programa',
  'n4_1_cped', 'n4_2_gpi', 'n5_formador',
  'n6_coord_pedagogico', 'n7_professor', 'n8_equipe_tecnica',
];
