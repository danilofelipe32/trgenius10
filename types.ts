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

// --- Risk Map Specific Types ---
export interface RevisionHistoryRow {
  id: number;
  date: string;
  version: string;
  description: string;
  phase: string;
  author: string;
}

export interface RiskIdentificationRow {
  id: number;
  riskId: string;
  risk: string;
  relatedTo: string;
  probability: string;
  impact: string;
}

export interface RiskAction {
  id: number;
  actionId: string;
  action: string;
  responsible: string;
}

export interface RiskEvaluationBlock {
  id: number;
  riskId: string;
  riskDescription: string;
  probability: string;
  impact: string;
  damage: string;
  treatment: string;
  preventiveActions: RiskAction[];
  contingencyActions: RiskAction[];
}

export interface RiskMonitoringRow {
  id: number;
  date: string;
  riskId: string;
  actionId: string;
  record: string;
}

export interface RiskMapData {
  revisionHistory: RevisionHistoryRow[];
  riskIdentification: RiskIdentificationRow[];
  riskEvaluation: RiskEvaluationBlock[];
  riskMonitoring: RiskMonitoringRow[];
}
// --- End Risk Map Types ---


export interface DocumentVersion {
  timestamp: string;
  summary: string;
  sections: DocumentSection;
  attachments?: Attachment[];
  riskMapData?: RiskMapData;
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
  riskMapData?: RiskMapData;
}

export type DocumentType = 'etp' | 'tr' | 'risk-map';

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
  type: DocumentType | null;
  id: number | null;
}

export interface Notification {
  id: number;
  title: string;
  text: string;
  type: 'success' | 'error' | 'info';
}