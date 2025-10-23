import { SavedDocument, UploadedFile, DocumentVersion, DocumentType } from '../types';

const ETP_STORAGE_KEY = 'savedETPs';
const TR_STORAGE_KEY = 'savedTRs';
const RISKMAP_STORAGE_KEY = 'savedRiskMaps';
const FILES_STORAGE_KEY = 'trGeniusFiles';

// Document Management (ETP & TR)
const getSavedDocuments = (key: string): SavedDocument[] => {
  const data = localStorage.getItem(key);
  const docs = data ? JSON.parse(data) : [];
  
  let docType: DocumentType;
  if (key === ETP_STORAGE_KEY) {
    docType = 'etp';
  } else if (key === TR_STORAGE_KEY) {
    docType = 'tr';
  } else { // RISKMAP_STORAGE_KEY
    docType = 'risk-map';
  }

  // Add type to each document to ensure it exists for both old and new data structures.
  return docs.map((doc: any) => ({ ...doc, type: docType }));
};

const saveDocuments = (key: string, docs: SavedDocument[]): void => {
  const oldDocs = getSavedDocuments(key);
  const oldDocsMap = new Map(oldDocs.map(d => [d.id, d]));
  const timestamp = new Date().toISOString();

  const updatedDocs = docs.map(newDoc => {
    const oldDoc = oldDocsMap.get(newDoc.id);

    // Case 1: Brand new document
    if (!oldDoc) {
      return {
        ...newDoc,
        createdAt: newDoc.createdAt || timestamp,
        updatedAt: timestamp,
        history: [{
          timestamp: timestamp,
          summary: 'Documento criado.',
          sections: newDoc.sections,
          attachments: newDoc.attachments,
          riskMapData: newDoc.riskMapData,
        }]
      };
    }

    // Case 2: Existing document. Check for changes.
    const hasChanged = JSON.stringify(newDoc.sections) !== JSON.stringify(oldDoc.sections) ||
                         JSON.stringify(newDoc.attachments || []) !== JSON.stringify(oldDoc.attachments || []) ||
                         JSON.stringify(newDoc.riskMapData || {}) !== JSON.stringify(oldDoc.riskMapData || {}) ||
                         newDoc.name !== oldDoc.name ||
                         newDoc.priority !== oldDoc.priority;

    if (hasChanged) {
      const changes: string[] = [];
      if (newDoc.name !== oldDoc.name) {
        changes.push('nome alterado');
      }
      if (newDoc.priority !== oldDoc.priority) {
        changes.push('prioridade alterada');
      }
      if (JSON.stringify(newDoc.sections) !== JSON.stringify(oldDoc.sections)) {
        changes.push('conteúdo das seções modificado');
      }
      if (JSON.stringify(newDoc.attachments || []) !== JSON.stringify(oldDoc.attachments || [])) {
        changes.push('anexos atualizados');
      }
      if (JSON.stringify(newDoc.riskMapData || {}) !== JSON.stringify(oldDoc.riskMapData || {})) {
        changes.push('mapa de riscos atualizado');
      }

      const summary = changes.length > 0 ? `Alteração: ${changes.join(', ')}.` : 'Modificações gerais.';

      const newHistoryEntry: DocumentVersion = {
        timestamp: timestamp,
        summary: summary,
        sections: newDoc.sections,
        attachments: newDoc.attachments,
        riskMapData: newDoc.riskMapData,
      };
      
      const newHistory = [newHistoryEntry, ...(oldDoc.history || [])];

      return {
        ...newDoc,
        updatedAt: timestamp,
        history: newHistory
      };
    }

    // No changes detected, return the old document to preserve its exact state and history
    return oldDoc;
  });

  localStorage.setItem(key, JSON.stringify(updatedDocs));
};

export const getSavedETPs = (): SavedDocument[] => getSavedDocuments(ETP_STORAGE_KEY);
export const saveETPs = (etps: SavedDocument[]): void => saveDocuments(ETP_STORAGE_KEY, etps);
export const getSavedTRs = (): SavedDocument[] => getSavedDocuments(TR_STORAGE_KEY);
export const saveTRs = (trs: SavedDocument[]): void => saveDocuments(TR_STORAGE_KEY, trs);
export const getSavedRiskMaps = (): SavedDocument[] => getSavedDocuments(RISKMAP_STORAGE_KEY);
export const saveRiskMaps = (maps: SavedDocument[]): void => saveDocuments(RISKMAP_STORAGE_KEY, maps);


// Uploaded Files Management
export const getStoredFiles = (): UploadedFile[] => {
    const data = localStorage.getItem(FILES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveStoredFiles = (files: UploadedFile[]): void => {
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
};

// Form State Management
export const saveFormState = (key: string, state: object): void => {
    localStorage.setItem(key, JSON.stringify(state));
};

export const loadFormState = (key: string): object | null => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};