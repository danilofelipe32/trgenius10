import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
    Section as SectionType, SavedDocument, UploadedFile, DocumentType, PreviewContext, 
    Attachment, DocumentVersion, Priority, Template, Notification as NotificationType,
    RevisionHistoryRow, RiskIdentificationRow, RiskEvaluationBlock, RiskMonitoringRow, RiskAction 
} from './types';
import * as storage from './services/storageService';
import { callGemini } from './services/geminiService';
import { processSingleUploadedFile, chunkText } from './services/ragService';
import { exportDocumentToPDF, exportRiskMapToPDF } from './services/exportService';
import { Icon } from './components/Icon';
import Login from './components/Login';
import { AttachmentManager } from './components/AttachmentManager';
import InstallPWA from './components/InstallPWA';
import { HistoryViewer } from './components/HistoryViewer';
import { etpSections, trSections, riskMapSections } from './config/sections';
import { etpTemplates, trTemplates } from './config/templates';

declare const mammoth: any;

// --- Notification Component ---
interface NotificationProps {
  notification: NotificationType;
  onClose: (id: number) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const { id, title, text, type } = notification;
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300); // Wait for animation to finish
  }, [id, onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [id, handleClose]);

  const typeClasses = useMemo(() => ({
    success: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      iconColor: 'text-green-500',
      iconName: 'check-circle',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      iconColor: 'text-red-500',
      iconName: 'exclamation-triangle',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      iconColor: 'text-blue-500',
      iconName: 'info-circle',
    },
  }), []);

  const classes = typeClasses[type];

  return (
    <div
      className={`relative w-full max-w-sm p-4 mb-4 rounded-lg shadow-xl border-l-4 overflow-hidden
        ${classes.bg} ${classes.border} ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <Icon name={classes.iconName} className={`text-xl ${classes.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="mt-1 text-sm text-slate-600 break-words">{text}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={handleClose}
            className="inline-flex text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 -mt-1 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Fechar"
          >
            <Icon name="times" className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Content Renderer with Professional Formatting ---
const ContentRenderer: React.FC<{ text: string | null; className?: string }> = ({ text, className }) => {
    if (!text) return null;

    const parseInline = (line: string): React.ReactNode => {
        const nodes: React.ReactNode[] = [];
        let lastIndex = 0;
        // Regex for Markdown links, standalone URLs, and bold text
        const regex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\bhttps?:\/\/[^\s()<>]+[^\s.,'"`?!;:]*[^\s.,'"`?!;:)])|(\*\*(.*?)\*\*)/g;

        let match;
        while ((match = regex.exec(line)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                nodes.push(line.substring(lastIndex, match.index));
            }
            
            const [_fullMatch, markdownBlock, markdownText, markdownUrl, standaloneUrl, boldBlock, boldText] = match;

            if (markdownBlock) {
                nodes.push(<a href={markdownUrl} key={match.index} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">{markdownText}</a>);
            } else if (standaloneUrl) {
                nodes.push(<a href={standaloneUrl} key={match.index} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">{standaloneUrl}</a>);
            } else if (boldBlock) {
                nodes.push(<strong key={match.index} className="font-semibold text-slate-800">{boldText}</strong>);
            }
            
            lastIndex = regex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < line.length) {
            nodes.push(line.substring(lastIndex));
        }

        return nodes.map((node, i) => <React.Fragment key={i}>{node}</React.Fragment>);
    };

    const elements: React.ReactNode[] = [];
    const lines = text.split('\n');
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    
    const flushList = () => {
        if (listItems.length > 0 && listType) {
            const listKey = `list-${elements.length}`;
            const items = listItems.map((item, i) => <li key={`${listKey}-${i}`} className="pb-1">{parseInline(item)}</li>);
            if (listType === 'ul') {
                elements.push(<ul key={listKey} className="space-y-1 my-3 list-disc list-inside pl-2 text-slate-700">{items}</ul>);
            } else {
                elements.push(<ol key={listKey} className="space-y-1 my-3 list-decimal list-inside pl-2 text-slate-700">{items}</ul>);
            }
        }
        listItems = [];
        listType = null;
    };

    lines.forEach((line, index) => {
        if (line.startsWith('### ')) { flushList(); elements.push(<h3 key={index} className="text-base font-bold text-slate-700 mt-4 mb-1">{parseInline(line.substring(4))}</h3>); return; }
        if (line.startsWith('## ')) { flushList(); elements.push(<h2 key={index} className="text-lg font-bold text-slate-800 mt-5 mb-2 pb-1 border-b border-slate-200">{parseInline(line.substring(3))}</h2>); return; }
        if (line.startsWith('# ')) { flushList(); elements.push(<h1 key={index} className="text-xl font-extrabold text-slate-900 mt-2 mb-3 pb-2 border-b border-slate-300">{parseInline(line.substring(2))}</h1>); return; }
        if (line.trim() === '---') { flushList(); elements.push(<hr key={index} className="my-4 border-slate-200" />); return; }
        
        const ulMatch = line.match(/^\s*[\*-]\s+(.*)/);
        if (ulMatch) {
            if (listType !== 'ul') flushList();
            listType = 'ul';
            listItems.push(ulMatch[1]);
            return;
        }

        const olMatch = line.match(/^\s*\d+\.\s+(.*)/);
        if (olMatch) {
            if (listType !== 'ol') flushList();
            listType = 'ol';
            listItems.push(olMatch[1]);
            return;
        }
        
        flushList();
        
        if (line.trim() !== '') {
            elements.push(<p key={index} className="leading-relaxed my-2 text-slate-700">{parseInline(line)}</p>);
        }
    });
    
    flushList();

    return (
      <div className={`relative p-5 rounded-lg border bg-white shadow-sm ${className || ''}`}>
        <div className="absolute -top-2 -left-2 bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <Icon name="brain" className="text-sm" />
          <span>TR GENIUS</span>
        </div>
        <div className="pt-4">
          {elements}
        </div>
      </div>
    );
};

// --- Bottom Navigation Bar for Mobile ---
const BottomNavBar: React.FC<{
  activeView: DocumentType;
  switchView: (view: DocumentType) => void;
  openSidebar: () => void;
}> = ({ activeView, switchView, openSidebar }) => {
  const navItems = [
    { id: 'etp', label: 'ETP', icon: 'file-alt' },
    { id: 'risk-map', label: 'Riscos', icon: 'shield-alt' },
    { id: 'tr', label: 'TR', icon: 'gavel' },
    { id: 'menu', label: 'Menu', icon: 'bars' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-start h-20 pt-2">
        {navItems.map(item => {
          const isActive = activeView === item.id;
          const isMenu = item.id === 'menu';
          const onClick = isMenu ? openSidebar : () => switchView(item.id as DocumentType);
          
          // Menu button should not have an active state based on view
          const finalIsActive = isMenu ? false : isActive;

          return (
            <button key={item.id} onClick={onClick} className="flex flex-col items-center justify-start text-center w-1/4 h-full transition-colors duration-200 space-y-1 group" aria-label={item.label}>
              <div className={`flex items-center justify-center h-8 rounded-full transition-all duration-300 ease-in-out ${finalIsActive ? 'bg-blue-100 w-16' : 'w-8 group-hover:bg-slate-100'}`}>
                 <Icon name={item.icon} className={`text-xl transition-colors duration-300 ${finalIsActive ? 'text-blue-600' : 'text-slate-500'}`} />
              </div>
              <span className={`text-xs font-bold transition-colors duration-300 ${finalIsActive ? 'text-blue-600' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer as ArrayBuffer;
};

const base64ToUtf8 = (base64: string): string => {
    try {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
    } catch(e) {
        console.error("Failed to decode base64 string:", e);
        return "Erro ao descodificar o conteúdo do ficheiro. Pode estar corrompido ou numa codificação não suportada.";
    }
};

const priorityLabels: Record<Priority, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

const etpTemplateColors = [
  "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800",
  "bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-800",
  "bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-800",
  "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-800",
  "bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-800",
  "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800",
];

const trTemplateColors = [
  "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800",
  "bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-200 text-fuchsia-800",
  "bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-800",
  "bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-800",
  "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800",
  "bg-red-50 hover:bg-red-100 border-red-200 text-red-800",
];


// --- Reusable Section Component ---
interface SectionProps {
  id: string;
  title: string;
  placeholder: string;
  value: string;
  onChange: (id: string, value: string) => void;
  onGenerate: () => void;
  hasGen: boolean;
  onAnalyze?: () => void;
  hasRiskAnalysis?: boolean;
  onEdit?: () => void;
  isLoading?: boolean;
  hasError?: boolean;
  tooltip?: string;
  isAiGenerated?: boolean;
}

const Section: React.FC<SectionProps> = ({ id, title, placeholder, value, onChange, onGenerate, hasGen, onAnalyze, hasRiskAnalysis, onEdit, isLoading, hasError, tooltip, isAiGenerated }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!value || !navigator.clipboard) return;
    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mb-6 transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-y-3">
        <div className="flex items-center gap-2">
            <label htmlFor={id} className={`block text-lg font-semibold ${hasError ? 'text-red-600' : 'text-slate-700'}`}>{title}</label>
            {tooltip && <Icon name="question-circle" className="text-slate-400 cursor-help" title={tooltip} />}
        </div>
        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-stretch gap-2">
           {value && String(value || '').trim().length > 0 && (
             <button
              onClick={handleCopy}
              className={`flex items-center justify-center text-center px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${isCopied ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              title={isCopied ? 'Copiado para a área de transferência!' : 'Copiar Conteúdo'}
            >
              <Icon name={isCopied ? 'check' : 'copy'} className="mr-2" /> 
              <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
            </button>
           )}
           {value && String(value || '').trim().length > 0 && onEdit && (
             <button
              onClick={onEdit}
              className="flex items-center justify-center text-center px-3 py-2 text-xs font-semibold text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
              title="Editar e Refinar"
            >
              <Icon name="pencil-alt" className="mr-2" />
              <span>Editar</span>
            </button>
          )}
          {hasRiskAnalysis && onAnalyze && (
            <button
              onClick={onAnalyze}
              className="flex items-center justify-center text-center px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
              title="Análise de Riscos"
            >
              <Icon name="shield-alt" className="mr-2" />
              <span>Análise</span>
            </button>
          )}
          {hasGen && (
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="flex items-center justify-center text-center px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="wand-magic-sparkles" className="mr-2" />
              <span>{isLoading ? 'A gerar...' : 'Gerar'}</span>
            </button>
          )}
        </div>
      </div>
      <div className="relative">
        <textarea
          id={id}
          value={value || ''}
          onChange={(e) => onChange(id, e.target.value)}
          placeholder={isLoading ? 'A IA está a gerar o conteúdo...' : placeholder}
          className={`w-full h-40 p-3 border rounded-lg focus:ring-2 transition-all duration-300 ${
            hasError ? 'border-red-500 ring-red-200 bg-red-50' : 
            isAiGenerated ? 'border-blue-300 bg-blue-50 focus:ring-blue-500 focus:border-blue-500' : 
            'border-slate-200 bg-slate-50 focus:ring-blue-500 focus:border-blue-500'
          } ${isLoading ? 'opacity-50' : ''}`}
          disabled={isLoading}
        />
        {isAiGenerated && !isLoading && (
            <div className="absolute top-2 right-2 flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100/80 backdrop-blur-sm px-2 py-1 rounded-full pointer-events-none" title="Este conteúdo foi gerado por IA. Edite-o para aceitar.">
                <Icon name="brain" />
                <span>IA</span>
            </div>
        )}
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/70 rounded-lg pointer-events-none">
              <Icon name="spinner" className="fa-spin text-3xl text-blue-600" />
            </div>
        )}
      </div>
    </div>
  );
};

// --- Modal Component ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-xl' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} flex flex-col max-h-[90vh] transition-all duration-300 transform scale-95 animate-scale-in`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Icon name="times" className="text-2xl" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="p-5 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const PriorityIndicator: React.FC<{ priority?: Priority }> = ({ priority }) => {
    const priorityStyles: Record<Priority, { color: string; label: string }> = {
        low: { color: 'bg-green-500', label: 'Prioridade Baixa' },
        medium: { color: 'bg-yellow-500', label: 'Prioridade Média' },
        high: { color: 'bg-red-500', label: 'Prioridade Alta' },
    };

    if (!priority) return <div title="Prioridade não definida" className="w-3 h-3 rounded-full bg-slate-300 flex-shrink-0"></div>;

    return (
        <div
            title={priorityStyles[priority].label}
            className={`w-3 h-3 rounded-full ${priorityStyles[priority].color} flex-shrink-0`}
        ></div>
    );
};

const PrioritySelector: React.FC<{
  priority: Priority;
  setPriority: (p: Priority) => void;
}> = ({ priority, setPriority }) => {
  const priorities: { key: Priority; label: string; classes: string; icon: string }[] = [
    { key: 'low', label: 'Baixa', classes: 'border-green-500 hover:bg-green-100 text-green-700', icon: 'angle-down' },
    { key: 'medium', label: 'Média', classes: 'border-yellow-500 hover:bg-yellow-100 text-yellow-700', icon: 'equals' },
    { key: 'high', label: 'Alta', classes: 'border-red-500 hover:bg-red-100 text-red-700', icon: 'angle-up' },
  ];
  const activeClasses: Record<Priority, string> = {
    low: 'bg-green-500 text-white border-green-500',
    medium: 'bg-yellow-500 text-white border-yellow-500',
    high: 'bg-red-500 text-white border-red-500',
  };

  return (
    <div className="w-full md:w-auto">
      <label className="block text-sm font-medium text-slate-600 mb-2 md:text-right">Prioridade</label>
      <div className="flex items-center gap-2">
        {priorities.map(p => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPriority(p.key)}
            className={`flex-1 md:flex-initial px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
              priority === p.key ? activeClasses[p.key] : `bg-white ${p.classes}`
            }`}
          >
            <Icon name={p.icon} />
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<DocumentType>('etp');
  
  // State for documents
  const [savedETPs, setSavedETPs] = useState<SavedDocument[]>([]);
  const [savedTRs, setSavedTRs] = useState<SavedDocument[]>([]);
  const [savedRiskMaps, setSavedRiskMaps] = useState<SavedDocument[]>([]);
  
  const [etpSectionsContent, setEtpSectionsContent] = useState<Record<string, string>>({});
  const [trSectionsContent, setTrSectionsContent] = useState<Record<string, string>>({});
  const [riskMapSectionsContent, setRiskMapSectionsContent] = useState<Record<string, string>>({});

  // Table states for Risk Map
  const [revisionHistory, setRevisionHistory] = useState<RevisionHistoryRow[]>([]);
  const [riskIdentification, setRiskIdentification] = useState<RiskIdentificationRow[]>([]);
  const [riskEvaluation, setRiskEvaluation] = useState<RiskEvaluationBlock[]>([]);
  const [riskMonitoring, setRiskMonitoring] = useState<RiskMonitoringRow[]>([]);

  const [etpAttachments, setEtpAttachments] = useState<Attachment[]>([]);
  const [trAttachments, setTrAttachments] = useState<Attachment[]>([]);
  const [loadedEtpForTr, setLoadedEtpForTr] = useState<{ id: number; name: string; content: string } | null>(null);
  const [loadedRiskMapForTr, setLoadedRiskMapForTr] = useState<{ id: number; name: string; content: string } | null>(null);
  const [currentEtpPriority, setCurrentEtpPriority] = useState<Priority>('medium');
  const [currentTrPriority, setCurrentTrPriority] = useState<Priority>('medium');
  const [currentRiskMapPriority, setCurrentRiskMapPriority] = useState<Priority>('medium');


  // State for API and files
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Array<{ name: string; status: 'processing' | 'success' | 'error'; message?: string }>>([]);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [useThinkingMode, setUseThinkingMode] = useState<boolean>(false);


  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [openSidebarSections, setOpenSidebarSections] = useState({ etps: true, trs: true, riskMaps: true, knowledgeBase: true });
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContext, setPreviewContext] = useState<PreviewContext>({ type: null, id: null });
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [analysisContent, setAnalysisContent] = useState<{ title: string; content: string | null }>({ title: '', content: null });
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [historyModalContent, setHistoryModalContent] = useState<SavedDocument | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null); // For PWA install prompt
  const [isInstallBannerVisible, setIsInstallBannerVisible] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const viewTitles: Record<DocumentType, string> = {
    etp: 'Gerador de ETP',
    'risk-map': 'Mapa de Risco',
    tr: 'Gerador de TR',
  };
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<{ docType: DocumentType; sectionId: string; title: string; text: string } | null>(null);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // ETP to TR Conversion State
  const [isConvertingEtpToTr, setIsConvertingEtpToTr] = useState<boolean>(false);

  // Compliance Checker State
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [complianceCheckResult, setComplianceCheckResult] = useState<string>('');
  const [isCheckingCompliance, setIsCheckingCompliance] = useState<boolean>(false);

  // Inline rename state
  const [editingDoc, setEditingDoc] = useState<{ type: DocumentType; id: number; name: string; priority: Priority; } | null>(null);

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('Salvo com sucesso');
  const debounceTimeoutRef = useRef<number | null>(null);
  const etpContentRef = useRef(etpSectionsContent);
  const trContentRef = useRef(trSectionsContent);

  // Filter and Sort state
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'updatedAt' | 'name'>('updatedAt');
  
  // Summary state
  const [summaryState, setSummaryState] = useState<{ loading: boolean; content: string | null }>({ loading: false, content: null });
  
  // Preview State
  const [previewContent, setPreviewContent] = useState<{ type: 'html' | 'text'; content: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isRagPreviewModalOpen, setIsRagPreviewModalOpen] = useState(false);

  // Generated Content Modal State
  const [generatedContentModal, setGeneratedContentModal] = useState<{
    docType: DocumentType;
    sectionId: string;
    title: string;
    content: string;
  } | null>(null);
  
  // Brand mention alert state
  const [brandAlertShownForEtp4, setBrandAlertShownForEtp4] = useState(false);

  // R.R-01: State to track AI-generated content
  const [aiGeneratedFields, setAiGeneratedFields] = useState<Set<string>>(new Set());


  const priorityFilters: {
    key: 'all' | Priority;
    label: string;
    activeClasses: string;
    inactiveClasses: string;
  }[] = [
    { key: 'all', label: 'Todos', activeClasses: 'bg-white shadow-sm text-slate-800', inactiveClasses: 'text-slate-500 hover:bg-slate-200' },
    { key: 'high', label: 'Alta', activeClasses: 'bg-red-500 text-white shadow-sm', inactiveClasses: 'text-red-700 hover:bg-red-100' },
    { key: 'medium', label: 'Média', activeClasses: 'bg-yellow-500 text-white shadow-sm', inactiveClasses: 'text-yellow-700 hover:bg-yellow-100' },
    { key: 'low', label: 'Baixa', activeClasses: 'bg-green-500 text-white shadow-sm', inactiveClasses: 'text-green-700 hover:bg-green-100' },
  ];


  // --- Handlers ---
  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((type: 'success' | 'error' | 'info', title: string, text: string) => {
      const newNotification = {
        id: Date.now(),
        title,
        text,
        type,
      };
      setNotifications(prev => [...prev, newNotification]);
  }, []);

  // --- Effects ---
  useEffect(() => {
    const loggedIn = sessionStorage.getItem('isAuthenticated') === 'true';
    if (loggedIn) {
        setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadInitialData = async () => {
        const etps = storage.getSavedETPs();
        setSavedETPs(etps);
        setSavedTRs(storage.getSavedTRs());
        const riskMaps = storage.getSavedRiskMaps();
        setSavedRiskMaps(riskMaps);

        const etpFormState = storage.loadFormState('etpFormState') as Record<string, string> || {};
        setEtpSectionsContent(etpFormState);
        
        const trFormState = storage.loadFormState('trFormState') as Record<string, string> || {};
        setTrSectionsContent(trFormState);
        
        const riskMapFormState = storage.loadFormState('riskMapFormState') as any || {};
        setRiskMapSectionsContent(riskMapFormState.sections || {});
        if (riskMapFormState.riskMapData) {
            setRevisionHistory(riskMapFormState.riskMapData.revisionHistory || []);
            setRiskIdentification(riskMapFormState.riskMapData.riskIdentification || []);
            setRiskEvaluation(riskMapFormState.riskMapData.riskEvaluation || []);
            setRiskMonitoring(riskMapFormState.riskMapData.riskMonitoring || []);
        }


        // Find the last active ETP to load its attachments
        const lastActiveEtp = etps.find(etp => JSON.stringify(etp.sections) === JSON.stringify(etpFormState));
        if (lastActiveEtp) {
            setEtpAttachments(lastActiveEtp.attachments || []);
        }
        
        const userFiles = storage.getStoredFiles();
        setUploadedFiles(userFiles);
    };

    loadInitialData();

    const handleResize = () => {
        if (window.innerWidth >= 768) {
            setIsSidebarOpen(true);
        } else {
            setIsSidebarOpen(false);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAuthenticated]);
  
  // PWA Install Prompt
  useEffect(() => {
    const handler = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
        if (!sessionStorage.getItem('pwaInstallDismissed')) {
            setIsInstallBannerVisible(true);
        }
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => {
        window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Online status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}, []);

  // --- Auto-save Effects ---
  useEffect(() => {
      etpContentRef.current = etpSectionsContent;
  }, [etpSectionsContent]);

  useEffect(() => {
      trContentRef.current = trSectionsContent;
  }, [trSectionsContent]);
  
  // Debounced save on change
  useEffect(() => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

      debounceTimeoutRef.current = window.setTimeout(() => {
          setAutoSaveStatus('Salvando...');
          storage.saveFormState('etpFormState', etpSectionsContent);
          storage.saveFormState('trFormState', trSectionsContent);
          storage.saveFormState('riskMapFormState', {
            sections: riskMapSectionsContent,
            riskMapData: {
                revisionHistory,
                riskIdentification,
                riskEvaluation,
                riskMonitoring
            }
          });
          setTimeout(() => setAutoSaveStatus('Salvo com sucesso'), 500);
      }, 2000); // 2 seconds after user stops typing

      return () => {
          if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      };
  }, [etpSectionsContent, trSectionsContent, riskMapSectionsContent, revisionHistory, riskIdentification, riskEvaluation, riskMonitoring]);

  // Periodic save every 30 seconds
  useEffect(() => {
      const interval = setInterval(() => {
          setAutoSaveStatus('Salvando...');
          // Use refs to get the latest state, avoiding stale closures
          storage.saveFormState('etpFormState', etpContentRef.current);
          storage.saveFormState('trFormState', trContentRef.current);
          // Auto-save for risk map is handled by the debounced effect
          setTimeout(() => setAutoSaveStatus('Salvo com sucesso'), 500);
      }, 30000);

      return () => clearInterval(interval);
  }, []); // Run only once
  
  // Attachment Preview Generator
  useEffect(() => {
    if (!viewingAttachment) {
        setPreviewContent(null);
        return;
    }

    const { type, content, name } = viewingAttachment;
    const lowerCaseName = name.toLowerCase();

    if (type === 'text/plain' || lowerCaseName.endsWith('.txt')) {
        setPreviewContent({ type: 'text', content: base64ToUtf8(content) });
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerCaseName.endsWith('.docx')) {
        setIsLoadingPreview(true);
        setPreviewContent(null);
        try {
            const arrayBuffer = base64ToArrayBuffer(content);
            mammoth.convertToHtml({ arrayBuffer })
                .then((result: { value: string }) => {
                    setPreviewContent({ type: 'html', content: result.value });
                })
                .catch((err: any) => {
                    console.error("Error converting docx to html", err);
                    setPreviewContent({ type: 'html', content: '<p class="text-red-500 font-semibold p-4">Erro ao pré-visualizar o ficheiro DOCX.</p>' });
                })
                .finally(() => setIsLoadingPreview(false));
        } catch (err) {
            console.error("Error processing docx", err);
            setPreviewContent({ type: 'html', content: '<p class="text-red-500 font-semibold p-4">Erro ao processar o ficheiro .docx.</p>' });
            setIsLoadingPreview(false);
        }
    } else {
        // Reset for images, PDFs which are handled natively by object/img tags
        setPreviewContent(null); 
    }
  }, [viewingAttachment]);

  // --- Handlers ---
  const handleLogin = (success: boolean) => {
    if (success) {
        sessionStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  const handleSectionChange = (docType: DocumentType, id: string, value: string) => {
    if (validationErrors.has(id)) {
      setValidationErrors(prev => {
        const newErrors = new Set(prev);
        newErrors.delete(id);
        return newErrors;
      });
    }

    // R.R-01: When user edits, remove AI-generated flag
    if (aiGeneratedFields.has(id)) {
      setAiGeneratedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }

    setAutoSaveStatus('A escrever...');
    if (docType === 'etp') {
      setEtpSectionsContent(prev => ({ ...prev, [id]: value }));
      
      // R.C-04: Brand mention check
      if (id === 'etp-4') {
        const brandKeywords = [
            'Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft', 'Samsung', 'LG', 'Intel', 
            'AMD', 'Cisco', 'Oracle', 'Adobe', 'Autodesk', 'Sony', 'Philips', 'Epson', 
            'Brother', '3M', 'Xerox', 'Hikvision', 'Intelbras', 'Furukawa'
        ];
        const brandRegex = new RegExp(`\\b(marca|modelo)\\s*:|\\b(${brandKeywords.join('|')})\\b`, 'i');
        
        if (brandRegex.test(value) && !brandAlertShownForEtp4) {
            addNotification(
                'error',
                'Alerta de Risco de Restrição', 
                'A menção a marcas ou modelos pode restringir a competitividade. Justifique a escolha no campo "5. Justificativa para Escolha de Marca ou Modelo", demonstrando ser a única opção que atende à necessidade (Art. 41 da Lei 14.133/21).'
            );
            setBrandAlertShownForEtp4(true);
        } else if (!brandRegex.test(value) && brandAlertShownForEtp4) {
            setBrandAlertShownForEtp4(false);
        }
      }
    } else if (docType === 'tr') {
      setTrSectionsContent(prev => ({ ...prev, [id]: value }));
    } else if (docType === 'risk-map') {
      setRiskMapSectionsContent(prev => ({ ...prev, [id]: value }));
    }
  };

  const getRagContext = useCallback(async (query: string): Promise<string> => {
    if (uploadedFiles.length === 0) return '';
    
    const selectedFiles = uploadedFiles.filter(f => f.selected);
    if (selectedFiles.length === 0) return '';

    addNotification('info', `A resumir ${selectedFiles.length} ficheiro(s) para contexto...`, 'Este processo pode demorar alguns segundos.');

    const summaryPromises = selectedFiles.map(file => {
      const fileContent = file.chunks.join('\n\n');
      if (!fileContent.trim()) {
        return Promise.resolve('');
      }
      const summaryPrompt = `Você é um assistente de IA especialista em resumir documentos. Resuma o texto a seguir, focando APENAS nas informações mais relevantes para o tópico: "${query}". O resumo deve ser conciso, direto e em formato de tópicos (bullet points) se possível. Retorne apenas o resumo. TEXTO: \n\n${fileContent}`;
      return callGemini(summaryPrompt, false); // Thinking mode not needed for summarization
    });

    const summaries = await Promise.all(summaryPromises);
    
    const context = selectedFiles
      .map((file, index) => {
        const summary = summaries[index];
        if (summary && !summary.startsWith("Erro:")) {
          return `Contexto resumido do ficheiro "${file.name}":\n${summary}`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    if (!context.trim()) {
      return '';
    }
      
    return `\n\nAdicionalmente, utilize o conteúdo resumido dos seguintes documentos de apoio (RAG) como base de conhecimento:\n\n--- INÍCIO DOS RESUMOS DE APOIO ---\n${context}\n--- FIM DOS RESUMOS DE APOIO ---`;
  }, [uploadedFiles, addNotification]);

  const webSearchInstruction = "\n\nAdicionalmente, para uma resposta mais completa e atualizada, realize uma pesquisa na web por informações relevantes, incluindo notícias, atualizações na Lei 14.133/21 e jurisprudências recentes sobre o tema.";

  const handleGenerate = async (docType: DocumentType, sectionId: string, title: string) => {
    const currentSections = docType === 'etp' ? etpSectionsContent : trSectionsContent;
    const allSections = docType === 'etp' ? etpSections : trSections;
    setLoadingSection(sectionId);

    let context = '';
    let prompt = '';
    
    if(docType === 'etp') {
      const demandaText = currentSections['etp-2'] || '';
      if (sectionId !== 'etp-2') {
        // R.V-01: Quality Gate
        if (demandaText.trim().length < 200) {
            addNotification('error', 'Contexto Insuficiente', "O campo '2. Descrição da Necessidade' deve ter no mínimo 200 caracteres para permitir uma geração de conteúdo de qualidade pela IA.");
            setValidationErrors(prev => new Set(prev).add('etp-2'));
            setLoadingSection(null);
            return;
        }
      }
      context = `Contexto Principal (Descrição da Necessidade): ${demandaText}\n`;
      allSections.forEach(sec => {
        const content = currentSections[sec.id];
        if (sec.id !== sectionId && typeof content === 'string' && content.trim()) {
          context += `\nContexto Adicional (${sec.title}): ${content.trim()}\n`;
        }
      });
      const ragContext = await getRagContext(title);
      prompt = `Você é um especialista em planeamento de contratações públicas no Brasil. Sua tarefa é gerar o conteúdo para a seção "${title}" de um Estudo Técnico Preliminar (ETP).\n\nUse o seguinte contexto do formulário como base:\n${context}\n${ragContext}\n\nGere um texto detalhado e tecnicamente correto para a seção "${title}", utilizando a Lei 14.133/21 como referência principal e incorporando as informações do formulário e dos documentos de apoio.`;
    } else if (docType === 'tr') { // TR
      if (!loadedEtpForTr) {
        addNotification('info', 'Atenção', 'Por favor, carregue um ETP para usar como contexto antes de gerar o TR.');
        setLoadingSection(null);
        return;
      }
      const objetoText = currentSections['tr-1'] || '';
      if(sectionId !== 'tr-1' && !objetoText.trim()) {
        addNotification('info', 'Atenção', "Por favor, preencha a seção '1. Objeto' primeiro, pois ela serve de base para as outras.");
        setValidationErrors(new Set(['tr-1']));
        setLoadingSection(null);
        return;
      }
      
      context = `--- INÍCIO DO ETP ---\n${loadedEtpForTr.content}\n--- FIM DO ETP ---\n\n`;
      if (loadedRiskMapForTr) {
        context += `--- INÍCIO DO MAPA DE RISCOS ---\n${loadedRiskMapForTr.content}\n--- FIM DO MAPA DE RISCOS ---\n\n`;
      }

      allSections.forEach(sec => {
        const content = currentSections[sec.id];
        if (sec.id !== sectionId && typeof content === 'string' && content.trim()) {
          context += `\nContexto Adicional do TR já preenchido (${sec.title}): ${content.trim()}\n`;
        }
      });
      const ragContext = await getRagContext(title);
      prompt = `Você é um especialista em licitações públicas no Brasil. Sua tarefa é gerar o conteúdo para a seção "${title}" de um Termo de Referência (TR).\n\nPara isso, utilize as seguintes fontes de informação, em ordem de prioridade:\n1. O Estudo Técnico Preliminar (ETP) base.\n2. O Mapa de Riscos associado.\n3. Os documentos de apoio (RAG) fornecidos.\n4. O conteúdo já preenchido em outras seções do TR.\n\n${context}\n${ragContext}\n\nGere um texto detalhado e bem fundamentado para a seção "${title}" do TR, extraindo e inferindo as informações necessárias das fontes fornecidas, especialmente considerando os riscos identificados para propor controles e obrigações no TR.`;
    }
    
    const finalPrompt = prompt + (useWebSearch ? webSearchInstruction : '');

    try {
      const generatedText = await callGemini(finalPrompt, useWebSearch, useThinkingMode);
      if (generatedText && !generatedText.startsWith("Erro:")) {
        setGeneratedContentModal({ docType, sectionId, title, content: generatedText });
      } else {
        addNotification('error', 'Erro de Geração', generatedText);
      }
    } catch (error: any) {
      addNotification('error', 'Erro Inesperado', `Falha ao gerar texto: ${error.message}`);
    } finally {
        setLoadingSection(null);
    }
  };

  const handleAcceptGeneratedContent = () => {
    if (!generatedContentModal) return;
    const { docType, sectionId, content } = generatedContentModal;
    
    // R.R-01: Mark field as generated by AI
    setAiGeneratedFields(prev => new Set(prev).add(sectionId));
    
    handleSectionChange(docType, sectionId, content);
    setGeneratedContentModal(null);
  };

  const handleGenerateTrFromEtp = async () => {
    if (!loadedEtpForTr) {
        addNotification('info', 'ETP Necessário', 'Por favor, selecione um ETP da lista para gerar o TR.');
        return;
    }

    setIsConvertingEtpToTr(true);
    addNotification('info', 'Geração de TR iniciada', 'A IA está a analisar o ETP e a gerar um rascunho do Termo de Referência. Este processo pode demorar um pouco.');

    const trSectionIds = trSections.map(s => s.id);
    const prompt = `
    Você é um especialista em licitações e contratos públicos no Brasil, com profundo conhecimento da Lei 14.133/21. Sua tarefa é converter o Estudo Técnico Preliminar (ETP) fornecido em um Termo de Referência (TR) completo.

    Analise o conteúdo do ETP abaixo e gere o conteúdo correspondente para cada seção do TR.

    Responda APENAS com um objeto JSON válido, sem formatação de markdown (como \`\`\`json). O objeto deve ter chaves que correspondem aos IDs das seções do TR e os valores devem ser o texto gerado para cada seção. Não inclua nenhuma explicação ou texto fora do objeto JSON.

    Os IDs das seções do TR que você deve preencher são: ${trSectionIds.map(id => `'${id}'`).join(', ')}

    Exemplo de formato de saída:
    {
      "tr-1": "Conteúdo gerado para a seção Objeto...",
      "tr-2": "Conteúdo gerado para a seção Justificativa..."
    }

    --- INÍCIO DO ETP DE CONTEXTO ---
    ${loadedEtpForTr.content}
    --- FIM DO ETP DE CONTEXTO ---

    Agora, gere o objeto JSON com o conteúdo do Termo de Referência.
    `;

    try {
        // Use 'Thinking Mode' for this complex task, which uses gemini-2.5-pro
        const result = await callGemini(prompt, useWebSearch, true); 

        if (result.startsWith("Erro:")) {
            throw new Error(result);
        }

        // Attempt to parse the JSON response
        let parsedResult: Record<string, string>;
        try {
            parsedResult = JSON.parse(result);
        } catch (parseError) {
            console.error("Erro ao analisar JSON da API Gemini:", parseError);
            console.error("Resposta recebida:", result);
            throw new Error("A resposta da IA não estava no formato JSON esperado. Verifique o console para mais detalhes.");
        }
        
        setTrSectionsContent(prev => ({ ...prev, ...parsedResult }));
        addNotification('success', 'TR Gerado com Sucesso', 'Um rascunho do Termo de Referência foi preenchido com base no ETP selecionado.');

    } catch (error: any) {
        addNotification('error', 'Erro na Geração do TR', error.message || 'Ocorreu um erro inesperado ao gerar o TR a partir do ETP.');
    } finally {
        setIsConvertingEtpToTr(false);
    }
  };

  const handleComplianceCheck = async () => {
    setIsCheckingCompliance(true);
    setIsComplianceModalOpen(true);
    setComplianceCheckResult('A IA está a analisar o seu documento... Por favor, aguarde.');

    const trSectionsForAnalysis = trSections
        .map(section => {
            const content = trSectionsContent[section.id] || '';
            if (content && String(content).trim()) {
                const legalReference = section.tooltip?.match(/Conforme (Art\. [\s\S]+)/)?.[1]?.split('.')[0] || 'Não especificado';
                return `
---
**Seção: ${section.title}**
**Referência Legal:** ${legalReference}
**Conteúdo:**
${content}
---
`;
            }
            return null;
        })
        .filter(Boolean)
        .join('\n');

    if (!trSectionsForAnalysis.trim()) {
        setComplianceCheckResult('O Termo de Referência está vazio. Por favor, preencha as seções antes de verificar a conformidade.');
        setIsCheckingCompliance(false);
        return;
    }

    const lawExcerpts = `
    **Lei nº 14.133/2021 (Excertos Relevantes para Termo de Referência):**
    Art. 6º, XXIII: O TR deve conter: a) definição do objeto, quantitativos, prazo; b) fundamentação (referência ao ETP); c) descrição da solução (ciclo de vida); d) requisitos da contratação; e) modelo de execução; f) modelo de gestão; g) critérios de medição e pagamento; h) forma de seleção do fornecedor; i) estimativas de valor; j) adequação orçamentária.
    Art. 40, § 1º: O TR deve conter os elementos do Art. 6º, XXIII, e mais: I - especificação do produto/serviço (qualidade, rendimento, etc.); II - locais de entrega e regras para recebimento; III - garantia, manutenção e assistência técnica.
    `;

    const prompt = `
    Você é um auditor especialista em licitações e contratos públicos, com profundo conhecimento da Lei nº 14.133/2021. Sua tarefa é realizar uma análise de conformidade detalhada, seção por seção, de um Termo de Referência (TR).

    **Contexto Legal de Referência:**
    ${lawExcerpts}

    **Termo de Referência para Análise (Estruturado por Seção):**
    ${trSectionsForAnalysis}

    **Sua Tarefa:**
    Analise CADA seção do Termo de Referência fornecido, comparando o conteúdo da seção com a sua respectiva "Referência Legal" indicada.

    Elabore um relatório de conformidade detalhado em formato Markdown. O relatório deve conter:

    1.  **Análise por Seção:** Para cada seção do TR, crie um subtítulo e detalhe os seguintes pontos:
        *   **Referência Legal:** Repita o artigo da lei correspondente.
        *   **Análise:** Comente de forma objetiva se o conteúdo da seção atende aos requisitos do artigo.
        *   **Status:** Classifique a seção com um dos seguintes emojis e rótulos: "✅ **Conforme**", "⚠️ **Ponto de Atenção**" (se estiver incompleto ou ambíguo), ou "❌ **Não Conforme**" (se contradiz a lei ou omite informação crucial).
        *   **Recomendação:** Se o status for de atenção ou não conforme, forneça uma sugestão clara e prática para ajustar o texto e adequá-lo à legislação.

    2.  **Resumo Geral:** Ao final, adicione uma seção de resumo com:
        *   **Pontos Fortes:** Um resumo dos principais pontos positivos do documento.
        *   **Principais Pontos a Melhorar:** Um resumo dos pontos mais críticos que precisam de ajuste em todo o documento.

    Seja técnico, objetivo e didático. A estrutura do seu relatório é crucial para a clareza da análise.
    `;
    
    const finalPrompt = prompt + (useWebSearch ? webSearchInstruction : '');

    try {
        const result = await callGemini(finalPrompt, useWebSearch, useThinkingMode);
        setComplianceCheckResult(result);
    } catch (error: any) {
        setComplianceCheckResult(`Erro ao verificar a conformidade: ${error.message}`);
    } finally {
        setIsCheckingCompliance(false);
    }
  };


  const validateForm = (docType: DocumentType, sections: Record<string, string>): string[] => {
    const errors: string[] = [];
    const errorFields = new Set<string>();

    const requiredFields: { [key in DocumentType]?: { id: string; name: string }[] } = {
        etp: [
            { id: 'etp-2', name: '2. Descrição da Necessidade' },
            { id: 'etp-7', name: '7. Estimativas das Quantidades' },
            { id: 'etp-8', name: '8. Estimativa do Valor' },
            { id: 'etp-9', name: '9. Justificativa para o Parcelamento' },
            { id: 'etp-15', name: '15. Declaração da Viabilidade' },
        ],
        tr: [
            { id: 'tr-1', name: '1. Objeto' },
        ],
    };

    const fieldsToValidate = requiredFields[docType] || [];

    fieldsToValidate.forEach(field => {
        if (!sections[field.id] || String(sections[field.id] || '').trim() === '') {
            errors.push(`O campo "${field.name}" é obrigatório.`);
            errorFields.add(field.id);
        }
    });

    setValidationErrors(errorFields);
    return errors;
  };

  const handleSaveDocument = (docType: DocumentType) => {
    const sections = docType === 'etp' ? etpSectionsContent : trSectionsContent;
    
    const validationMessages = validateForm(docType, sections);
    if (docType !== 'risk-map' && validationMessages.length > 0) {
        addNotification(
            'error',
            "Campos Obrigatórios",
            `Por favor, preencha os seguintes campos antes de salvar:\n- ${validationMessages.join('\n- ')}`
        );
        return;
    }

    const name = `${docType.toUpperCase()} ${new Date().toLocaleString('pt-BR').replace(/[/:,]/g, '_')}`;
    const now = new Date().toISOString();
    
    if (docType === 'etp') {
      const newDoc: SavedDocument = {
        id: Date.now(), type: 'etp', name, createdAt: now, updatedAt: now, sections: { ...sections },
        attachments: etpAttachments, history: [], priority: currentEtpPriority, status: 'draft',
      };
      const updatedETPs = [...savedETPs, newDoc];
      setSavedETPs(updatedETPs);
      storage.saveETPs(updatedETPs);
      addNotification("success", "Sucesso", `ETP "${name}" guardado com sucesso!`);
    } else if (docType === 'tr') {
      const newDoc: SavedDocument = {
        id: Date.now(), type: 'tr', name, createdAt: now, updatedAt: now, sections: { ...sections },
        attachments: trAttachments, history: [], priority: currentTrPriority, status: 'draft',
      };
      const updatedTRs = [...savedTRs, newDoc];
      setSavedTRs(updatedTRs);
      storage.saveTRs(updatedTRs);
      addNotification("success", "Sucesso", `TR "${name}" guardado com sucesso!`);
    } else if (docType === 'risk-map') {
        const newDoc: SavedDocument = {
            id: Date.now(), type: 'risk-map', name, createdAt: now, updatedAt: now, sections: { ...riskMapSectionsContent },
            priority: currentRiskMapPriority, history: [], status: 'draft',
            riskMapData: { revisionHistory, riskIdentification, riskEvaluation, riskMonitoring }
        };
        const updatedMaps = [...savedRiskMaps, newDoc];
        setSavedRiskMaps(updatedMaps);
        storage.saveRiskMaps(updatedMaps);
        addNotification("success", "Sucesso", `Mapa de Risco "${name}" guardado com sucesso!`);
    }
  };
  
  const handleLoadDocument = (docType: DocumentType, id: number) => {
    const docs = docType === 'etp' ? savedETPs : docType === 'tr' ? savedTRs : savedRiskMaps;
    const docToLoad = docs.find(doc => doc.id === id);
    if(docToLoad) {
      setAiGeneratedFields(new Set()); // Clear AI highlights when loading a new doc
      if (docType === 'etp') {
        setEtpSectionsContent(docToLoad.sections);
        setEtpAttachments(docToLoad.attachments || []);
        setCurrentEtpPriority(docToLoad.priority || 'medium');
        storage.saveFormState('etpFormState', docToLoad.sections);
        setBrandAlertShownForEtp4(false);
      } else if (docType === 'tr') {
        setTrSectionsContent(docToLoad.sections);
        setTrAttachments(docToLoad.attachments || []);
        setCurrentTrPriority(docToLoad.priority || 'medium');
        storage.saveFormState('trFormState', docToLoad.sections);
      } else if (docType === 'risk-map') {
        setRiskMapSectionsContent(docToLoad.sections);
        setCurrentRiskMapPriority(docToLoad.priority || 'medium');
        const data = docToLoad.riskMapData;
        setRevisionHistory(data?.revisionHistory || []);
        setRiskIdentification(data?.riskIdentification || []);
        setRiskEvaluation(data?.riskEvaluation || []);
        setRiskMonitoring(data?.riskMonitoring || []);
        storage.saveFormState('riskMapFormState', { sections: docToLoad.sections, riskMapData: data });
      }

      addNotification('success', 'Documento Carregado', `O ${docType.toUpperCase().replace('-', ' ')} "${docToLoad.name}" foi carregado.`);
      setActiveView(docType);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  const handleDeleteDocument = (docType: DocumentType, id: number) => {
    if (docType === 'etp') {
      const updated = savedETPs.filter(doc => doc.id !== id);
      setSavedETPs(updated);
      storage.saveETPs(updated);
    } else if (docType === 'tr') {
      const updated = savedTRs.filter(doc => doc.id !== id);
      setSavedTRs(updated);
      storage.saveTRs(updated);
    } else if (docType === 'risk-map') {
      const updated = savedRiskMaps.filter(doc => doc.id !== id);
      setSavedRiskMaps(updated);
      storage.saveRiskMaps(updated);
    }
    addNotification('success', 'Sucesso', `O documento foi apagado.`);
  };

  const handleStartEditing = (type: DocumentType, doc: SavedDocument) => {
    setEditingDoc({ type, id: doc.id, name: doc.name, priority: doc.priority || 'medium' });
  };

  const handleUpdateDocumentDetails = () => {
    if (!editingDoc) return;

    const { type, id, name, priority } = editingDoc;
    const newName = name.trim();
    if (!newName) {
        setEditingDoc(null); // Cancel edit if name is empty
        return;
    }

    const updateDocs = (docs: SavedDocument[]) => docs.map(doc =>
        doc.id === id ? { ...doc, name: newName, priority: priority } : doc
    );

    if (type === 'etp') {
        const updated = updateDocs(savedETPs);
        setSavedETPs(updated);
        storage.saveETPs(updated);
    } else if (type === 'tr') {
        const updated = updateDocs(savedTRs);
        setSavedTRs(updated);
        storage.saveTRs(updated);
    } else if (type === 'risk-map') {
        const updated = updateDocs(savedRiskMaps);
        setSavedRiskMaps(updated);
        storage.saveRiskMaps(updated);
    }

    setEditingDoc(null);
  };

  const handleEditorBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      handleUpdateDocumentDetails();
    }
  };

  const handleToggleDocStatus = (docType: DocumentType, id: number) => {
    const updateDocs = (docs: SavedDocument[]) => {
        return docs.map(doc => {
            if (doc.id === id) {
                // FIX: Explicitly type `newStatus` to prevent type widening to `string`.
                const newStatus: 'draft' | 'reviewed' = (doc.status === 'reviewed' || !doc.status) ? 'draft' : 'reviewed';
                addNotification('info', 'Status Alterado', `O documento "${doc.name}" foi marcado como "${newStatus === 'reviewed' ? 'Revisado' : 'Rascunho'}".`);
                return { ...doc, status: newStatus };
            }
            return doc;
        });
    };

    if (docType === 'etp') {
        const updated = updateDocs(savedETPs);
        setSavedETPs(updated);
        storage.saveETPs(updated);
    } else if (docType === 'tr') {
        const updated = updateDocs(savedTRs);
        setSavedTRs(updated);
        storage.saveTRs(updated);
    } else if (docType === 'risk-map') {
        const updated = updateDocs(savedRiskMaps);
        setSavedRiskMaps(updated);
        storage.saveRiskMaps(updated);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);

    const filesToProcess = fileList.map(file => ({
      name: file.name,
      status: 'processing' as const,
      message: ''
    }));
    setProcessingFiles(filesToProcess);

    const successfullyProcessed: UploadedFile[] = [];
    const currentFileNames = uploadedFiles.map(f => f.name);

    for (const file of fileList) {
      try {
        const processedFile = await processSingleUploadedFile(file, [
          ...currentFileNames, 
          ...successfullyProcessed.map(f => f.name)
        ]);
        successfullyProcessed.push(processedFile);

        setProcessingFiles(prev =>
          prev.map(p => (p.name === file.name ? { ...p, status: 'success' } : p))
        );
      } catch (error: any) {
        setProcessingFiles(prev =>
          prev.map(p =>
            p.name === file.name ? { ...p, status: 'error', message: error.message } : p
          )
        );
      }
    }

    if (successfullyProcessed.length > 0) {
      const updatedFiles = [...uploadedFiles, ...successfullyProcessed];
      setUploadedFiles(updatedFiles);
      storage.saveStoredFiles(updatedFiles);
      addNotification('success', 'Sucesso', `${successfullyProcessed.length} ficheiro(s) carregado(s).`);
    }

    setTimeout(() => {
      setProcessingFiles([]);
    }, 5000);

    event.target.value = ''; // Reset input
  };
  
  const handleToggleFileSelection = (index: number) => {
    const updatedFiles = uploadedFiles.map((file, i) =>
      i === index ? { ...file, selected: !file.selected } : file
    );
    setUploadedFiles(updatedFiles);
    storage.saveStoredFiles(updatedFiles);
  };

  const handleDeleteFile = (index: number) => {
      const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(updatedFiles);
      storage.saveStoredFiles(updatedFiles);
  };

  const handleToggleFileLock = (index: number) => {
    const file = uploadedFiles[index];
    const updatedFiles = uploadedFiles.map((f, i) =>
        i === index ? { ...f, isLocked: !(f.isLocked ?? false) } : f
    );
    setUploadedFiles(updatedFiles);
    storage.saveStoredFiles(updatedFiles);
    addNotification('info', 'Status do Ficheiro', `O ficheiro "${file.name}" foi ${!(file.isLocked ?? false) ? 'bloqueado' : 'desbloqueado'}.`);
  };

  const handlePreviewRagFile = (file: UploadedFile) => {
    if (!file.content || !file.type) {
      addNotification('info', 'Pré-visualização Indisponível', 'Este ficheiro foi carregado numa versão anterior e não tem conteúdo para pré-visualização. Por favor, remova-o e carregue-o novamente.');
      return;
    }
    const attachmentToPreview: Attachment = {
      name: file.name,
      type: file.type,
      content: file.content,
      size: 0, // not important for this preview
      description: 'Documento de Apoio (RAG)'
    };
    setViewingAttachment(attachmentToPreview);
    setIsRagPreviewModalOpen(true);
  };

  const handleLoadEtpForTr = (etpId: string) => {
    if (etpId === "") {
        setLoadedEtpForTr(null);
        return;
    }
    const etp = savedETPs.find(e => e.id === parseInt(etpId, 10));
    if (etp) {
        const content = etpSections
            .map(section => `## ${section.title}\n${etp.sections[section.id] || 'Não preenchido.'}`)
            .join('\n\n');
        setLoadedEtpForTr({ id: etp.id, name: etp.name, content });
    }
  };
  
  const handleLoadRiskMapForTr = (riskMapId: string) => {
    if (riskMapId === "") {
        setLoadedRiskMapForTr(null);
        return;
    }
    const map = savedRiskMaps.find(m => m.id === parseInt(riskMapId, 10));
    if (map) {
        let content = `# Mapa de Riscos: ${map.name}\n\n`;

        if (map.sections && map.sections['risk-map-intro']) {
             content += `## 1. Introdução\n${map.sections['risk-map-intro']}\n\n`;
        }

        const riskIdentification = map.riskMapData?.riskIdentification;
        if (riskIdentification && riskIdentification.length > 0) {
            content += '## 2. Identificação e Análise dos Principais Riscos\n';
            content += '| Id | Risco | Relacionado a | P | I | Nível |\n';
            content += '|---|---|---|---|---|---|\n';
            riskIdentification.forEach(row => {
                const p = parseInt(row.probability, 10) || 0;
                const i = parseInt(row.impact, 10) || 0;
                content += `| ${row.riskId || ''} | ${row.risk || ''} | ${row.relatedTo || ''} | ${row.probability || ''} | ${row.impact || ''} | ${p*i} |\n`;
            });
            content += '\n';
        }
        
        const riskEvaluation = map.riskMapData?.riskEvaluation;
        if (riskEvaluation && riskEvaluation.length > 0) {
            content += '## 3. Avaliação e Tratamento dos Riscos Identificados\n';
            riskEvaluation.forEach(block => {
                content += `### Risco: ${block.riskId || ''} - ${block.riskDescription || ''}\n`;
                content += `- **Probabilidade:** ${block.probability || 'N/A'}\n`;
                content += `- **Impacto:** ${block.impact || 'N/A'}\n`;
                content += `- **Dano:** ${block.damage || 'N/A'}\n`;
                content += `- **Tratamento:** ${block.treatment || 'N/A'}\n`;
                if(block.preventiveActions?.length > 0) {
                   content += "**Ações Preventivas:**\n";
                   block.preventiveActions.forEach(action => {
                       content += `  - ${action.actionId || ''}: ${action.action || ''} (Responsável: ${action.responsible || ''})\n`;
                   });
                }
                 if(block.contingencyActions?.length > 0) {
                   content += "**Ações de Contingência:**\n";
                   block.contingencyActions.forEach(action => {
                       content += `  - ${action.actionId || ''}: ${action.action || ''} (Responsável: ${action.responsible || ''})\n`;
                   });
                }
                content += '\n';
            });
        }
        setLoadedRiskMapForTr({ id: map.id, name: map.name, content });
    }
  };

  const handleImportEtpAttachments = () => {
    if (!loadedEtpForTr) {
      addNotification('info', 'Aviso', 'Nenhum ETP carregado para importar anexos.');
      return;
    }
    const etp = savedETPs.find(e => e.id === loadedEtpForTr.id);
    if (etp && etp.attachments && etp.attachments.length > 0) {
      const newAttachments = etp.attachments.filter(
        att => !trAttachments.some(trAtt => trAtt.name === att.name)
      );
      if (newAttachments.length > 0) {
        setTrAttachments(prev => [...prev, ...newAttachments]);
        addNotification('success', 'Sucesso', `${newAttachments.length} anexo(s) importado(s) do ETP "${etp.name}".`);
      } else {
        addNotification('info', 'Informação', 'Todos os anexos do ETP já constam neste TR.');
      }
    } else {
      addNotification('info', 'Aviso', `O ETP "${loadedEtpForTr.name}" não possui anexos para importar.`);
    }
  };

  const handleRiskAnalysis = async (docType: DocumentType, sectionId: string, title: string) => {
    const currentSections = docType === 'etp' ? etpSectionsContent : trSectionsContent;
    const sectionContent = currentSections[sectionId];

    if (!sectionContent || String(sectionContent || '').trim() === '') {
        addNotification('info', 'Aviso', `Por favor, preencha ou gere o conteúdo da seção "${title}" antes de realizar a análise de riscos.`);
        return;
    }

    setAnalysisContent({ title: `Analisando Riscos para: ${title}`, content: 'A IA está a pensar... por favor, aguarde.' });

    const ragContext = await getRagContext(title);
    let primaryContext = '';
    
    if (docType === 'tr') {
        let etpContext = '';
        if (loadedEtpForTr) {
            etpContext = `--- INÍCIO DO ETP DE CONTEXTO ---\n${loadedEtpForTr.content}\n--- FIM DO ETP DE CONTEXTO ---\n\n`;
        }

        const trOtherSectionsContext = Object.entries(currentSections)
            .filter(([key, value]) => key !== sectionId && value && String(value || '').trim())
            .map(([key, value]) => `Contexto da Seção do TR (${trSections.find(s => s.id === key)?.title}):\n${String(value || '').trim()}`)
            .join('\n\n');
        
        primaryContext = `${etpContext}${trOtherSectionsContext}`;
        
    } else if (docType === 'etp') {
        primaryContext = Object.entries(currentSections)
            .filter(([key, value]) => key !== sectionId && value)
            .map(([key, value]) => `Contexto Adicional (${etpSections.find(s => s.id === key)?.title}): ${String(value || '').trim()}`)
            .join('\n');
    }

    const prompt = `Você é um especialista em gestão de riscos em contratações públicas no Brasil, com profundo conhecimento da Lei 14.133/21. Sua tarefa é realizar uma análise de risco detalhada sobre o conteúdo da seção "${title}" de um ${docType.toUpperCase()}.

Utilize o contexto geral do documento e os documentos de apoio (RAG) para uma análise completa.

**Seção a ser analisada:**
${sectionContent}

**Contexto Adicional (Outras seções, ETP, etc.):**
${primaryContext}
${ragContext}

**Sua Tarefa Detalhada:**
Analise o conteúdo da seção fornecida e elabore um relatório de riscos detalhado em formato Markdown. O relatório deve seguir a estrutura abaixo para CADA risco identificado (identifique de 3 a 5 riscos principais):

---

**Risco [Nº]: [Nome do Risco]**
*   **Descrição:** Detalhe o risco, explicando como ele pode se manifestar com base no conteúdo da seção e no contexto geral da contratação.
*   **Causa Raiz:** Aponte as possíveis causas ou gatilhos para a ocorrência deste risco.
*   **Classificação:**
    *   **Probabilidade:** (Baixa, Média, Alta)
    *   **Impacto:** (Baixo, Médio, Alto) - Descreva brevemente o impacto financeiro, operacional ou legal caso o risco se concretize.
*   **Nível de Risco:** (Trivial, Tolerável, Substancial, Intolerável) - Com base na combinação de probabilidade e impacto.
*   **Medidas de Mitigação:** Proponha ações claras e práticas para reduzir a probabilidade ou o impacto do risco. Inclua sugestões de como o texto da seção poderia ser ajustado para mitigar o risco.
*   **Responsável Sugerido:** Indique quem deveria ser o responsável por monitorar e mitigar o risco (ex: Fiscal do Contrato, Gestor, Equipe Técnica).

---

Seja técnico, objetivo e forneça uma análise que agregue valor prático ao planejamento da contratação.`;
    
    const finalPrompt = prompt + (useWebSearch ? webSearchInstruction : '');

    try {
        const analysisResult = await callGemini(finalPrompt, useWebSearch, useThinkingMode);
        setAnalysisContent({ title: `Análise de Riscos: ${title}`, content: analysisResult });
    } catch (error: any) {
        setAnalysisContent({ title: `Análise de Riscos: ${title}`, content: `Erro ao realizar análise: ${error.message}` });
    }
  };

  const handleOpenEditModal = (docType: DocumentType, sectionId: string, title: string) => {
    const content = (docType === 'etp' ? etpSectionsContent : trSectionsContent)[sectionId] || '';
    setEditingContent({ docType, sectionId, title, text: content });
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingContent(null);
    setRefinePrompt('');
    setIsRefining(false);
  };
  
  const handleSaveChanges = () => {
    if (!editingContent) return;
    const { docType, sectionId, text } = editingContent;
    handleSectionChange(docType, sectionId, text);
    closeEditModal();
  };
  
  const handleRefineText = async () => {
    if (!editingContent || !refinePrompt) return;
    setIsRefining(true);
    
    const prompt = `Você é um assistente de redação especializado em documentos públicos. Refine o texto a seguir com base na solicitação do usuário. Retorne apenas o texto refinado, sem introduções ou observações.

--- INÍCIO DO TEXTO ORIGINAL ---
${editingContent.text}
--- FIM DO TEXTO ORIGINAL ---

Solicitação do usuário: "${refinePrompt}"

--- TEXTO REFINADO ---`;

    try {
      const refinedText = await callGemini(prompt, useWebSearch, useThinkingMode);
      if (refinedText && !refinedText.startsWith("Erro:")) {
        setEditingContent({ ...editingContent, text: refinedText });
      } else {
        addNotification("error", "Erro de Refinamento", refinedText);
      }
    } catch (error: any) {
      addNotification('error', 'Erro Inesperado', `Falha ao refinar o texto: ${error.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  const handleExportToPDF = () => {
    if (!previewContext.type || previewContext.id === null) return;

    const { type, id } = previewContext;
    const docs = type === 'etp' ? savedETPs : savedTRs;
    const docToExport = docs.find(d => d.id === id);

    if (docToExport) {
        const allSections = type === 'etp' ? etpSections : trSections;
        exportDocumentToPDF(docToExport, allSections, summaryState.content);
    } else {
        addNotification('error', 'Erro', 'Não foi possível encontrar o documento para exportar.');
    }
  };
  
  const handleExportRiskMapToPDF = () => {
    const riskMapData = {
        revisionHistory,
        riskIdentification,
        riskEvaluation,
        riskMonitoring
    };
    
    const docToExport: SavedDocument = {
        id: Date.now(),
        type: 'risk-map',
        name: `Mapa de Riscos ${new Date().toLocaleDateString('pt-BR')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: riskMapSectionsContent,
        riskMapData: riskMapData
    };

    exportRiskMapToPDF(docToExport);
  };
  
  const handleClearForm = useCallback((docType: DocumentType) => () => {
    setAiGeneratedFields(new Set());
    if (docType === 'etp') {
        setEtpSectionsContent({});
        setEtpAttachments([]);
        setCurrentEtpPriority('medium');
        storage.saveFormState('etpFormState', {});
        setBrandAlertShownForEtp4(false);
    } else if (docType === 'tr') {
        setTrSectionsContent({});
        setTrAttachments([]);
        setCurrentTrPriority('medium');
        setLoadedEtpForTr(null);
        setLoadedRiskMapForTr(null);
        const etpSelector = document.getElementById('etp-selector') as HTMLSelectElement;
        if (etpSelector) etpSelector.value = "";
        const riskMapSelector = document.getElementById('risk-map-selector') as HTMLSelectElement;
        if (riskMapSelector) riskMapSelector.value = "";
        storage.saveFormState('trFormState', {});
    } else if (docType === 'risk-map') {
        setRiskMapSectionsContent({});
        setCurrentRiskMapPriority('medium');
        setRevisionHistory([]);
        setRiskIdentification([]);
        setRiskEvaluation([]);
        setRiskMonitoring([]);
        storage.saveFormState('riskMapFormState', {});
    }
    addNotification('info', 'Formulário Limpo', `O formulário do ${docType.toUpperCase()} foi limpo.`);
  }, [addNotification]);

  const getAttachmentDataUrl = (attachment: Attachment) => {
    return `data:${attachment.type};base64,${attachment.content}`;
  };
  
  const handleGenerateSummary = async () => {
      if (!previewContext.type || previewContext.id === null) return;

      const { type, id } = previewContext;
      const docs = type === 'etp' ? savedETPs : savedTRs;
      const doc = docs.find(d => d.id === id);

      if (!doc) {
        addNotification('error', 'Erro', 'Documento não encontrado para gerar o resumo.');
        return;
      }

      setSummaryState({ loading: true, content: null });

      const allSections = type === 'etp' ? etpSections : trSections;
      const documentText = allSections
        .map(section => {
          const content = doc.sections[section.id];
          if (content && String(content).trim()) {
            return `### ${section.title}\n${content}`;
          }
          return null;
        })
        .filter(Boolean)
        .join('\n\n---\n\n');

      if (!documentText.trim()) {
        setSummaryState({ loading: false, content: 'O documento está vazio e não pode ser resumido.' });
        return;
      }
      
      const ragContext = await getRagContext("Resumo Geral do Documento");

      const prompt = `Você é um assistente especializado em analisar documentos de licitações públicas. Sua tarefa é criar um resumo executivo do "Documento Principal" a seguir. Utilize os "Documentos de Apoio (RAG)" como contexto para entender melhor o tema.

      O resumo deve ser conciso, focar APENAS nas informações do "Documento Principal" e destacar os seguintes pontos:
      1.  O objetivo principal da contratação.
      2.  Os elementos ou requisitos mais importantes.
      3.  A conclusão ou solução recomendada.

      Seja direto e claro. O resumo não deve exceder 200 palavras.

      --- INÍCIO DO DOCUMENTO PRINCIPAL ---
      ${documentText}
      --- FIM DO DOCUMENTO PRINCIPAL ---
      
      ${ragContext}

      --- RESUMO EXECUTIVO ---`;
      
      const finalPrompt = prompt + (useWebSearch ? webSearchInstruction : '');

      try {
        const summary = await callGemini(finalPrompt, useWebSearch, useThinkingMode);
        if (summary && !summary.startsWith("Erro:")) {
          setSummaryState({ loading: false, content: summary });
        } else {
          setSummaryState({ loading: false, content: `Erro ao gerar resumo: ${summary}` });
        }
      } catch (error: any) {
        setSummaryState({ loading: false, content: `Falha inesperada ao gerar resumo: ${error.message}` });
      }
    };

  // --- Risk Map Handlers ---

  // Revision History
  const addRevisionHistoryRow = () => setRevisionHistory(prev => [...prev, { id: Date.now(), date: '', version: '', description: '', phase: '', author: '' }]);
  const removeRevisionHistoryRow = (id: number) => setRevisionHistory(prev => prev.filter(row => row.id !== id));
  const handleRevisionHistoryChange = (id: number, field: keyof RevisionHistoryRow, value: string) => {
      setRevisionHistory(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // Risk Identification
  const addRiskIdentificationRow = () => setRiskIdentification(prev => [...prev, { id: Date.now(), riskId: '', risk: '', relatedTo: '', probability: '', impact: '' }]);
  const removeRiskIdentificationRow = (id: number) => setRiskIdentification(prev => prev.filter(row => row.id !== id));
  const handleRiskIdentificationChange = (id: number, field: keyof RiskIdentificationRow, value: string) => {
      setRiskIdentification(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // Risk Evaluation
  const addRiskEvaluationBlock = () => setRiskEvaluation(prev => [...prev, { id: Date.now(), riskId: '', riskDescription: '', probability: '', impact: '', damage: '', treatment: '', preventiveActions: [], contingencyActions: [] }]);
  const removeRiskEvaluationBlock = (id: number) => setRiskEvaluation(prev => prev.filter(block => block.id !== id));
  const handleRiskEvaluationChange = (id: number, field: keyof RiskEvaluationBlock, value: string) => {
      setRiskEvaluation(prev => prev.map(block => (block.id === id ? { ...block, [field]: value } : block)));
  };
  const addRiskAction = (blockId: number, type: 'preventive' | 'contingency') => {
      setRiskEvaluation(prev => prev.map(block => {
          if (block.id === blockId) {
              const newAction: RiskAction = { id: Date.now(), actionId: '', action: '', responsible: '' };
              const key = type === 'preventive' ? 'preventiveActions' : 'contingencyActions';
              return { ...block, [key]: [...block[key], newAction] };
          }
          return block;
      }));
  };
  const removeRiskAction = (blockId: number, type: 'preventive' | 'contingency', actionId: number) => {
      setRiskEvaluation(prev => prev.map(block => {
          if (block.id === blockId) {
              const key = type === 'preventive' ? 'preventiveActions' : 'contingencyActions';
              return { ...block, [key]: block[key].filter(action => action.id !== actionId) };
          }
          return block;
      }));
  };
  const handleRiskActionChange = (blockId: number, type: 'preventive' | 'contingency', actionId: number, field: keyof RiskAction, value: string) => {
      setRiskEvaluation(prev => prev.map(block => {
          if (block.id === blockId) {
              const key = type === 'preventive' ? 'preventiveActions' : 'contingencyActions';
              const updatedActions = block[key].map(action => action.id === actionId ? { ...action, [field]: value } : action);
              return { ...block, [key]: updatedActions };
          }
          return block;
      }));
  };

  // Risk Monitoring
  const addRiskMonitoringRow = () => setRiskMonitoring(prev => [...prev, { id: Date.now(), date: '', riskId: '', actionId: '', record: '' }]);
  const removeRiskMonitoringRow = (id: number) => setRiskMonitoring(prev => prev.filter(row => row.id !== id));
  const handleRiskMonitoringChange = (id: number, field: keyof RiskMonitoringRow, value: string) => {
      setRiskMonitoring(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };
  // --- End Risk Map Handlers ---

  const renderPreviewContent = () => {
    if (!previewContext.type || previewContext.id === null) return null;
    const { type, id } = previewContext;
    const docs = type === 'etp' ? savedETPs : savedTRs;
    const doc = docs.find(d => d.id === id);
    if (!doc) return <p>Documento não encontrado.</p>;

    const allSections = type === 'etp' ? etpSections : trSections;

    return (
      <div>
        <div className="pb-4 border-b border-slate-200 mb-6">
            <div className="flex justify-between items-start flex-wrap gap-y-3">
              <div>
                  <h1 className="text-3xl font-extrabold text-slate-800 leading-tight">{doc.name}</h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-2">
                      <span><Icon name="calendar-plus" className="mr-1.5" /> Criado em: {new Date(doc.createdAt).toLocaleString('pt-BR')}</span>
                      {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
                      <span><Icon name="calendar-check" className="mr-1.5" /> Última modif.: {new Date(doc.updatedAt).toLocaleString('pt-BR')}</span>
                      )}
                  </div>
              </div>
               <button
                  onClick={handleGenerateSummary}
                  disabled={summaryState.loading}
                  className="flex items-center gap-2 bg-purple-100 text-purple-700 font-bold py-2 px-4 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <Icon name="wand-magic-sparkles" />
                  {summaryState.loading ? 'A resumir...' : 'Gerar Resumo com IA'}
               </button>
            </div>
             {(summaryState.loading || summaryState.content) && (
                <div className="mt-6">
                    <h3 className="font-bold text-slate-800 text-lg mb-2">Resumo Executivo</h3>
                    {summaryState.loading ? (
                        <div className="flex items-center gap-2 text-purple-700 p-4 bg-purple-50 rounded-lg">
                            <Icon name="spinner" className="fa-spin" />
                            <span>A IA está a processar o seu pedido...</span>
                        </div>
                    ) : (
                        <ContentRenderer text={summaryState.content} />
                    )}
                </div>
            )}
        </div>
        
        <div className="space-y-8">
          {allSections.map(section => {
            const content = doc.sections[section.id];
            if (content && String(content || '').trim()) {
              return (
                <div key={section.id}>
                  <h2 className="text-xl font-bold text-slate-700 mb-3">{section.title}</h2>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <ContentRenderer text={content} className="text-slate-800 font-sans leading-relaxed text-base" />
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>

        {doc.attachments && doc.attachments.length > 0 && (
            <div className="mt-8">
                <h2 className="text-xl font-bold text-slate-700 mb-3">Anexos</h2>
                <div className="space-y-3">
                    {doc.attachments.map((att, index) => (
                        <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 truncate">
                                  <Icon name="file-alt" className="text-slate-500" />
                                  <span className="font-medium text-slate-800 truncate">{att.name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                  <button 
                                      onClick={() => viewingAttachment?.name === att.name ? setViewingAttachment(null) : setViewingAttachment(att)} 
                                      className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                                  >
                                      {viewingAttachment?.name === att.name ? 'Ocultar' : 'Visualizar'}
                                  </button>
                              </div>
                          </div>
                          {att.description && (
                              <div className="mt-2 pl-4 ml-6 border-l-2 border-slate-200">
                                <p className="text-sm text-slate-600 italic">"{att.description}"</p>
                              </div>
                          )}
                      </div>
                    ))}
                </div>
            </div>
        )}
        
        {viewingAttachment && (
            <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 truncate" title={viewingAttachment.name}>Visualizando: {viewingAttachment.name}</h3>
                    <button onClick={() => setViewingAttachment(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full">
                        <Icon name="times" className="text-xl" />
                    </button>
                </div>
                <div className="w-full h-[60vh] bg-slate-100 rounded-lg border flex items-center justify-center">
                    {isLoadingPreview ? (
                        <div className="flex flex-col items-center gap-2 text-slate-600">
                            <Icon name="spinner" className="fa-spin text-3xl" />
                            <span>A carregar pré-visualização...</span>
                        </div>
                    ) : previewContent ? (
                        <div className="w-full h-full bg-white overflow-auto rounded-lg">
                            {previewContent.type === 'text' ? (
                                <pre className="text-sm whitespace-pre-wrap font-mono bg-slate-50 p-6 h-full">{previewContent.content}</pre>
                            ) : (
                                <div className="p-2 sm:p-8 bg-slate-100 min-h-full">
                                    <div className="prose max-w-4xl mx-auto p-8 bg-white shadow-lg" dangerouslySetInnerHTML={{ __html: previewContent.content }} />
                                </div>
                            )}
                        </div>
                    ) : viewingAttachment.type.startsWith('image/') ? (
                        <img src={getAttachmentDataUrl(viewingAttachment)} alt={viewingAttachment.name} className="max-w-full max-h-full object-contain" />
                    ) : viewingAttachment.type === 'application/pdf' ? (
                        <object data={getAttachmentDataUrl(viewingAttachment)} type="application/pdf" width="100%" height="100%">
                            <p className="p-4 text-center text-slate-600">O seu navegador não suporta a pré-visualização de PDFs. <a href={getAttachmentDataUrl(viewingAttachment)} download={viewingAttachment.name} className="text-blue-600 hover:underline">Clique aqui para fazer o download.</a></p>
                        </object>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <Icon name="file-download" className="text-5xl text-slate-400 mb-4" />
                            <p className="text-slate-700 text-lg mb-2">A pré-visualização não está disponível para este tipo de ficheiro.</p>
                            <p className="text-slate-500 mb-6 text-sm">({viewingAttachment.type})</p>
                            <a 
                                href={getAttachmentDataUrl(viewingAttachment)} 
                                download={viewingAttachment.name}
                                className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Icon name="download" />
                                Fazer Download
                            </a>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    );
  };

  const switchView = useCallback((view: DocumentType) => {
    setActiveView(view);
    setValidationErrors(new Set());
  }, []);

  const toggleSidebarSection = (section: 'etps' | 'trs' | 'riskMaps' | 'knowledgeBase') => {
    setOpenSidebarSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const handleCreateNewDocument = useCallback((docType: DocumentType) => {
    setIsNewDocModalOpen(false);
    switchView(docType);
    handleClearForm(docType)();
    addNotification(
        'info',
        'Novo Documento',
        `Um novo formulário para ${docType.toUpperCase()} foi iniciado.`
    );
  }, [switchView, handleClearForm, addNotification]);

  const handleCreateFromTemplate = useCallback((template: Template) => {
      setIsNewDocModalOpen(false);
      switchView(template.type);
      setAiGeneratedFields(new Set());
      if (template.type === 'etp') {
          setEtpSectionsContent(template.sections);
          setEtpAttachments([]);
          setCurrentEtpPriority('medium');
          storage.saveFormState('etpFormState', template.sections);
          setBrandAlertShownForEtp4(false);
      } else {
          setTrSectionsContent(template.sections);
          setTrAttachments([]);
          setCurrentTrPriority('medium');
          setLoadedEtpForTr(null);
          setLoadedRiskMapForTr(null);
          const etpSelector = document.getElementById('etp-selector') as HTMLSelectElement;
          if (etpSelector) etpSelector.value = "";
          const riskMapSelector = document.getElementById('risk-map-selector') as HTMLSelectElement;
          if (riskMapSelector) riskMapSelector.value = "";
          storage.saveFormState('trFormState', template.sections);
      }
      addNotification(
          'success',
          'Template Carregado',
          `Um novo documento foi iniciado usando o template "${template.name}".`
      );
  }, [switchView, addNotification]);

  const displayDocumentHistory = (doc: SavedDocument) => {
    setHistoryModalContent(doc);
  };
  
  const handleInstallClick = () => {
    if (!installPrompt) {
        return;
    }
    installPrompt.prompt();
    installPrompt.userChoice.then(({ outcome }: { outcome: 'accepted' | 'dismissed' }) => {
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        setInstallPrompt(null);
        setIsInstallBannerVisible(false);
    });
  };

  const handleDismissInstallBanner = () => {
    sessionStorage.setItem('pwaInstallDismissed', 'true');
    setIsInstallBannerVisible(false);
  };

  const handleShare = async () => {
    const shareData = {
        title: 'TR Genius PWA',
        text: 'Conheça o TR Genius, seu assistente IA para licitações!',
        url: 'https://trgenius.netlify.app/'
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (error) {
            console.error('Erro ao partilhar:', error);
        }
    } else {
        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.writeText(shareData.url);
            addNotification("success", "Link Copiado", "O link da aplicação foi copiado para a sua área de transferência!");
        } catch (error) {
            console.error('Erro ao copiar o link:', error);
            addNotification("error", "Erro", "Não foi possível copiar o link. Por favor, copie manualmente: https://trgenius.netlify.app/");
        }
    }
  };

  const priorityFilteredDocs = useMemo(() => {
    const filterByPriority = (docs: SavedDocument[]) => {
      if (priorityFilter === 'all') {
        return docs;
      }
      return docs.filter(doc => doc.priority === priorityFilter);
    };
    return {
      etps: filterByPriority(savedETPs),
      trs: filterByPriority(savedTRs),
      riskMaps: filterByPriority(savedRiskMaps),
    };
  }, [savedETPs, savedTRs, savedRiskMaps, priorityFilter]);

  const searchedDocs = useMemo(() => {
    const filterBySearch = (docs: SavedDocument[]) => {
      if (!searchTerm) {
        return docs;
      }
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      return docs.filter(doc => doc.name.toLowerCase().includes(lowercasedSearchTerm));
    };
    return {
      etps: filterBySearch(priorityFilteredDocs.etps),
      trs: filterBySearch(priorityFilteredDocs.trs),
      riskMaps: filterBySearch(priorityFilteredDocs.riskMaps),
    };
  }, [priorityFilteredDocs, searchTerm]);

  const { displayedETPs, displayedTRs, displayedRiskMaps } = useMemo(() => {
    const sortDocs = (docs: SavedDocument[]) => {
      return [...docs].sort((a, b) => {
        if (sortOrder === 'name') {
          return a.name.localeCompare(b.name);
        }
        // Default sort by 'updatedAt' descending
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });
    };
    
    return {
      displayedETPs: sortDocs(searchedDocs.etps),
      displayedTRs: sortDocs(searchedDocs.trs),
      displayedRiskMaps: sortDocs(searchedDocs.riskMaps),
    };
  }, [searchedDocs, sortOrder]);
  
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
       <div className="flex flex-col md:flex-row h-screen">
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10 transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}
         
          <aside className={`fixed md:relative top-0 left-0 h-full w-full max-w-sm md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col transition-transform duration-300 z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
             <div className="flex items-center justify-between gap-3 mb-6 pt-10 md:pt-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Icon name="brain" className="text-pink-600 text-xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">TR Genius</h1>
                </div>
                <div className="flex items-center">
                  <button
                      onClick={handleShare}
                      className="w-9 h-9 flex items-center justify-center text-slate-400 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors"
                      title="Partilhar Aplicação"
                  >
                      <Icon name="share-nodes" />
                  </button>
                  <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="md:hidden w-9 h-9 flex items-center justify-center text-slate-400 rounded-full hover:bg-slate-100 hover:text-red-600 transition-colors"
                      title="Fechar Menu"
                  >
                      <Icon name="times" className="text-xl" />
                  </button>
                </div>
            </div>
            <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                Seu assistente para criar Estudos Técnicos e Termos de Referência, em conformidade com a <b>Lei 14.133/21</b>.
            </p>
            
            <div className="flex-1 overflow-y-auto -mr-6 pr-6 space-y-1">
                <div className="py-2">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Busca Rápida</h3>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filtrar por nome..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50"
                            aria-label="Filtrar documentos por nome"
                        />
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="py-2">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Filtro de Prioridade</h3>
                    <div className="flex items-center justify-between bg-slate-100 rounded-lg p-1 gap-1">
                        {priorityFilters.map(filter => (
                            <button
                                key={filter.key}
                                onClick={() => setPriorityFilter(filter.key)}
                                className={`px-2 py-1 text-xs font-semibold rounded-md transition-all w-full ${
                                    priorityFilter === filter.key ? filter.activeClasses : filter.inactiveClasses
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="py-2">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Ordenar por</h3>
                    <div className="flex items-center justify-between bg-slate-100 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setSortOrder('updatedAt')}
                            className={`px-2 py-1 text-xs font-semibold rounded-md transition-all w-full flex items-center justify-center gap-1 ${
                                sortOrder === 'updatedAt' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                            <Icon name="history" /> Data Modif.
                        </button>
                        <button
                            onClick={() => setSortOrder('name')}
                            className={`px-2 py-1 text-xs font-semibold rounded-md transition-all w-full flex items-center justify-center gap-1 ${
                                sortOrder === 'name' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                           <Icon name="sort-alpha-down" /> Nome (A-Z)
                        </button>
                    </div>
                </div>

                {/* Accordion Section: ETPs */}
                <div className="py-1">
                  <button onClick={() => toggleSidebarSection('etps')} className="w-full flex justify-between items-center text-left p-2 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="flex items-center">
                        <Icon name="file-alt" className="text-blue-500 w-5 text-center" />
                        <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider ml-2">ETPs Salvos</h3>
                    </div>
                    <Icon name={openSidebarSections.etps ? 'chevron-up' : 'chevron-down'} className="text-slate-400 transition-transform" />
                  </button>
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSidebarSections.etps ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-2">
                      {displayedETPs.length > 0 ? (
                        <ul className="space-y-2">
                          {displayedETPs.map(etp => (
                             <li key={etp.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                {editingDoc?.type === 'etp' && editingDoc?.id === etp.id ? (
                                    <div className="w-full flex items-center gap-2" onBlur={handleEditorBlur}>
                                        <div className="flex-grow">
                                            <input
                                                type="text"
                                                value={editingDoc.name}
                                                onChange={(e) => setEditingDoc({ ...editingDoc, name: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleUpdateDocumentDetails();
                                                    if (e.key === 'Escape') setEditingDoc(null);
                                                }}
                                                className="text-sm font-medium w-full bg-white border border-blue-500 rounded px-1 py-0.5"
                                                autoFocus
                                            />
                                            <select
                                                value={editingDoc.priority}
                                                onChange={(e) => setEditingDoc(prev => prev ? { ...prev, priority: e.target.value as Priority } : null)}
                                                className="w-full mt-1 p-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="high">{priorityLabels.high}</option>
                                                <option value="medium">{priorityLabels.medium}</option>
                                                <option value="low">{priorityLabels.low}</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={handleUpdateDocumentDetails} className="w-6 h-6 text-green-600 hover:text-green-800" title="Salvar"><Icon name="check" /></button>
                                            <button onClick={() => setEditingDoc(null)} className="w-6 h-6 text-red-600 hover:text-red-800" title="Cancelar"><Icon name="times" /></button>
                                        </div>
                                    </div>
                                ) : (
                                  <div className="flex items-center justify-between w-full gap-4">
                                      {/* Name and Priority */}
                                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                          <PriorityIndicator priority={etp.priority} />
                                          <div title={etp.status === 'reviewed' ? 'Revisado' : 'Rascunho'} className={`w-3 h-3 rounded-full flex-shrink-0 ${etp.status === 'reviewed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                          <span className="text-sm font-medium text-slate-700 truncate" title={etp.name}>{etp.name}</span>
                                      </div>
                                      {/* Date */}
                                      <div className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0" title={etp.updatedAt ? `Atualizado em: ${new Date(etp.updatedAt).toLocaleString('pt-BR')}` : ''}>
                                          {etp.updatedAt && (
                                            <span>
                                              {new Date(etp.updatedAt).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                            </span>
                                          )}
                                      </div>
                                      {/* Actions */}
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => handleToggleDocStatus('etp', etp.id)} className="w-6 h-6 text-slate-500 hover:text-teal-600" title={etp.status === 'reviewed' ? "Marcar como Rascunho" : "Marcar como Revisado"}><Icon name={etp.status === 'reviewed' ? "undo" : "check-double"} /></button>
                                        <button onClick={() => handleStartEditing('etp', etp)} className="w-6 h-6 text-slate-500 hover:text-yellow-600" title="Renomear"><Icon name="pencil-alt" /></button>
                                        <button onClick={() => handleLoadDocument('etp', etp.id)} className="w-6 h-6 text-slate-500 hover:text-blue-600" title="Carregar"><Icon name="upload" /></button>
                                        <button onClick={() => { setPreviewContext({ type: 'etp', id: etp.id }); setIsPreviewModalOpen(true); }} className="w-6 h-6 text-slate-500 hover:text-green-600" title="Pré-visualizar"><Icon name="eye" /></button>
                                        <button onClick={() => displayDocumentHistory(etp)} className="w-6 h-6 text-slate-500 hover:text-purple-600" title="Ver Histórico"><Icon name="history" /></button>
                                        <button onClick={() => handleDeleteDocument('etp', etp.id)} className="w-6 h-6 text-slate-500 hover:text-red-600" title="Apagar"><Icon name="trash" /></button>
                                      </div>
                                  </div>
                                )}
                              </li>
                          ))}
                        </ul>
                      ) : <p className="text-sm text-slate-400 italic px-2">Nenhum ETP corresponde ao filtro.</p>}
                    </div>
                  </div>
                </div>

                {/* Accordion Section: TRs */}
                <div className="py-1">
                  <button onClick={() => toggleSidebarSection('trs')} className="w-full flex justify-between items-center text-left p-2 rounded-lg hover:bg-purple-50 transition-colors">
                    <div className="flex items-center">
                        <Icon name="gavel" className="text-purple-500 w-5 text-center" />
                        <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider ml-2">TRs Salvos</h3>
                    </div>
                    <Icon name={openSidebarSections.trs ? 'chevron-up' : 'chevron-down'} className="text-slate-400 transition-transform" />
                  </button>
                   <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSidebarSections.trs ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-2">
                      {displayedTRs.length > 0 ? (
                        <ul className="space-y-2">
                          {displayedTRs.map(tr => (
                             <li key={tr.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                {editingDoc?.type === 'tr' && editingDoc?.id === tr.id ? (
                                    <div className="w-full flex items-center gap-2" onBlur={handleEditorBlur}>
                                        <div className="flex-grow">
                                            <input
                                                type="text"
                                                value={editingDoc.name}
                                                onChange={(e) => setEditingDoc({ ...editingDoc, name: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleUpdateDocumentDetails();
                                                    if (e.key === 'Escape') setEditingDoc(null);
                                                }}
                                                className="text-sm font-medium w-full bg-white border border-blue-500 rounded px-1 py-0.5"
                                                autoFocus
                                            />
                                            <select
                                                value={editingDoc.priority}
                                                onChange={(e) => setEditingDoc(prev => prev ? { ...prev, priority: e.target.value as Priority } : null)}
                                                className="w-full mt-1 p-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="high">{priorityLabels.high}</option>
                                                <option value="medium">{priorityLabels.medium}</option>
                                                <option value="low">{priorityLabels.low}</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={handleUpdateDocumentDetails} className="w-6 h-6 text-green-600 hover:text-green-800" title="Salvar"><Icon name="check" /></button>
                                            <button onClick={() => setEditingDoc(null)} className="w-6 h-6 text-red-600 hover:text-red-800" title="Cancelar"><Icon name="times" /></button>
                                        </div>
                                    </div>
                                ) : (
                                  <div className="flex items-center justify-between w-full gap-4">
                                      {/* Name and Priority */}
                                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                          <PriorityIndicator priority={tr.priority} />
                                          <div title={tr.status === 'reviewed' ? 'Revisado' : 'Rascunho'} className={`w-3 h-3 rounded-full flex-shrink-0 ${tr.status === 'reviewed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                          <span className="text-sm font-medium text-slate-700 truncate" title={tr.name}>{tr.name}</span>
                                      </div>
                                      {/* Date */}
                                      <div className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0" title={tr.updatedAt ? `Atualizado em: ${new Date(tr.updatedAt).toLocaleString('pt-BR')}` : ''}>
                                          {tr.updatedAt && (
                                            <span>
                                              {new Date(tr.updatedAt).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                            </span>
                                          )}
                                      </div>
                                      {/* Actions */}
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => handleToggleDocStatus('tr', tr.id)} className="w-6 h-6 text-slate-500 hover:text-teal-600" title={tr.status === 'reviewed' ? "Marcar como Rascunho" : "Marcar como Revisado"}><Icon name={tr.status === 'reviewed' ? "undo" : "check-double"} /></button>
                                        <button onClick={() => handleStartEditing('tr', tr)} className="w-6 h-6 text-slate-500 hover:text-yellow-600" title="Renomear"><Icon name="pencil-alt" /></button>
                                        <button onClick={() => handleLoadDocument('tr', tr.id)} className="w-6 h-6 text-slate-500 hover:text-blue-600" title="Carregar"><Icon name="upload" /></button>
                                        <button onClick={() => { setPreviewContext({ type: 'tr', id: tr.id }); setIsPreviewModalOpen(true); }} className="w-6 h-6 text-slate-500 hover:text-green-600" title="Pré-visualizar"><Icon name="eye" /></button>
                                        <button onClick={() => displayDocumentHistory(tr)} className="w-6 h-6 text-slate-500 hover:text-purple-600" title="Ver Histórico"><Icon name="history" /></button>
                                        <button onClick={() => handleDeleteDocument('tr', tr.id)} className="w-6 h-6 text-slate-500 hover:text-red-600" title="Apagar"><Icon name="trash" /></button>
                                      </div>
                                  </div>
                                )}
                              </li>
                          ))}
                        </ul>
                      ) : <p className="text-sm text-slate-400 italic px-2">Nenhum TR corresponde ao filtro.</p>}
                    </div>
                   </div>
                </div>

                 {/* Accordion Section: Risk Maps */}
                <div className="py-1">
                  <button onClick={() => toggleSidebarSection('riskMaps')} className="w-full flex justify-between items-center text-left p-2 rounded-lg hover:bg-orange-50 transition-colors">
                    <div className="flex items-center">
                        <Icon name="exclamation-triangle" className="text-orange-500 w-5 text-center" />
                        <h3 className="text-sm font-semibold text-orange-600 uppercase tracking-wider ml-2">Mapas de Risco</h3>
                    </div>
                    <Icon name={openSidebarSections.riskMaps ? 'chevron-up' : 'chevron-down'} className="text-slate-400 transition-transform" />
                  </button>
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSidebarSections.riskMaps ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-2">
                      {displayedRiskMaps.length > 0 ? (
                        <ul className="space-y-2">
                          {displayedRiskMaps.map(map => (
                             <li key={map.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                {editingDoc?.type === 'risk-map' && editingDoc?.id === map.id ? (
                                    <div className="w-full flex items-center gap-2" onBlur={handleEditorBlur}>
                                        <div className="flex-grow">
                                            <input
                                                type="text"
                                                value={editingDoc.name}
                                                onChange={(e) => setEditingDoc({ ...editingDoc, name: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleUpdateDocumentDetails();
                                                    if (e.key === 'Escape') setEditingDoc(null);
                                                }}
                                                className="text-sm font-medium w-full bg-white border border-blue-500 rounded px-1 py-0.5"
                                                autoFocus
                                            />
                                            <select
                                                value={editingDoc.priority}
                                                onChange={(e) => setEditingDoc(prev => prev ? { ...prev, priority: e.target.value as Priority } : null)}
                                                className="w-full mt-1 p-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="high">{priorityLabels.high}</option>
                                                <option value="medium">{priorityLabels.medium}</option>
                                                <option value="low">{priorityLabels.low}</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={handleUpdateDocumentDetails} className="w-6 h-6 text-green-600 hover:text-green-800" title="Salvar"><Icon name="check" /></button>
                                            <button onClick={() => setEditingDoc(null)} className="w-6 h-6 text-red-600 hover:text-red-800" title="Cancelar"><Icon name="times" /></button>
                                        </div>
                                    </div>
                                ) : (
                                  <div className="flex items-center justify-between w-full gap-4">
                                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                          <PriorityIndicator priority={map.priority} />
                                          <div title={map.status === 'reviewed' ? 'Revisado' : 'Rascunho'} className={`w-3 h-3 rounded-full flex-shrink-0 ${map.status === 'reviewed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                          <span className="text-sm font-medium text-slate-700 truncate" title={map.name}>{map.name}</span>
                                      </div>
                                      <div className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0" title={map.updatedAt ? `Atualizado em: ${new Date(map.updatedAt).toLocaleString('pt-BR')}` : ''}>
                                          {map.updatedAt && (
                                            <span>{new Date(map.updatedAt).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</span>
                                          )}
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => handleToggleDocStatus('risk-map', map.id)} className="w-6 h-6 text-slate-500 hover:text-teal-600" title={map.status === 'reviewed' ? "Marcar como Rascunho" : "Marcar como Revisado"}><Icon name={map.status === 'reviewed' ? "undo" : "check-double"} /></button>
                                        <button onClick={() => handleStartEditing('risk-map', map)} className="w-6 h-6 text-slate-500 hover:text-yellow-600" title="Renomear"><Icon name="pencil-alt" /></button>
                                        <button onClick={() => handleLoadDocument('risk-map', map.id)} className="w-6 h-6 text-slate-500 hover:text-blue-600" title="Carregar"><Icon name="upload" /></button>
                                        <button onClick={() => displayDocumentHistory(map)} className="w-6 h-6 text-slate-500 hover:text-purple-600" title="Ver Histórico"><Icon name="history" /></button>
                                        <button onClick={() => handleDeleteDocument('risk-map', map.id)} className="w-6 h-6 text-slate-500 hover:text-red-600" title="Apagar"><Icon name="trash" /></button>
                                      </div>
                                  </div>
                                )}
                              </li>
                          ))}
                        </ul>
                      ) : <p className="text-sm text-slate-400 italic px-2">Nenhum Mapa de Risco corresponde ao filtro.</p>}
                    </div>
                  </div>
                </div>
                
                {/* Accordion Section: Base de Conhecimento */}
                <div className="py-1 border-t mt-2 pt-3">
                    <button onClick={() => toggleSidebarSection('knowledgeBase')} className="w-full flex justify-between items-center text-left p-2 rounded-lg hover:bg-green-50 transition-colors">
                        <div className="flex items-center">
                            <Icon name="database" className="text-green-500 w-5 text-center" />
                            <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wider ml-2">Base de Conhecimento</h3>
                        </div>
                        <Icon name={openSidebarSections.knowledgeBase ? 'chevron-up' : 'chevron-down'} className="text-slate-400 transition-transform" />
                    </button>
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSidebarSections.knowledgeBase ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                        <div className="space-y-2">
                             {processingFiles.length > 0 && (
                                <div className="mb-3 p-2 bg-slate-100 rounded-lg">
                                    <h4 className="text-xs font-bold text-slate-600 mb-2">A processar ficheiros...</h4>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                                        <div 
                                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                                            style={{ width: `${(processingFiles.filter(f => f.status !== 'processing').length / processingFiles.length) * 100}%` }}
                                        ></div>
                                    </div>
                                    <ul className="space-y-1">
                                        {processingFiles.map(file => (
                                            <li key={file.name} className="flex items-center text-xs justify-between">
                                                <div className="flex items-center truncate">
                                                    {file.status === 'processing' && <Icon name="spinner" className="fa-spin text-slate-400 w-4" />}
                                                    {file.status === 'success' && <Icon name="check-circle" className="text-green-500 w-4" />}
                                                    {file.status === 'error' && <Icon name="exclamation-circle" className="text-red-500 w-4" />}
                                                    <span className="ml-2 truncate flex-1">{file.name}</span>
                                                </div>
                                                {file.status === 'error' && <span className="ml-2 text-red-600 font-semibold flex-shrink-0">{file.message}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                             )}

                            {uploadedFiles.length === 0 && processingFiles.length === 0 && (
                                <p className="text-sm text-slate-400 italic px-2">Nenhum ficheiro carregado.</p>
                            )}
                            
                            {uploadedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                    <label className={`flex items-center gap-2 text-sm font-medium text-slate-700 truncate ${file.isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                                        <input
                                            type="checkbox"
                                            checked={file.selected}
                                            onChange={() => handleToggleFileSelection(index)}
                                            className="form-checkbox h-4 w-4 text-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!!file.isLocked}
                                        />
                                        <span className="truncate">{file.name}</span>
                                    </label>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => handleToggleFileLock(index)} className="w-6 h-6 text-slate-500 hover:text-yellow-600" title={file.isLocked ? "Desbloquear Ficheiro" : "Bloquear Ficheiro"}>
                                            <Icon name={file.isLocked ? "lock" : "lock-open"} />
                                        </button>
                                        <button onClick={() => handlePreviewRagFile(file)} className="w-6 h-6 text-slate-500 hover:text-green-600" title="Pré-visualizar"><Icon name="eye" /></button>
                                        <button onClick={() => handleDeleteFile(index)} className="w-6 h-6 text-slate-500 hover:text-red-600" title="Apagar"><Icon name="trash" /></button>
                                    </div>
                                </div>
                            ))}
                            
                            <label className="mt-2 w-full flex items-center justify-center px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-200 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                                <Icon name="upload" className="mr-2" />
                                <span className="text-sm font-semibold">Carregar ficheiros</span>
                                <input type="file" className="hidden" multiple onChange={handleFileUpload} accept=".pdf,.docx,.txt,.json,.md" />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-200 flex items-center gap-2">
                <button
                    onClick={() => setIsInfoModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Informações"
                >
                    <Icon name="info-circle" />
                    Sobre
                </button>
                <button
                    onClick={handleLogout}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors"
                >
                    <Icon name="sign-out-alt" />
                    Sair
                </button>
            </div>
          </aside>
          
          <main className="flex-1 p-4 pb-24 sm:p-6 md:p-10 overflow-y-auto bg-slate-100" onClick={() => { if(window.innerWidth < 768) setIsSidebarOpen(false) }}>
             {/* Mobile-only Header */}
             <div className="md:hidden flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                    {viewTitles[activeView]}
                </h2>
                <div className="flex items-center gap-4">
                     <label htmlFor="thinking-mode-toggle-mobile" className="flex items-center cursor-pointer gap-2 text-sm font-medium text-slate-700" title="Ativar para usar o modelo mais poderoso para consultas complexas.">
                        <Icon name="brain" className="text-purple-500" />
                        <div className="relative">
                            <input id="thinking-mode-toggle-mobile" type="checkbox" className="sr-only peer" checked={useThinkingMode} onChange={() => setUseThinkingMode(!useThinkingMode)} />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </div>
                    </label>
                    <label htmlFor="web-search-toggle-mobile" className="flex items-center cursor-pointer gap-2 text-sm font-medium text-slate-700">
                        <Icon name="globe-americas" className="text-blue-500" />
                        <div className="relative">
                            <input id="web-search-toggle-mobile" type="checkbox" className="sr-only peer" checked={useWebSearch} onChange={() => setUseWebSearch(!useWebSearch)} />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                    </label>
                     {isOnline ? (
                        <div className="hidden sm:flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full px-2.5 py-1" title="A ligação à Internet está ativa.">
                            <Icon name="wifi" />
                            <span>Online</span>
                        </div>
                    ) : (
                        <div className="hidden sm:flex items-center gap-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full px-2.5 py-1" title="Sem ligação à Internet. As funcionalidades online estão desativadas.">
                            <Icon name="wifi-slash" />
                            <span>Offline</span>
                        </div>
                    )}
                </div>
             </div>
             <header className="hidden md:flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex-grow">
                  <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                      <button
                        onClick={() => switchView('etp')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors ${
                          activeView === 'etp'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        Gerador de ETP
                      </button>
                      <button
                        onClick={() => switchView('risk-map')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors ${
                          activeView === 'risk-map'
                            ? 'border-orange-600 text-orange-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        Mapa de Risco
                      </button>
                      <button
                        onClick={() => switchView('tr')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors ${
                          activeView === 'tr'
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        Gerador de TR
                      </button>
                    </nav>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-6">
                    <label htmlFor="thinking-mode-toggle" className="flex items-center cursor-pointer gap-3 text-base font-medium text-slate-700" title="Ativar para usar o modelo mais poderoso (gemini-2.5-pro) para consultas complexas. A geração pode ser mais lenta.">
                        <Icon name="brain" className="text-purple-500" />
                        <span>Modo Pensamento</span>
                        <div className="relative">
                            <input id="thinking-mode-toggle" type="checkbox" className="sr-only peer" checked={useThinkingMode} onChange={() => setUseThinkingMode(!useThinkingMode)} />
                            <div className="w-14 h-8 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                        </div>
                    </label>

                    <label htmlFor="web-search-toggle" className="flex items-center cursor-pointer gap-3 text-base font-medium text-slate-700" title="Ativar para incluir resultados da web em tempo real nas respostas da IA.">
                        <Icon name="globe-americas" className="text-blue-500" />
                        <span>Pesquisa Web</span>
                        <div className="relative">
                            <input id="web-search-toggle" type="checkbox" className="sr-only peer" checked={useWebSearch} onChange={() => setUseWebSearch(!useWebSearch)} />
                            <div className="w-14 h-8 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                    </label>
                    {isOnline ? (
                        <div className="flex items-center gap-2 bg-green-100 text-green-700 text-sm font-bold rounded-full px-3 py-1.5" title="A ligação à Internet está ativa.">
                            <Icon name="wifi" />
                            <span>Online</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-full px-3 py-1.5" title="Sem ligação à Internet. As funcionalidades online estão desativadas.">
                            <Icon name="wifi-slash" />
                            <span>Offline</span>
                        </div>
                    )}
                </div>
            </header>
            
            <div className={`${activeView === 'etp' ? 'block' : 'hidden'}`}>
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6 transition-all hover:shadow-md">
                   <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b pb-3 gap-4">
                     <h2 className="text-lg font-semibold text-slate-700">Dados do Estudo Técnico Preliminar</h2>
                     <PrioritySelector priority={currentEtpPriority} setPriority={setCurrentEtpPriority} />
                   </div>
                </div>
                {etpSections.map(section => {
                  if (section.isAttachmentSection) {
                    return (
                        <div key={section.id} className="bg-white p-6 rounded-xl shadow-sm mb-6 transition-all hover:shadow-md">
                            <div className="flex justify-between items-center mb-3">
                                 <div className="flex items-center gap-2">
                                    <label className="block text-lg font-semibold text-slate-700">{section.title}</label>
                                    {section.tooltip && <Icon name="question-circle" className="text-slate-400 cursor-help" title={section.tooltip} />}
                                 </div>
                            </div>
                            <textarea
                                id={section.id}
                                value={etpSectionsContent[section.id] || ''}
                                onChange={(e) => handleSectionChange('etp', section.id, e.target.value)}
                                placeholder={section.placeholder}
                                className="w-full h-24 p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:border-blue-500 transition-colors border-slate-200 focus:ring-blue-500 mb-4"
                            />
                            
                            <AttachmentManager
                                attachments={etpAttachments}
                                onAttachmentsChange={setEtpAttachments}
                                onPreview={setViewingAttachment}
                                addNotification={addNotification}
                            />
                        </div>
                    );
                  }
                  return (
                    <Section
                        key={section.id}
                        id={section.id}
                        title={section.title}
                        placeholder={section.placeholder}
                        value={etpSectionsContent[section.id]}
                        onChange={(id, value) => handleSectionChange('etp', id, value)}
                        onGenerate={() => handleGenerate('etp', section.id, section.title)}
                        hasGen={section.hasGen}
                        onAnalyze={() => handleRiskAnalysis('etp', section.id, section.title)}
                        hasRiskAnalysis={section.hasRiskAnalysis}
                        onEdit={() => handleOpenEditModal('etp', section.id, section.title)}
                        isLoading={loadingSection === section.id}
                        hasError={validationErrors.has(section.id)}
                        tooltip={section.tooltip}
                        isAiGenerated={aiGeneratedFields.has(section.id)}
                    />
                  );
                })}
                <div className="mt-6 bg-white p-4 border-t border-slate-200 md:bg-transparent md:p-0 md:border-none">
                    <div className="grid grid-cols-2 md:flex md:justify-end md:items-center gap-4">
                        <button
                            onClick={handleClearForm('etp')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <Icon name="times-circle" />
                            Limpar
                        </button>
                        <button
                            onClick={() => handleSaveDocument('etp')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Icon name="save" />
                            Guardar ETP
                        </button>
                    </div>
                </div>
            </div>

            <div className={`${activeView === 'tr' ? 'block' : 'hidden'}`}>
                 <div className="bg-white p-6 rounded-xl shadow-sm mb-6 transition-all hover:shadow-md">
                   <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b pb-4 gap-4">
                     <h2 className="text-lg font-semibold text-slate-700">Dados do Termo de Referência</h2>
                     <PrioritySelector priority={currentTrPriority} setPriority={setCurrentTrPriority} />
                   </div>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                            <label htmlFor="etp-selector" className="block text-sm font-medium text-slate-600 mb-1">
                                <Icon name="link" className="mr-1" />
                                Carregar ETP para Contexto
                            </label>
                            <select
                                id="etp-selector"
                                onChange={(e) => handleLoadEtpForTr(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50"
                            >
                                <option value="">Nenhum ETP selecionado</option>
                                {savedETPs.map(etp => <option key={etp.id} value={etp.id}>{etp.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="risk-map-selector" className="block text-sm font-medium text-slate-600 mb-1">
                                <Icon name="shield-alt" className="mr-1" />
                                Carregar Mapa de Risco para Contexto
                            </label>
                             <select
                                id="risk-map-selector"
                                onChange={(e) => handleLoadRiskMapForTr(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50"
                            >
                                <option value="">Nenhum Mapa de Risco selecionado</option>
                                {savedRiskMaps.map(map => <option key={map.id} value={map.id}>{map.name}</option>)}
                            </select>
                        </div>
                   </div>
                   {loadedEtpForTr && (
                       <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                          <div className="flex justify-between items-start">
                             <div>
                               <p className="font-semibold text-blue-800">
                                <Icon name="check-circle" className="mr-2 text-blue-600" />
                                Contexto do ETP carregado: <b>{loadedEtpForTr.name}</b>
                               </p>
                               <p className="text-blue-700 mt-1 pl-6">
                                A IA utilizará este documento como base principal para gerar o conteúdo do TR.
                               </p>
                             </div>
                              <button onClick={handleImportEtpAttachments} className="flex-shrink-0 ml-4 flex items-center gap-1.5 text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-300 transition-colors">
                                <Icon name="paperclip"/>
                                Importar Anexos
                              </button>
                           </div>
                       </div>
                   )}
                   {loadedRiskMapForTr && (
                       <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                           <p className="font-semibold text-orange-800">
                            <Icon name="check-circle" className="mr-2 text-orange-600" />
                            Contexto do Mapa de Riscos carregado: <b>{loadedRiskMapForTr.name}</b>
                           </p>
                           <p className="text-orange-700 mt-1 pl-6">
                            A IA utilizará os riscos mapeados para sugerir cláusulas e obrigações mais robustas no TR.
                           </p>
                       </div>
                   )}
                   {isConvertingEtpToTr && (
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm flex items-center gap-3">
                           <Icon name="spinner" className="fa-spin text-purple-600 text-lg" />
                           <div className="flex-1">
                                <p className="font-semibold text-purple-800">A converter o ETP para TR...</p>
                                <p className="text-purple-700">A IA está a analisar o documento e a preencher as seções. Por favor, aguarde.</p>
                           </div>
                       </div>
                   )}
                </div>
                
                {trSections.map(section => {
                    if (section.isAttachmentSection) {
                      // This block is currently not used for TR, but kept for future-proofing
                       return (
                        <div key={section.id} className="bg-white p-6 rounded-xl shadow-sm mb-6 transition-all hover:shadow-md">
                            <h2 className="text-lg font-semibold text-slate-700 mb-3">{section.title}</h2>
                            <AttachmentManager
                                attachments={trAttachments}
                                onAttachmentsChange={setTrAttachments}
                                onPreview={setViewingAttachment}
                                addNotification={addNotification}
                            />
                        </div>
                       );
                    }
                    return (
                        <Section
                            key={section.id}
                            id={section.id}
                            title={section.title}
                            placeholder={section.placeholder}
                            value={trSectionsContent[section.id]}
                            onChange={(id, value) => handleSectionChange('tr', id, value)}
                            onGenerate={() => handleGenerate('tr', section.id, section.title)}
                            hasGen={section.hasGen}
                            onAnalyze={() => handleRiskAnalysis('tr', section.id, section.title)}
                            hasRiskAnalysis={section.hasRiskAnalysis}
                            onEdit={() => handleOpenEditModal('tr', section.id, section.title)}
                            isLoading={loadingSection === section.id}
                            hasError={validationErrors.has(section.id)}
                            tooltip={section.tooltip}
                            isAiGenerated={aiGeneratedFields.has(section.id)}
                        />
                    );
                })}
                <div className="mt-6 bg-white p-4 border-t border-slate-200 md:bg-transparent md:p-0 md:border-none">
                    <div className="grid grid-cols-2 md:grid-cols-4 md:flex md:justify-end md:items-center gap-4">
                        <button
                          onClick={handleGenerateTrFromEtp}
                          disabled={!loadedEtpForTr || isConvertingEtpToTr}
                          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!loadedEtpForTr ? "Carregue um ETP para ativar esta função" : "Gerar TR a partir do ETP"}
                        >
                            <Icon name="wand-magic-sparkles" />
                            Gerar TR com IA
                        </button>
                        <button
                          onClick={handleComplianceCheck}
                          disabled={isCheckingCompliance}
                          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Verificar conformidade do TR com a Lei 14.133/21"
                        >
                            <Icon name="balance-scale" />
                            Verificar Conformidade
                        </button>
                        <button
                            onClick={handleClearForm('tr')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <Icon name="times-circle" />
                            Limpar
                        </button>
                        <button
                            onClick={() => handleSaveDocument('tr')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Icon name="save" />
                            Guardar TR
                        </button>
                    </div>
                </div>
            </div>

            <div className={`${activeView === 'risk-map' ? 'block' : 'hidden'}`}>
                {/* Intro Section */}
                <Section
                    id={riskMapSections[0].id}
                    title={riskMapSections[0].title}
                    placeholder={riskMapSections[0].placeholder}
                    value={riskMapSectionsContent[riskMapSections[0].id]}
                    onChange={(id, value) => handleSectionChange('risk-map', id, value)}
                    onGenerate={() => handleGenerate('risk-map', riskMapSections[0].id, riskMapSections[0].title)}
                    hasGen={riskMapSections[0].hasGen}
                    tooltip={riskMapSections[0].tooltip}
                    isAiGenerated={aiGeneratedFields.has(riskMapSections[0].id)}
                />

                {/* --- Dynamic Tables UI for Risk Map --- */}
                
                {/* 2. Histórico de Revisões */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">2. Histórico de Revisões</h3>
                    <div className="space-y-4">
                        {revisionHistory.map((row, index) => (
                            <div key={row.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 border rounded-lg bg-slate-50 relative">
                               <button onClick={() => removeRevisionHistoryRow(row.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors">&times;</button>
                               <input type="text" value={row.date} onChange={(e) => handleRevisionHistoryChange(row.id, 'date', e.target.value)} placeholder="Data (DD/MM/AAAA)" className="md:col-span-1 p-2 border rounded" />
                               <input type="text" value={row.version} onChange={(e) => handleRevisionHistoryChange(row.id, 'version', e.target.value)} placeholder="Versão" className="md:col-span-1 p-2 border rounded" />
                               <input type="text" value={row.phase} onChange={(e) => handleRevisionHistoryChange(row.id, 'phase', e.target.value)} placeholder="Fase" className="md:col-span-1 p-2 border rounded" />
                               <input type="text" value={row.author} onChange={(e) => handleRevisionHistoryChange(row.id, 'author', e.target.value)} placeholder="Autor" className="md:col-span-1 p-2 border rounded" />
                               <input type="text" value={row.description} onChange={(e) => handleRevisionHistoryChange(row.id, 'description', e.target.value)} placeholder="Descrição da Alteração" className="md:col-span-2 p-2 border rounded" />
                            </div>
                        ))}
                    </div>
                    <button onClick={addRevisionHistoryRow} className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800">+ Adicionar Linha</button>
                </div>

                {/* 3. Identificação e Análise dos Principais Riscos */}
                 <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">3. Identificação e Análise dos Principais Riscos</h3>
                    <div className="space-y-4">
                       {riskIdentification.map((row) => (
                           <div key={row.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 border rounded-lg bg-slate-50 relative">
                                <button onClick={() => removeRiskIdentificationRow(row.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors">&times;</button>
                                <input type="text" value={row.riskId} onChange={(e) => handleRiskIdentificationChange(row.id, 'riskId', e.target.value)} placeholder="ID do Risco" className="md:col-span-1 p-2 border rounded" />
                                <input type="text" value={row.risk} onChange={(e) => handleRiskIdentificationChange(row.id, 'risk', e.target.value)} placeholder="Descrição do Risco" className="md:col-span-2 p-2 border rounded" />
                                <input type="text" value={row.relatedTo} onChange={(e) => handleRiskIdentificationChange(row.id, 'relatedTo', e.target.value)} placeholder="Relacionado a" className="md:col-span-1 p-2 border rounded" />
                                <input type="number" value={row.probability} onChange={(e) => handleRiskIdentificationChange(row.id, 'probability', e.target.value)} placeholder="Prob. (1-5)" className="md:col-span-1 p-2 border rounded" min="1" max="5" />
                                <input type="number" value={row.impact} onChange={(e) => handleRiskIdentificationChange(row.id, 'impact', e.target.value)} placeholder="Impacto (1-5)" className="md:col-span-1 p-2 border rounded" min="1" max="5"/>
                           </div>
                       ))}
                    </div>
                    <button onClick={addRiskIdentificationRow} className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800">+ Adicionar Risco</button>
                </div>

                {/* 4. Avaliação e Tratamento dos Riscos Identificados */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">4. Avaliação e Tratamento dos Riscos Identificados</h3>
                    <div className="space-y-6">
                        {riskEvaluation.map((block) => (
                            <div key={block.id} className="p-4 border rounded-lg bg-slate-50 relative">
                                <button onClick={() => removeRiskEvaluationBlock(block.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors">&times;</button>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                    <input type="text" value={block.riskId} onChange={(e) => handleRiskEvaluationChange(block.id, 'riskId', e.target.value)} placeholder="ID do Risco" className="p-2 border rounded" />
                                    <input type="text" value={block.probability} onChange={(e) => handleRiskEvaluationChange(block.id, 'probability', e.target.value)} placeholder="Probabilidade" className="p-2 border rounded" />
                                    <input type="text" value={block.impact} onChange={(e) => handleRiskEvaluationChange(block.id, 'impact', e.target.value)} placeholder="Impacto" className="p-2 border rounded" />
                                    <input type="text" value={block.treatment} onChange={(e) => handleRiskEvaluationChange(block.id, 'treatment', e.target.value)} placeholder="Tratamento" className="p-2 border rounded" />
                                </div>
                                <textarea value={block.riskDescription} onChange={(e) => handleRiskEvaluationChange(block.id, 'riskDescription', e.target.value)} placeholder="Descrição do Risco" className="w-full p-2 border rounded mb-2" rows={2}/>
                                <textarea value={block.damage} onChange={(e) => handleRiskEvaluationChange(block.id, 'damage', e.target.value)} placeholder="Dano" className="w-full p-2 border rounded mb-4" rows={2}/>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Ações Preventivas</h4>
                                        {block.preventiveActions.map(action => (
                                            <div key={action.id} className="flex gap-2 mb-2 items-center">
                                                <input value={action.actionId} onChange={(e) => handleRiskActionChange(block.id, 'preventive', action.id, 'actionId', e.target.value)} placeholder="ID Ação" className="p-1 border rounded w-1/4"/>
                                                <input value={action.action} onChange={(e) => handleRiskActionChange(block.id, 'preventive', action.id, 'action', e.target.value)} placeholder="Ação" className="p-1 border rounded w-1/2"/>
                                                <input value={action.responsible} onChange={(e) => handleRiskActionChange(block.id, 'preventive', action.id, 'responsible', e.target.value)} placeholder="Responsável" className="p-1 border rounded w-1/4"/>
                                                <button onClick={() => removeRiskAction(block.id, 'preventive', action.id)} className="text-red-500 hover:text-red-700">&times;</button>
                                            </div>
                                        ))}
                                        <button onClick={() => addRiskAction(block.id, 'preventive')} className="text-xs font-semibold text-blue-600 hover:text-blue-800">+ Adicionar Ação</button>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Ações de Contingência</h4>
                                        {block.contingencyActions.map(action => (
                                            <div key={action.id} className="flex gap-2 mb-2 items-center">
                                                <input value={action.actionId} onChange={(e) => handleRiskActionChange(block.id, 'contingency', action.id, 'actionId', e.target.value)} placeholder="ID Ação" className="p-1 border rounded w-1/4"/>
                                                <input value={action.action} onChange={(e) => handleRiskActionChange(block.id, 'contingency', action.id, 'action', e.target.value)} placeholder="Ação" className="p-1 border rounded w-1/2"/>
                                                <input value={action.responsible} onChange={(e) => handleRiskActionChange(block.id, 'contingency', action.id, 'responsible', e.target.value)} placeholder="Responsável" className="p-1 border rounded w-1/4"/>
                                                <button onClick={() => removeRiskAction(block.id, 'contingency', action.id)} className="text-red-500 hover:text-red-700">&times;</button>
                                            </div>
                                        ))}
                                        <button onClick={() => addRiskAction(block.id, 'contingency')} className="text-xs font-semibold text-blue-600 hover:text-blue-800">+ Adicionar Ação</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={addRiskEvaluationBlock} className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800">+ Adicionar Bloco de Avaliação</button>
                </div>

                 {/* 5. Acompanhamento das Ações de Tratamento de Riscos */}
                 <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">5. Acompanhamento das Ações de Tratamento de Riscos</h3>
                    <div className="space-y-4">
                        {riskMonitoring.map(row => (
                            <div key={row.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg bg-slate-50 relative">
                                <button onClick={() => removeRiskMonitoringRow(row.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors">&times;</button>
                                <input type="text" value={row.date} onChange={(e) => handleRiskMonitoringChange(row.id, 'date', e.target.value)} placeholder="Data" className="p-2 border rounded" />
                                <input type="text" value={row.riskId} onChange={(e) => handleRiskMonitoringChange(row.id, 'riskId', e.target.value)} placeholder="ID Risco" className="p-2 border rounded" />
                                <input type="text" value={row.actionId} onChange={(e) => handleRiskMonitoringChange(row.id, 'actionId', e.target.value)} placeholder="ID Ação" className="p-2 border rounded" />
                                <input type="text" value={row.record} onChange={(e) => handleRiskMonitoringChange(row.id, 'record', e.target.value)} placeholder="Registro do Acompanhamento" className="p-2 border rounded" />
                            </div>
                        ))}
                    </div>
                    <button onClick={addRiskMonitoringRow} className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800">+ Adicionar Registro</button>
                </div>
                
                 <div className="mt-6 bg-white p-4 border-t border-slate-200 md:bg-transparent md:p-0 md:border-none">
                    <div className="grid grid-cols-2 md:grid-cols-3 md:flex md:justify-end md:items-center gap-4">
                        <button
                            onClick={handleExportRiskMapToPDF}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                        >
                            <Icon name="file-pdf" />
                            Exportar PDF
                        </button>
                        <button
                            onClick={handleClearForm('risk-map')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <Icon name="times-circle" />
                            Limpar
                        </button>
                        <button
                            onClick={() => handleSaveDocument('risk-map')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Icon name="save" />
                            Guardar Mapa
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Action Button for mobile */}
            <div className="md:hidden fixed bottom-24 right-6 z-40">
                <button
                    onClick={() => setIsNewDocModalOpen(true)}
                    className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-blue-700 transition-all transform hover:scale-110"
                    aria-label="Criar novo documento"
                >
                  <Icon name="plus" />
                </button>
            </div>
            
            <div className="hidden md:block fixed top-6 right-6 z-40">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 italic mr-2">{autoSaveStatus}</span>
                    <button
                        onClick={() => setIsNewDocModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Icon name="plus" />
                        Novo Documento
                    </button>
                </div>
            </div>
          </main>
       </div>
       
       {isInstallBannerVisible && installPrompt && (
          <InstallPWA onInstall={handleInstallClick} onDismiss={handleDismissInstallBanner} />
       )}
       
       {/* Modals */}
       <Modal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title="Sobre o TR Genius">
           <div>
               <p className="text-slate-600 mb-4">O <b>TR Genius</b> é um assistente de IA projetado para otimizar a criação de Estudos Técnicos Preliminares (ETP) e Termos de Referência (TR), em total conformidade com a nova Lei de Licitações e Contratos (Lei nº 14.133/21).</p>
               <h3 className="font-bold text-lg mb-2">Funcionalidades Principais</h3>
               <ul className="list-disc list-inside space-y-2 text-slate-600">
                   <li><b>Geração de Conteúdo com IA:</b> Utilize a IA da Google (Gemini) para gerar textos técnicos e bem fundamentados para cada seção dos seus documentos.</li>
                   <li><b>Análise de Risco:</b> A IA analisa o conteúdo gerado para identificar e sugerir mitigações para potenciais riscos na sua contratação.</li>
                   <li><b>Base de Conhecimento (RAG):</b> Faça o upload de documentos de apoio (leis, editais, etc.) para que a IA os utilize como contexto para respostas mais precisas.</li>
                   <li><b>Verificação de Conformidade:</b> A IA audita o seu Termo de Referência, comparando-o com os requisitos da Lei 14.133/21 e fornecendo um relatório detalhado.</li>
                   <li><b>Exportação para PDF:</b> Exporte seus documentos finalizados em formato PDF com aparência profissional.</li>
               </ul>
               <p className="text-xs text-slate-400 mt-6 text-center">Versão 1.0.0 | Desenvolvido com React, TypeScript e Tailwind CSS.</p>
           </div>
       </Modal>
       
       <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => { setIsPreviewModalOpen(false); setSummaryState({ loading: false, content: null }); setViewingAttachment(null); }}
          title="Pré-visualização do Documento"
          maxWidth="max-w-4xl"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={handleExportToPDF}
                className="flex items-center gap-2 bg-green-100 text-green-700 font-bold py-2 px-4 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Icon name="file-pdf" />
                Exportar para PDF
              </button>
              <button onClick={() => { setIsPreviewModalOpen(false); setSummaryState({ loading: false, content: null }); setViewingAttachment(null); }} className="py-2 px-4 font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                Fechar
              </button>
            </div>
          }
       >
          {renderPreviewContent()}
       </Modal>

        <Modal isOpen={!!analysisContent.content} onClose={() => setAnalysisContent({ title: '', content: null })} title={analysisContent.title} maxWidth="max-w-3xl">
          <ContentRenderer text={analysisContent.content} />
        </Modal>

        <Modal isOpen={isComplianceModalOpen} onClose={() => setIsComplianceModalOpen(false)} title="Análise de Conformidade do TR" maxWidth="max-w-4xl">
            {isCheckingCompliance ? (
                <div className="flex items-center justify-center p-8">
                    <Icon name="spinner" className="fa-spin text-3xl text-blue-600 mr-4" />
                    <span className="text-lg text-slate-700">A analisar...</span>
                </div>
            ) : (
                <ContentRenderer text={complianceCheckResult} />
            )}
        </Modal>
        
        {editingContent && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            title={`Editar e Refinar: ${editingContent.title}`}
            maxWidth="max-w-4xl"
            footer={
              <div className="flex justify-end items-center gap-3">
                <button onClick={closeEditModal} className="px-4 py-2 font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveChanges} className="px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  Guardar Alterações
                </button>
              </div>
            }
          >
            <div className="space-y-4">
              <textarea
                value={editingContent.text}
                onChange={(e) => setEditingContent({ ...editingContent, text: e.target.value })}
                className="w-full h-80 p-3 border rounded-lg focus:ring-2 focus:border-blue-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder="Peça à IA para refinar o texto (ex: 'torne mais formal', 'resuma em 3 tópicos', 'expanda sobre a segurança')"
                  className="flex-grow p-2 border rounded-lg focus:ring-2 focus:border-purple-500"
                />
                <button
                  onClick={handleRefineText}
                  disabled={isRefining || !refinePrompt}
                  className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="wand-magic-sparkles" />
                  {isRefining ? 'A refinar...' : 'Refinar'}
                </button>
              </div>
            </div>
          </Modal>
        )}
        
        <Modal
          isOpen={isNewDocModalOpen}
          onClose={() => setIsNewDocModalOpen(false)}
          title="Criar Novo Documento"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
              <div>
                  <h3 className="font-bold text-lg mb-3 text-slate-800">Iniciar a partir de um formulário em branco:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button onClick={() => handleCreateNewDocument('etp')} className="p-4 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 transition-colors">
                          <Icon name="file-alt" className="text-2xl text-blue-500 mb-2"/>
                          <h4 className="font-bold">Novo ETP</h4>
                          <p className="text-sm text-slate-600">Comece um Estudo Técnico Preliminar do zero.</p>
                      </button>
                      <button onClick={() => handleCreateNewDocument('risk-map')} className="p-4 border rounded-lg text-left hover:bg-orange-50 hover:border-orange-300 transition-colors">
                          <Icon name="shield-alt" className="text-2xl text-orange-500 mb-2"/>
                          <h4 className="font-bold">Novo Mapa de Risco</h4>
                          <p className="text-sm text-slate-600">Inicie um Mapa de Riscos para uma contratação.</p>
                      </button>
                      <button onClick={() => handleCreateNewDocument('tr')} className="p-4 border rounded-lg text-left hover:bg-purple-50 hover:border-purple-300 transition-colors">
                          <Icon name="gavel" className="text-2xl text-purple-500 mb-2"/>
                          <h4 className="font-bold">Novo TR</h4>
                          <p className="text-sm text-slate-600">Comece um Termo de Referência em branco.</p>
                      </button>
                  </div>
              </div>

               <div>
                  <h3 className="font-bold text-lg mb-3 text-slate-800">Ou use um template para começar mais rápido:</h3>
                  <h4 className="font-semibold text-blue-700 mb-2">Templates de ETP</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {etpTemplates.map((template, index) => (
                          <button key={template.id} onClick={() => handleCreateFromTemplate(template)} className={`p-4 border rounded-lg text-left transition-colors ${etpTemplateColors[index % etpTemplateColors.length]}`}>
                              <h4 className="font-bold">{template.name}</h4>
                              <p className="text-sm opacity-80">{template.description}</p>
                          </button>
                      ))}
                  </div>
                  <h4 className="font-semibold text-purple-700 mb-2 mt-4">Templates de TR</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {trTemplates.map((template, index) => (
                          <button key={template.id} onClick={() => handleCreateFromTemplate(template)} className={`p-4 border rounded-lg text-left transition-colors ${trTemplateColors[index % trTemplateColors.length]}`}>
                              <h4 className="font-bold">{template.name}</h4>
                              <p className="text-sm opacity-80">{template.description}</p>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
        </Modal>

        {historyModalContent && (
            <Modal
                isOpen={!!historyModalContent}
                onClose={() => setHistoryModalContent(null)}
                title={`Histórico de Versões: ${historyModalContent.name}`}
                maxWidth="max-w-6xl"
            >
                <HistoryViewer document={historyModalContent} allSections={
                    historyModalContent.type === 'etp' ? etpSections :
                    historyModalContent.type === 'tr' ? trSections :
                    riskMapSections
                } />
            </Modal>
        )}
        
        <Modal
          isOpen={isRagPreviewModalOpen}
          onClose={() => {
            setIsRagPreviewModalOpen(false);
            setViewingAttachment(null);
          }}
          title="Pré-visualização de Ficheiro RAG"
          maxWidth="max-w-4xl"
          footer={
             <button
                onClick={() => {
                  setIsRagPreviewModalOpen(false);
                  setViewingAttachment(null);
                }}
                className="py-2 px-4 font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Fechar
              </button>
          }
        >
          {viewingAttachment && (
            <div className="w-full h-[70vh] bg-slate-100 rounded-lg border flex items-center justify-center">
                {isLoadingPreview ? (
                    <div className="flex flex-col items-center gap-2 text-slate-600">
                        <Icon name="spinner" className="fa-spin text-3xl" />
                        <span>A carregar pré-visualização...</span>
                    </div>
                ) : previewContent ? (
                    <div className="w-full h-full bg-white overflow-auto rounded-lg">
                        {previewContent.type === 'text' ? (
                            <pre className="text-sm whitespace-pre-wrap font-mono bg-slate-50 p-6 h-full">{previewContent.content}</pre>
                        ) : (
                            <div className="p-2 sm:p-8 bg-slate-100 min-h-full">
                                <div className="prose max-w-4xl mx-auto p-8 bg-white shadow-lg" dangerouslySetInnerHTML={{ __html: previewContent.content }} />
                            </div>
                        )}
                    </div>
                ) : viewingAttachment.type.startsWith('image/') ? (
                    <img src={getAttachmentDataUrl(viewingAttachment)} alt={viewingAttachment.name} className="max-w-full max-h-full object-contain" />
                ) : viewingAttachment.type === 'application/pdf' ? (
                    <object data={getAttachmentDataUrl(viewingAttachment)} type="application/pdf" width="100%" height="100%">
                        <p className="p-4 text-center text-slate-600">O seu navegador não suporta a pré-visualização de PDFs. <a href={getAttachmentDataUrl(viewingAttachment)} download={viewingAttachment.name} className="text-blue-600 hover:underline">Clique aqui para fazer o download.</a></p>
                    </object>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <Icon name="file-download" className="text-5xl text-slate-400 mb-4" />
                        <p className="text-slate-700 text-lg mb-2">A pré-visualização não está disponível para este tipo de ficheiro.</p>
                        <p className="text-slate-500 mb-6 text-sm">({viewingAttachment.type})</p>
                        <a 
                            href={getAttachmentDataUrl(viewingAttachment)} 
                            download={viewingAttachment.name}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Icon name="download" />
                            Fazer Download
                        </a>
                    </div>
                )}
            </div>
          )}
        </Modal>

        {generatedContentModal && (
          <Modal
            isOpen={!!generatedContentModal}
            onClose={() => setGeneratedContentModal(null)}
            title={`Conteúdo Gerado por IA para: ${generatedContentModal.title}`}
            maxWidth="max-w-3xl"
            footer={
              <div className="flex justify-end gap-3">
                 <button onClick={() => handleOpenEditModal(generatedContentModal.docType, generatedContentModal.sectionId, generatedContentModal.title)} className="px-4 py-2 font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                    Editar
                 </button>
                 <button onClick={handleAcceptGeneratedContent} className="px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                   Aceitar e Inserir
                 </button>
              </div>
            }
          >
            <ContentRenderer text={generatedContentModal.content} />
          </Modal>
        )}
        
        {/* Notification Container */}
        <div className="fixed top-6 right-6 z-[100] w-full max-w-sm space-y-4">
            {notifications.map(n => (
                <Notification key={n.id} notification={n} onClose={removeNotification} />
            ))}
        </div>

        <BottomNavBar activeView={activeView} switchView={switchView} openSidebar={() => setIsSidebarOpen(true)} />
    </div>
  );
};

export default App;