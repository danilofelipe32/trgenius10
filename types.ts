export type Priority = 'low' | 'medium' | 'high';

export interface Section {
  id: string;
  title: string;
  placeholder: string;
  hasGen: boolean;
  hasRiskAnalysis?: boolean;
  tooltip?: string;
  isAttachmentSection?: boolean;
}

export interface DocumentSection {
  [key: string]: string;
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  content: string; // base64 encoded content
  description?: string;
}

export interface DocumentVersion {
  timestamp: string;
  summary: string;
  sections: DocumentSection;
  attachments?: Attachment[];
}

export interface SavedDocument {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  sections: DocumentSection;
  attachments?: Attachment[];
  history?: DocumentVersion[];
  priority?: Priority;
}

export type DocumentType = 'etp' | 'tr' | 'mapa-riscos';

export interface Template {
  id: string;
  name: string;
  description: string;
  type: DocumentType;
  sections: Record<string, string>;
}

export interface FileChunk {
  page: number;
  content: string;
}

export interface UploadedFile {
  name: string;
  type: string;
  content: string; // base64 encoded content
  chunks: string[];
  selected: boolean;
  isLocked?: boolean;
}

export interface PreviewContext {
  type: 'etp' | 'tr' | null;
  id: number | null;
}

export interface Notification {
  id: number;
  title: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

// --- Tipos para o Mapa de Riscos ---

export interface RiskRevision {
  id: number;
  date: string;
  version: string;
  description: string;
  phase: string;
  author: string;
}

export interface RiskAction {
    id: number;
    description: string;
    responsible: string;
}

export interface RiskItem {
    id: string; // e.g., 'R01', 'R02'
    risk: string;
    relatedTo: string;
    probability: number; // P value (5, 10, 15)
    impact: number; // I value (5, 10, 15)
    // Análise Detalhada
    probabilityText: string;
    impactText: string;
    damages: string[];
    treatment: string;
    preventiveActions: RiskAction[];
    contingencyActions: RiskAction[];
}

export interface RiskFollowUp {
    id: number;
    date: string;
    riskId: string;
    actionId: string;
    notes: string;
}

export interface SavedRiskMap {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  // Dados do formulário
  processNumber: string;
  projectName: string;
  locationAndDate: string;
  introduction: string;
  revisions: RiskRevision[];
  risks: RiskItem[];
  followUps: RiskFollowUp[];
  preparedBy: { name: string; role: string; registration: string };
  approvedBy: { name: string; role: string; registration: string };
  // Metadados
  history?: DocumentVersion[]; // Reutilizando para o histórico
  priority?: Priority;
}