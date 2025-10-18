import { SavedDocument, UploadedFile, DocumentVersion, SavedRiskMap } from '../types';

const ETP_STORAGE_KEY = 'savedETPs';
const TR_STORAGE_KEY = 'savedTRs';
const RISK_MAP_STORAGE_KEY = 'savedRiskMaps';
const FILES_STORAGE_KEY = 'trGeniusFiles';

// --- Funções Genéricas ---
const getSavedData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveData = <T extends { id: number; history?: any[]; createdAt?: string }>(key: string, newData: T[]): void => {
  const oldData = getSavedData<T>(key);
  const oldDataMap = new Map(oldData.map(d => [d.id, d]));
  const timestamp = new Date().toISOString();

  const updatedData = newData.map(newDoc => {
    const oldDoc = oldDataMap.get(newDoc.id);

    if (!oldDoc) {
      return {
        ...newDoc,
        createdAt: newDoc.createdAt || timestamp,
        updatedAt: timestamp,
        history: [{
          timestamp: timestamp,
          summary: 'Documento criado.',
          data: { ...newDoc } // Salva uma cópia completa dos dados na criação
        }]
      };
    }
    
    // Simplificando a detecção de alterações
    const hasChanged = JSON.stringify(newDoc) !== JSON.stringify(oldDoc);

    if (hasChanged) {
        const newHistoryEntry = {
            timestamp: timestamp,
            summary: 'Modificações gerais.',
            data: { ...newDoc } // Salva uma cópia completa a cada alteração
        };
        const newHistory = [newHistoryEntry, ...(oldDoc.history || [])];
        return { ...newDoc, updatedAt: timestamp, history: newHistory };
    }

    return oldDoc;
  });

  localStorage.setItem(key, JSON.stringify(updatedData));
};

// --- Gestão de Documentos (ETP & TR) ---
export const getSavedETPs = (): SavedDocument[] => getSavedData<SavedDocument>(ETP_STORAGE_KEY);
export const saveETPs = (etps: SavedDocument[]): void => saveData<SavedDocument>(ETP_STORAGE_KEY, etps);
export const getSavedTRs = (): SavedDocument[] => getSavedData<SavedDocument>(TR_STORAGE_KEY);
export const saveTRs = (trs: SavedDocument[]): void => saveData<SavedDocument>(TR_STORAGE_KEY, trs);

// --- Gestão de Mapa de Riscos ---
export const getSavedRiskMaps = (): SavedRiskMap[] => getSavedData<SavedRiskMap>(RISK_MAP_STORAGE_KEY);
export const saveRiskMaps = (maps: SavedRiskMap[]): void => saveData<SavedRiskMap>(RISK_MAP_STORAGE_KEY, maps);


// --- Gestão de Ficheiros Carregados ---
export const getStoredFiles = (): UploadedFile[] => {
    const data = localStorage.getItem(FILES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveStoredFiles = (files: UploadedFile[]): void => {
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
};

// --- Gestão de Estado de Formulário ---
export const saveFormState = (key: string, state: object): void => {
    localStorage.setItem(key, JSON.stringify(state));
};

export const loadFormState = (key: string): object | null => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};
