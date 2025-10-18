

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Section as SectionType, SavedDocument, UploadedFile, DocumentType, PreviewContext, Attachment, DocumentVersion, Priority, Template, Notification as NotificationType, SavedRiskMap, RiskRevision, RiskItem, RiskAction, RiskFollowUp } from './types';
import * as storage from './services/storageService';
import { callGemini } from './services/geminiService';
import { processSingleUploadedFile, chunkText } from './services/ragService';
import { exportDocumentToPDF } from './services/exportService';
import { Icon } from './components/Icon';
import Login from './components/Login';
import { AttachmentManager } from './components/AttachmentManager';
import InstallPWA from './components/InstallPWA';
import { HistoryViewer } from './components/HistoryViewer';
import { etpSections, trSections } from './config/sections';
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

    const parseInline = (line: string): React.ReactNode[] => {
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
                nodes.push(<a href={markdownUrl} key={lastIndex} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">{markdownText}</a>);
            } else if (standaloneUrl) {
                nodes.push(<a href={standaloneUrl} key={lastIndex} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">{standaloneUrl}</a>);
            } else if (boldBlock) {
                nodes.push(<strong key={lastIndex} className="font-semibold text-slate-800">{boldText}</strong>);
            }
            
            lastIndex = regex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < line.length) {
            nodes.push(line.substring(lastIndex));
        }

        return nodes;
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
}

const Section: React.FC<SectionProps> = ({ id, title, placeholder, value, onChange, onGenerate, hasGen, onAnalyze, hasRiskAnalysis, onEdit, isLoading, hasError, tooltip }) => {
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
        <div className="w-full sm:w-auto flex items-stretch gap-2 flex-wrap">
           {value && String(value || '').trim().length > 0 && (
             <button
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center text-center px-3 py-2 text-xs font-semibold rounded-lg transition-colors min-w-[calc(50%-0.25rem)] sm:min-w-0 ${isCopied ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              title={isCopied ? 'Copiado para a área de transferência!' : 'Copiar Conteúdo'}
            >
              <Icon name={isCopied ? 'check' : 'copy'} className="mr-2" /> 
              <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
            </button>
           )}
           {value && String(value || '').trim().length > 0 && onEdit && (
             <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center text-center px-3 py-2 text-xs font-semibold text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors min-w-[calc(50%-0.25rem)] sm:min-w-0"
              title="Editar e Refinar"
            >
              <Icon name="pencil-alt" className="mr-2" />
              <span>Editar/Refinar</span>
            </button>
          )}
          {hasRiskAnalysis && onAnalyze && (
            <button
              onClick={onAnalyze}
              className="flex-1 flex items-center justify-center text-center px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors min-w-[calc(50%-0.25rem)] sm:min-w-0"
              title="Análise de Riscos"
            >
              <Icon name="shield-alt" className="mr-2" />
              <span>Análise Risco</span>
            </button>
          )}
          {hasGen && (
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center text-center px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[calc(50%-0.25rem)] sm:min-w-0"
            >
              <Icon name={isLoading ? 'spinner' : 'wand-magic-sparkles'} className={`mr-2 ${isLoading ? 'fa-spin' : ''}`} />
              <span>{isLoading ? 'A gerar...' : 'Gerar com IA'}</span>
            </button>
          )}
        </div>
      </div>
      <textarea
        id={id}
        value={value || ''}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder={isLoading ? 'A IA está a gerar o conteúdo...' : placeholder}
        className={`w-full h-40 p-3 bg-slate-50 border rounded-lg focus:ring-2 transition-colors ${hasError ? 'border-red-500 ring-red-200' : 'border-slate-200 focus:ring-blue-500'} ${isLoading ? 'loading-animation' : ''}`}
        disabled={isLoading}
      />
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


const exampleRisks = [
  { id: 'R01', risk: 'Alteração do escopo dos serviços a serem contratados.', relatedTo: 'Planejamento da Contratação', p: 5, i: 10 },
  { id: 'R02', risk: 'Não elaboração do Roteiro Próprio de Métricas de Software.', relatedTo: 'Planejamento da Contratação', p: 10, i: 10 },
  { id: 'R03', risk: 'Falta de clareza pelo requisitante quanto às demandas a serem desenvolvidas e manutenidas.', relatedTo: 'Planejamento da Contratação', p: 10, i: 15 },
  { id: 'R04', risk: 'Atraso no processo administrativo de contratação.', relatedTo: 'Planejamento da Contratação', p: 10, i: 10 },
  { id: 'R05', risk: 'Não publicação do Processo de Desenvolvimento de Software.', relatedTo: 'Planejamento da Contratação', p: 5, i: 10 },
  { id: 'R06', risk: 'Não elaboração dos templates dos documentos do Processo de Desenvolvimento de Software.', relatedTo: 'Planejamento da Contratação', p: 10, i: 5 },
  { id: 'R07', risk: 'Ausência de recursos orçamentários ou financeiros.', relatedTo: 'Planejamento da Contratação', p: 10, i: 15 },
  { id: 'R08', risk: 'Atraso ou suspensão no processo licitatório em face de impugnações.', relatedTo: 'Seleção do Fornecedor', p: 15, i: 10 },
  { id: 'R09', risk: 'Valores licitados superiores aos estimados para a contratação dos serviços.', relatedTo: 'Seleção do Fornecedor', p: 5, i: 15 },
  { id: 'R10', risk: 'Falta de ferramenta própria para gestão de demandas de Fábrica de Software.', relatedTo: 'Gestão Contratual', p: 15, i: 15 },
  { id: 'R11', risk: 'Baixa qualificação técnica dos profissionais da empresa para execução do contrato.', relatedTo: 'Gestão Contratual e Solução Tecnológica', p: 10, i: 10 },
  { id: 'R12', risk: 'Indisponibilidade de sistemas por erro no desenvolvimento ou falha na aplicação.', relatedTo: 'Gestão Contratual e Solução Tecnológica', p: 10, i: 15 },
  { id: 'R13', risk: 'Vazamento de dados e informações pelos funcionários da contratada.', relatedTo: 'Gestão Contratual', p: 10, i: 15 },
  { id: 'R14', risk: 'Falta de ferramentas para controle do ciclo de desenvolvimento e manutenção de software (ferramenta de testes, repositório com versionamento, ferramenta de integração contínua, ferramenta de análise de qualidade de código).', relatedTo: 'Gestão Contratual', p: 5, i: 15 },
  { id: 'R15', risk: 'Expedição de demandas (solicitações de execução do objeto) além da capacidade de controle e de fiscalização.', relatedTo: 'Gestão Contratual', p: 15, i: 15 },
  { id: 'R16', risk: 'Qualificação técnica e operacional insuficiente dos Fiscais Técnicos do contrato.', relatedTo: 'Gestão Contratual', p: 5, i: 15 },
];


// --- Main App Component ---
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<DocumentType>('etp');
  
  // State for documents
  const [savedETPs, setSavedETPs] = useState<SavedDocument[]>([]);
  const [savedTRs, setSavedTRs] = useState<SavedDocument[]>([]);
  const [savedRiskMaps, setSavedRiskMaps] = useState<SavedRiskMap[]>([]);
  
  const [etpSectionsContent, setEtpSectionsContent] = useState<Record<string, string>>({});
  const [trSectionsContent, setTrSectionsContent] = useState<Record<string, string>>({});
  const [riskMapContent, setRiskMapContent] = useState<Omit<SavedRiskMap, 'id' | 'name' | 'createdAt' | 'updatedAt' | 'history' | 'priority'>>({
    processNumber: '',
    projectName: '',
    locationAndDate: '',
    introduction: `O gerenciamento de riscos permite ações contínuas de planejamento, organização e controle dos recursos relacionados aos riscos que possam comprometer o sucesso da contratação, da execução do objeto e da gestão contratual.\n\nO MAPA DOS RISCOS DA CONTRATAÇÃO deve conter a identificação e a análise dos principais riscos, consistindo na compreensão da natureza e determinação do nível de risco, que corresponde à combinação do impacto e de suas probabilidades que possam comprometer a efetividade da contratação, bem como o alcance dos resultados pretendidos com a aquisição da solução.`,
    revisions: [],
    risks: [],
    followUps: [],
    preparedBy: { name: '', role: '', registration: '' },
    approvedBy: { name: '', role: '', registration: '' },
  });
  const [etpAttachments, setEtpAttachments] = useState<Attachment[]>([]);
  const [trAttachments, setTrAttachments] = useState<Attachment[]>([]);
  const [loadedEtpForTr, setLoadedEtpForTr] = useState<{ id: number; name: string; content: string } | null>(null);
  const [loadedRiskMapForTr, setLoadedRiskMapForTr] = useState<{ id: number; name: string; content: string } | null>(null);

  // State for API and files
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Array<{ name: string; status: 'processing' | 'success' | 'error'; message?: string }>>([]);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);


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
  const [historyModalContent, setHistoryModalContent] = useState<SavedDocument | SavedRiskMap | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null); // For PWA install prompt
  const [isInstallBannerVisible, setIsInstallBannerVisible] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isIntroCopied, setIsIntroCopied] = useState(false);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<{ docType: DocumentType; sectionId: string; title: string; text: string } | null>(null);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

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
  const riskMapContentRef = useRef(riskMapContent);

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

  // Risk Map Specific State
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
  const [editingRevision, setEditingRevision] = useState<RiskRevision | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState<RiskFollowUp | null>(null);


  // Generated Content Modal State
  const [generatedContentModal, setGeneratedContentModal] = useState<{
    docType: DocumentType;
    sectionId: string;
    title: string;
    content: string;
  } | null>(null);
  
  // Action Menu State
  const [openActionMenu, setOpenActionMenu] = useState<{ type: DocumentType; id: number } | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);


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

  const addNotification = useCallback((title: string, text: string, type: 'success' | 'error' | 'info') => {
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
        setSavedRiskMaps(storage.getSavedRiskMaps());

        const etpFormState = storage.loadFormState('etpFormState') as Record<string, string> || {};
        setEtpSectionsContent(etpFormState);

        const lastActiveEtp = etps.find(etp => JSON.stringify(etp.sections) === JSON.stringify(etpFormState));
        if (lastActiveEtp) {
            setEtpAttachments(lastActiveEtp.attachments || []);
        }

        setTrSectionsContent(storage.loadFormState('trFormState') as Record<string, string> || {});
        const riskMapFormState = storage.loadFormState('riskMapFormState');
        if (riskMapFormState) {
          setRiskMapContent(riskMapFormState as any);
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

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionMenu(null);
      }
    };

    if (openActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionMenu]);

  // --- Auto-save Effects ---
  useEffect(() => {
      etpContentRef.current = etpSectionsContent;
  }, [etpSectionsContent]);

  useEffect(() => {
      trContentRef.current = trSectionsContent;
  }, [trSectionsContent]);

  useEffect(() => {
      riskMapContentRef.current = riskMapContent;
  }, [riskMapContent]);
  
  // Debounced save on change
  useEffect(() => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

      debounceTimeoutRef.current = window.setTimeout(() => {
          setAutoSaveStatus('Salvando...');
          storage.saveFormState('etpFormState', etpSectionsContent);
          storage.saveFormState('trFormState', trSectionsContent);
          storage.saveFormState('riskMapFormState', riskMapContent);
          setTimeout(() => setAutoSaveStatus('Salvo com sucesso'), 500);
      }, 2000); // 2 seconds after user stops typing

      return () => {
          if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      };
  }, [etpSectionsContent, trSectionsContent, riskMapContent]);

  // Periodic save every 30 seconds
  useEffect(() => {
      const interval = setInterval(() => {
          setAutoSaveStatus('Salvando...');
          // Use refs to get the latest state, avoiding stale closures
          storage.saveFormState('etpFormState', etpContentRef.current);
          storage.saveFormState('trFormState', trContentRef.current);
          storage.saveFormState('riskMapFormState', riskMapContentRef.current);
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

    setAutoSaveStatus('A escrever...');
    if (docType === 'etp') {
      setEtpSectionsContent(prev => ({ ...prev, [id]: value }));
    } else if (docType === 'tr') {
      setTrSectionsContent(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleRiskMapChange = (field: keyof typeof riskMapContent, value: any) => {
    setAutoSaveStatus('A escrever...');
    setRiskMapContent(prev => ({ ...prev, [field]: value }));
  };

  const getRagContext = useCallback(() => {
    if (uploadedFiles.length > 0) {
      const selectedFiles = uploadedFiles.filter(f => f.selected);
      if (selectedFiles.length > 0) {
        const context = selectedFiles
          .map(f => `Contexto do ficheiro "${f.name}":\n${f.chunks.join('\n\n')}`)
          .join('\n\n---\n\n');
        return `\n\nAdicionalmente, utilize o conteúdo dos seguintes documentos de apoio (RAG) como base de conhecimento:\n\n--- INÍCIO DOS DOCUMENTOS DE APOIO ---\n${context}\n--- FIM DOS DOCUMENTOS DE APOIO ---`;
      }
    }
    return '';
  }, [uploadedFiles]);

  const webSearchInstruction = "\n\nAdicionalmente, para uma resposta mais completa e atualizada, realize uma pesquisa na web por informações relevantes, incluindo notícias, atualizações na Lei 14.133/21 e jurisprudências recentes sobre o tema.";

  const handleGenerate = async (docType: DocumentType, sectionId: string, title: string) => {
    const currentSections = docType === 'etp' ? etpSectionsContent : trSectionsContent;
    const allSections = docType === 'etp' ? etpSections : trSections;
    setLoadingSection(sectionId);

    let context = '';
    let prompt = '';
    const ragContext = getRagContext();

    if(docType === 'etp') {
      const demandaText = currentSections['etp-2-necessidade'] || '';
      if(sectionId !== 'etp-2-necessidade' && !demandaText.trim()) {
        addNotification('Atenção', "Por favor, preencha a seção '2. Descrição da Necessidade da Contratação' primeiro, pois ela serve de base para as outras.", 'info');
        setValidationErrors(new Set(['etp-2-necessidade']));
        setLoadingSection(null);
        return;
      }
      context = `Contexto Principal (Necessidade da Contratação): ${demandaText}\n`;
      allSections.forEach(sec => {
        const content = currentSections[sec.id];
        if (sec.id !== sectionId && typeof content === 'string' && content.trim()) {
          context += `\nContexto Adicional (${sec.title}): ${content.trim()}\n`;
        }
      });
      prompt = `Você é um especialista em planeamento de contratações públicas no Brasil. Sua tarefa é gerar o conteúdo para a seção "${title}" de um Estudo Técnico Preliminar (ETP).\n\nUse o seguinte contexto do formulário como base:\n${context}\n${ragContext}\n\nGere um texto detalhado e tecnicamente correto para a seção "${title}", utilizando a Lei 14.133/21 como referência principal e incorporando as informações do formulário e dos documentos de apoio.`;
    } else if (docType === 'tr') { 
      if (!loadedEtpForTr) {
        addNotification('Atenção', 'Por favor, carregue um ETP para usar como contexto antes de gerar o TR.', 'info');
        setLoadingSection(null);
        return;
      }
      const objetoText = currentSections['tr-1-objeto'] || '';
      if(sectionId !== 'tr-1-objeto' && !objetoText.trim()) {
        addNotification('Atenção', "Por favor, preencha a seção '1. Objeto' primeiro, pois ela serve de base para as outras.", 'info');
        setValidationErrors(new Set(['tr-1-objeto']));
        setLoadingSection(null);
        return;
      }
      
      let etpContext = `--- INÍCIO DO ETP DE CONTEXTO ---\n${loadedEtpForTr.content}\n--- FIM DO ETP DE CONTEXTO ---\n\n`;
      let riskMapContext = '';
      if (loadedRiskMapForTr) {
          riskMapContext = `--- INÍCIO DO MAPA DE RISCOS DE CONTEXTO ---\n${loadedRiskMapForTr.content}\n--- FIM DO MAPA DE RISCOS DE CONTEXTO ---\n\n`;
      }

      let trOtherSectionsContext = '';
      allSections.forEach(sec => {
        const content = currentSections[sec.id];
        if (sec.id !== sectionId && typeof content === 'string' && content.trim()) {
          trOtherSectionsContext += `\nContexto Adicional do TR já preenchido (${sec.title}): ${content.trim()}\n`;
        }
      });

      prompt = `Você é um especialista em licitações públicas no Brasil. Sua tarefa é gerar o conteúdo para a seção "${title}" de um Termo de Referência (TR).\n\nPara isso, utilize as seguintes fontes de informação, em ordem de prioridade:\n1. O Estudo Técnico Preliminar (ETP) base.\n2. O Mapa de Riscos associado.\n3. Os documentos de apoio (RAG) fornecidos.\n4. O conteúdo já preenchido em outras seções do TR.\n\n${etpContext}${riskMapContext}${trOtherSectionsContext}\n${ragContext}\n\nGere um texto detalhado e bem fundamentado para a seção "${title}" do TR, extraindo e inferindo as informações necessárias das fontes fornecidas.`;
    }
    
    const finalPrompt = prompt + (useWebSearch ? webSearchInstruction : '');

    try {
      const generatedText = await callGemini(finalPrompt, useWebSearch);
      if (generatedText && !generatedText.startsWith("Erro:")) {
        setGeneratedContentModal({ docType, sectionId, title, content: generatedText });
      } else {
        addNotification('Erro de Geração', generatedText, 'error');
      }
    } catch (error: any) {
      addNotification('Erro Inesperado', `Falha ao gerar texto: ${error.message}`, 'error');
    } finally {
        setLoadingSection(null);
    }
  };

  const handleRewriteRiskMapIntroduction = async () => {
    if (!riskMapContent.introduction.trim()) {
      addNotification('Atenção', 'A introdução está vazia. Escreva algo para a IA reescrever.', 'info');
      return;
    }
    setLoadingSection('riskmap-introduction');
    const prompt = `Você é um especialista em contratações públicas. Sua tarefa é reescrever o texto a seguir para a seção "Introdução" de um Mapa de Riscos, tornando-o mais claro, profissional e conciso. Retorne apenas o texto reescrito.

--- TEXTO ORIGINAL ---
${riskMapContent.introduction}
--- FIM DO TEXTO ORIGINAL ---

--- TEXTO REESCRITO ---`;
    try {
      const generatedText = await callGemini(prompt, useWebSearch);
      if (generatedText && !generatedText.startsWith("Erro:")) {
        handleRiskMapChange('introduction', generatedText);
        addNotification('Sucesso', 'A introdução foi reescrita pela IA.', 'success');
      } else {
        addNotification('Erro de Geração', generatedText, 'error');
      }
    } catch (error: any) {
      addNotification('Erro Inesperado', `Falha ao gerar texto: ${error.message}`, 'error');
    } finally {
      setLoadingSection(null);
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
        const result = await callGemini(finalPrompt, useWebSearch);
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

    interface ValidationRule {
      id: string;
      name: string;
      regex?: RegExp;
      errorMessage?: string;
    }

    const requiredFields: { [key in DocumentType]?: ValidationRule[] } = {
      etp: [
        { id: 'etp-2-necessidade', name: '2. Descrição da Necessidade da Contratação' },
        { id: 'etp-6-estimativa-quantidades', name: '6. Estimativas das Quantidades a serem Contratadas', regex: /\d+/, errorMessage: 'O campo "6. Estimativas das Quantidades" deve conter números.' },
        { id: 'etp-7-estimativa-valor', name: '7. Estimativa do Valor da Contratação' },
        { id: 'etp-8-justificativa-parcelamento', name: '8. Justificativa para o Parcelamento ou não da Solução' },
        { id: 'etp-13-viabilidade', name: '13. Declaração de Viabilidade da Contratação' },
      ],
      tr: [
        { id: 'tr-1-objeto', name: '1. Objeto' },
        { id: 'tr-2-justificativa', name: '2. Justificativa da Contratação' },
        { id: 'tr-4-execucao-requisitos', name: '4. Modelo de Execução e Requisitos' },
        { id: 'tr-5-prazo-execucao', name: '5. Prazo de Execução dos Serviços', regex: /\d+/, errorMessage: 'O campo "5. Prazo de Execução" deve especificar um número de dias ou meses.' },
        { id: 'tr-6-prazo-vigencia', name: '6. Prazo de Vigência do Contrato', regex: /\d+/, errorMessage: 'O campo "6. Prazo de Vigência" deve especificar um número de meses.' },
        { id: 'tr-15-gestao-contrato', name: '15. Modelo de Gestão do Contrato' },
        { id: 'tr-17-forma-pagamento', name: '17. Forma de Pagamento' },
        { id: 'tr-20-orcamento', name: '20. Adequação Orçamentária' },
      ],
    };

    const fieldsToValidate = requiredFields[docType] || [];

    fieldsToValidate.forEach(field => {
      const value = String(sections[field.id] || '').trim();
      if (value === '') {
        errors.push(`O campo "${field.name}" é obrigatório.`);
        errorFields.add(field.id);
      } else if (field.regex && !field.regex.test(value)) {
        errors.push(field.errorMessage || `O campo "${field.name}" possui um formato inválido.`);
        errorFields.add(field.id);
      }
    });

    setValidationErrors(errorFields);
    return errors;
  };

  const handleSaveDocument = (docType: DocumentType) => {
    if (docType === 'etp' || docType === 'tr') {
      const sections = docType === 'etp' ? etpSectionsContent : trSectionsContent;
      
      const validationMessages = validateForm(docType, sections);
      if (validationMessages.length > 0) {
          addNotification(
              "Campos Obrigatórios",
              `Por favor, preencha os seguintes campos antes de salvar:\n- ${validationMessages.join('\n- ')}`,
              'error'
          );
          return;
      }

      const name = `${docType.toUpperCase()} ${new Date().toLocaleString('pt-BR').replace(/[/:,]/g, '_')}`;
      const now = new Date().toISOString();
      
      if (docType === 'etp') {
        const newDoc: SavedDocument = {
          id: Date.now(),
          name,
          createdAt: now,
          updatedAt: now,
          sections: { ...sections },
          attachments: etpAttachments,
          history: [],
          priority: 'medium',
        };
        const updatedETPs = [...savedETPs, newDoc];
        setSavedETPs(updatedETPs);
        storage.saveETPs(updatedETPs);
        addNotification("Sucesso", `ETP "${name}" guardado com sucesso!`, 'success');
      } else {
        const newDoc: SavedDocument = {
          id: Date.now(),
          name,
          createdAt: now,
          updatedAt: now,
          sections: { ...sections },
          attachments: trAttachments,
          history: [],
          priority: 'medium',
        };
        const updatedTRs = [...savedTRs, newDoc];
        setSavedTRs(updatedTRs);
        storage.saveTRs(updatedTRs);
        addNotification("Sucesso", `TR "${name}" guardado com sucesso!`, 'success');
      }
    } else if (docType === 'mapa-riscos') {
      if (!riskMapContent.projectName.trim() || !riskMapContent.processNumber.trim()) {
        addNotification("Campos Obrigatórios", "Por favor, preencha o Nome do Projeto e o Nº do Processo antes de salvar.", "error");
        return;
      }
      const name = `Mapa de Riscos - ${riskMapContent.projectName}`;
      const now = new Date().toISOString();
      const newDoc: SavedRiskMap = {
        id: Date.now(),
        name,
        createdAt: now,
        updatedAt: now,
        ...riskMapContent,
        priority: 'medium',
      };
      const updatedMaps = [...savedRiskMaps, newDoc];
      setSavedRiskMaps(updatedMaps);
      storage.saveRiskMaps(updatedMaps);
      addNotification("Sucesso", `Mapa de Riscos "${name}" salvo com sucesso!`, 'success');
    }
  };
  
  const handleLoadDocument = (docType: DocumentType, id: number) => {
    if (docType === 'etp' || docType === 'tr') {
      const docs = docType === 'etp' ? savedETPs : savedTRs;
      const docToLoad = docs.find(doc => doc.id === id);
      if(docToLoad) {
        if (docType === 'etp') {
          setEtpSectionsContent(docToLoad.sections);
          setEtpAttachments(docToLoad.attachments || []);
          storage.saveFormState('etpFormState', docToLoad.sections);
        } else {
          setTrSectionsContent(docToLoad.sections);
          setTrAttachments(docToLoad.attachments || []);
          storage.saveFormState('trFormState', docToLoad.sections);
        }
        addNotification('Documento Carregado', `O ${docType.toUpperCase()} "${docToLoad.name}" foi carregado.`, 'success');
        setActiveView(docType);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
      }
    } else if (docType === 'mapa-riscos') {
      const docToLoad = savedRiskMaps.find(doc => doc.id === id);
      if (docToLoad) {
        const { id, name, createdAt, updatedAt, history, priority, ...content } = docToLoad;
        setRiskMapContent(content);
        storage.saveFormState('riskMapFormState', content);
        addNotification('Documento Carregado', `O Mapa de Riscos "${docToLoad.name}" foi carregado.`, 'success');
        setActiveView(docType);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
      }
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
    } else if (docType === 'mapa-riscos') {
      const updated = savedRiskMaps.filter(doc => doc.id !== id);
      setSavedRiskMaps(updated);
      storage.saveRiskMaps(updated);
    }
    addNotification('Sucesso', `O documento foi apagado.`, 'success');
  };

  const handleStartEditing = (type: DocumentType, doc: SavedDocument | SavedRiskMap) => {
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

    if (type === 'etp') {
      const updated = savedETPs.map(doc => doc.id === id ? { ...doc, name: newName, priority: priority } : doc);
      setSavedETPs(updated);
      storage.saveETPs(updated);
    } else if (type === 'tr') {
      const updated = savedTRs.map(doc => doc.id === id ? { ...doc, name: newName, priority: priority } : doc);
      setSavedTRs(updated);
      storage.saveTRs(updated);
    } else if (type === 'mapa-riscos') {
      const updated = savedRiskMaps.map(doc => doc.id === id ? { ...doc, name: newName, priority: priority } : doc);
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
      addNotification('Sucesso', `${successfullyProcessed.length} ficheiro(s) carregado(s).`, 'success');
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
    addNotification('Status do Ficheiro', `O ficheiro "${file.name}" foi ${!(file.isLocked ?? false) ? 'bloqueado' : 'desbloqueado'}.`, 'info');
  };

  const handlePreviewRagFile = (file: UploadedFile) => {
    if (!file.content || !file.type) {
      addNotification('Pré-visualização Indisponível', 'Este ficheiro foi carregado numa versão anterior e não tem conteúdo para pré-visualização. Por favor, remova-o e carregue-o novamente.', 'info');
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
    const riskMap = savedRiskMaps.find(m => m.id === parseInt(riskMapId, 10));
    if (riskMap) {
        let content = `## Contexto do Mapa de Riscos: ${riskMap.name}\n`;
        content += `### Projeto: ${riskMap.projectName || 'Não informado'}\n`;
        content += `### Processo nº: ${riskMap.processNumber || 'Não informado'}\n\n`;
        content += `### Riscos Identificados:\n`;
        riskMap.risks.forEach(risk => {
            content += `- **Risco ${risk.id}:** ${risk.risk}\n`;
            content += `  - Relacionado a: ${risk.relatedTo}\n`;
            content += `  - Probabilidade: ${risk.probabilityText} (Valor: ${risk.probability})\n`;
            content += `  - Impacto: ${risk.impactText} (Valor: ${risk.impact})\n`;
            content += `  - Tratamento Proposto: ${risk.treatment}\n\n`;
        });
        setLoadedRiskMapForTr({ id: riskMap.id, name: riskMap.name, content });
        addNotification("Contexto Carregado", `O Mapa de Riscos "${riskMap.name}" foi carregado como contexto para o TR.`, 'info');
    }
  };

  const handleImportEtpAttachments = () => {
    if (!loadedEtpForTr) {
      addNotification('Aviso', 'Nenhum ETP carregado para importar anexos.', 'info');
      return;
    }
    const etp = savedETPs.find(e => e.id === loadedEtpForTr.id);
    if (etp && etp.attachments && etp.attachments.length > 0) {
      const newAttachments = etp.attachments.filter(
        att => !trAttachments.some(trAtt => trAtt.name === att.name)
      );
      if (newAttachments.length > 0) {
        setTrAttachments(prev => [...prev, ...newAttachments]);
        addNotification('Sucesso', `${newAttachments.length} anexo(s) importado(s) do ETP "${etp.name}".`, 'success');
      } else {
        addNotification('Informação', 'Todos os anexos do ETP já constam neste TR.', 'info');
      }
    } else {
      addNotification('Aviso', `O ETP "${loadedEtpForTr.name}" não possui anexos para importar.`, 'info');
    }
  };

  const handleRiskAnalysis = async (docType: DocumentType, sectionId: string, title: string) => {
    const currentSections = docType === 'etp' ? etpSectionsContent : trSectionsContent;
    const sectionContent = currentSections[sectionId];

    if (!sectionContent || String(sectionContent || '').trim() === '') {
        addNotification('Aviso', `Por favor, preencha ou gere o conteúdo da seção "${title}" antes de realizar a análise de riscos.`, 'info');
        return;
    }

    setAnalysisContent({ title: `Analisando Riscos para: ${title}`, content: 'A IA está a pensar... por favor, aguarde.' });

    const ragContext = getRagContext();
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
        const analysisResult = await callGemini(finalPrompt, useWebSearch);
        setAnalysisContent({ title: `Análise de Riscos: ${title}`, content: analysisResult });
    } catch (error: any) {
        setAnalysisContent({ title: `Análise de Riscos: ${title}`, content: `Erro ao realizar análise: ${error.message}` });
    }
  };

  const handleOpenEditModal = (docType: DocumentType, sectionId: string, title: string) => {
    let content = '';
    if (docType === 'etp') {
      content = etpSectionsContent[sectionId] || '';
    } else if (docType === 'tr') {
      content = trSectionsContent[sectionId] || '';
    } else if (docType === 'mapa-riscos' && sectionId === 'introduction') {
      content = riskMapContent.introduction;
    }
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
    if (docType === 'etp' || docType === 'tr') {
      handleSectionChange(docType, sectionId, text);
    } else if (docType === 'mapa-riscos' && sectionId === 'introduction') {
      handleRiskMapChange('introduction', text);
    }
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
      const refinedText = await callGemini(prompt, useWebSearch);
      if (refinedText && !refinedText.startsWith("Erro:")) {
        setEditingContent({ ...editingContent, text: refinedText });
      } else {
        addNotification("Erro de Refinamento", refinedText, 'error');
      }
    } catch (error: any) {
      addNotification('Erro Inesperado', `Falha ao refinar o texto: ${error.message}`, 'error');
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
        exportDocumentToPDF(docToExport, allSections);
    } else {
        addNotification('Erro', 'Não foi possível encontrar o documento para exportar.', 'error');
    }
  };
  
  const handleClearForm = useCallback((docType: DocumentType) => () => {
    if (docType === 'etp') {
        setEtpSectionsContent({});
        setEtpAttachments([]);
        storage.saveFormState('etpFormState', {});
    } else if (docType === 'tr') {
        setTrSectionsContent({});
        setTrAttachments([]);
        setLoadedEtpForTr(null);
        setLoadedRiskMapForTr(null);
        const etpSelector = document.getElementById('etp-selector') as HTMLSelectElement;
        if (etpSelector) etpSelector.value = "";
        const riskMapSelector = document.getElementById('riskmap-selector') as HTMLSelectElement;
        if (riskMapSelector) riskMapSelector.value = "";
        storage.saveFormState('trFormState', {});
    } else if (docType === 'mapa-riscos') {
        setRiskMapContent({
            processNumber: '', projectName: '', locationAndDate: '',
            introduction: `O gerenciamento de riscos permite ações contínuas de planejamento, organização e controle dos recursos relacionados aos riscos que possam comprometer o sucesso da contratação, da execução do objeto e da gestão contratual.\n\nO MAPA DOS RISCOS DA CONTRATAÇÃO deve conter a identificação e a análise dos principais riscos, consistindo na compreensão da natureza e determinação do nível de risco, que corresponde à combinação do impacto e de suas probabilidades que possam comprometer a efetividade da contratação, bem como o alcance dos resultados pretendidos com a aquisição da solução.`,
            revisions: [], risks: [], followUps: [],
            preparedBy: { name: '', role: '', registration: '' },
            approvedBy: { name: '', role: '', registration: '' },
        });
        storage.saveFormState('riskMapFormState', {});
    }
    addNotification('Formulário Limpo', `O formulário do ${docType.toUpperCase()} foi limpo.`, 'info');
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
        addNotification('Erro', 'Documento não encontrado para gerar o resumo.', 'error');
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
      
      const ragContext = getRagContext();

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
        const summary = await callGemini(finalPrompt, useWebSearch);
        if (summary && !summary.startsWith("Erro:")) {
          setSummaryState({ loading: false, content: summary });
        } else {
          setSummaryState({ loading: false, content: `Erro ao gerar resumo: ${summary}` });
        }
      } catch (error: any) {
        setSummaryState({ loading: false, content: `Falha inesperada ao gerar resumo: ${error.message}` });
      }
    };

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
        'Novo Documento',
        `Um novo formulário para ${docType.toUpperCase()} foi iniciado.`,
        'info'
    );
  }, [switchView, handleClearForm, addNotification]);

  const handleCreateFromTemplate = useCallback((template: Template) => {
      setIsNewDocModalOpen(false);
      switchView(template.type);
      if (template.type === 'etp') {
          setEtpSectionsContent(template.sections);
          setEtpAttachments([]);
          storage.saveFormState('etpFormState', template.sections);
      } else if (template.type === 'tr') {
          setTrSectionsContent(template.sections);
          setTrAttachments([]);
          setLoadedEtpForTr(null);
          const etpSelector = document.getElementById('etp-selector') as HTMLSelectElement;
          if (etpSelector) etpSelector.value = "";
          storage.saveFormState('trFormState', template.sections);
      }
      addNotification(
          'Template Carregado',
          `Um novo documento foi iniciado usando o template "${template.name}".`,
          'success'
      );
  }, [switchView, addNotification]);

  const displayDocumentHistory = (doc: SavedDocument | SavedRiskMap) => {
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
            addNotification("Link Copiado", "O link da aplicação foi copiado para a sua área de transferência!", 'success');
        } catch (error) {
            console.error('Erro ao copiar o link:', error);
            addNotification("Erro", "Não foi possível copiar o link. Por favor, copie manualmente: https://trgenius.netlify.app/", 'error');
        }
    }
  };

  const priorityFilteredDocs = useMemo(() => {
    const filterByPriority = <T extends { priority?: Priority }>(docs: T[]) => {
      if (priorityFilter === 'all') return docs;
      return docs.filter(doc => doc.priority === priorityFilter);
    };
    return {
      etps: filterByPriority(savedETPs),
      trs: filterByPriority(savedTRs),
      riskMaps: filterByPriority(savedRiskMaps),
    };
  }, [savedETPs, savedTRs, savedRiskMaps, priorityFilter]);

  const searchedDocs = useMemo(() => {
    const filterBySearch = <T extends { name: string }>(docs: T[]) => {
      if (!searchTerm) return docs;
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
    const sortDocs = <T extends { name: string, updatedAt: string }>(docs: T[]) => {
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
  
  const getRiskLevelClass = (level: number) => {
    if (level <= 50) return 'bg-green-100 text-green-800 border-green-200'; // Baixo
    if (level <= 150) return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Médio
    return 'bg-red-100 text-red-800 border-red-200'; // Alto
  };

  const getRiskLevelClassExample = (level: number) => {
    if (level <= 75) return 'bg-green-400 text-green-900 font-bold'; // Baixo/Verde
    if (level <= 150) return 'bg-yellow-400 text-yellow-900 font-bold'; // Médio/Amarelo
    return 'bg-red-500 text-white font-bold'; // Alto/Vermelho
  };

  const handleSaveRisk = () => {
    if (!editingRisk) return;
    const isNew = !riskMapContent.risks.some(r => r.id === editingRisk.id);
    let updatedRisks;
    if (isNew) {
        updatedRisks = [...riskMapContent.risks, editingRisk];
    } else {
        updatedRisks = riskMapContent.risks.map(r => r.id === editingRisk.id ? editingRisk : r);
    }
    handleRiskMapChange('risks', updatedRisks);
    setEditingRisk(null);
  };
  
  const handleSaveRevision = () => {
      if (!editingRevision) return;
      const isNew = !riskMapContent.revisions.some(r => r.id === editingRevision.id);
      let updatedRevisions;
      if (isNew) {
          updatedRevisions = [...riskMapContent.revisions, editingRevision];
      } else {
          updatedRevisions = riskMapContent.revisions.map(r => r.id === editingRevision.id ? editingRevision : r);
      }
      handleRiskMapChange('revisions', updatedRevisions);
      setEditingRevision(null);
  };
  
  const handleSaveFollowUp = () => {
      if (!editingFollowUp) return;
      const isNew = !riskMapContent.followUps.some(f => f.id === editingFollowUp.id);
      let updatedFollowUps;
      if (isNew) {
          updatedFollowUps = [...riskMapContent.followUps, editingFollowUp];
      } else {
          updatedFollowUps = riskMapContent.followUps.map(f => f.id === editingFollowUp.id ? editingFollowUp : f);
      }
      handleRiskMapChange('followUps', updatedFollowUps);
      setEditingFollowUp(null);
  };


  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
       <div className="flex flex-col md:flex-row h-screen">
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}
         
          <aside className={`fixed md:relative top-0 left-0 h-full w-full max-w-sm md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col transition-transform duration-300 z-30 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
             <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-slate-500 rounded-full hover:bg-slate-100 hover:text-slate-800 transition-colors z-40"
                aria-label="Fechar Menu"
              >
                <Icon name="times" className="text-2xl" />
              </button>
             <div className="flex items-center justify-between gap-3 mb-6 pt-10 md:pt-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Icon name="brain" className="text-pink-600 text-xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">TR Genius</h1>
                </div>
                <button
                    onClick={handleShare}
                    className="w-9 h-9 flex items-center justify-center text-slate-400 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    title="Partilhar Aplicação"
                >
                    <Icon name="share-nodes" />
                </button>
            </div>
            <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                Seu assistente para criar Estudos Técnicos e Termos de Referência, em conformidade com a <b>Lei 14.133/21</b>.
            </p>
            
            {/* Botão para criar novo documento (visível em desktop) */}
            <div className="hidden md:block mb-6">
                <button
                    onClick={() => setIsNewDocModalOpen(true)}
                    className="w-full bg-pink-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-pink-700 transition-all flex items-center justify-center gap-2"
                    title="Criar Novo Documento"
                    aria-haspopup="dialog"
                >
                    <Icon name="plus" className="text-lg" />
                    <span>Criar Novo Documento</span>
                </button>
            </div>

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
                                  <div className="flex items-center justify-between w-full gap-2">
                                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                          <PriorityIndicator priority={etp.priority} />
                                          <span className="text-sm font-medium text-slate-700 truncate" title={etp.name}>{etp.name}</span>
                                      </div>
                                      <div className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0" title={etp.updatedAt ? `Atualizado em: ${new Date(etp.updatedAt).toLocaleString('pt-BR')}` : ''}>
                                          {etp.updatedAt && (
                                            <span>
                                              {new Date(etp.updatedAt).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                            </span>
                                          )}
                                      </div>
                                      <div className="relative flex-shrink-0">
                                          <button
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  openActionMenu?.id === etp.id ? setOpenActionMenu(null) : setOpenActionMenu({ type: 'etp', id: etp.id });
                                              }}
                                              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-200 transition-colors"
                                              title="Mais opções"
                                          >
                                              <Icon name="ellipsis-v" />
                                          </button>
                                          {openActionMenu?.type === 'etp' && openActionMenu?.id === etp.id && (
                                              <div ref={actionMenuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 py-1 animate-scale-in">
                                                  <ul>
                                                      <li><button onClick={() => { handleStartEditing('etp', etp); setOpenActionMenu(null); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100"><Icon name="pencil-alt" className="mr-3 w-4 text-center" /> Renomear</button></li>
                                                      <li><button onClick={() => { handleLoadDocument('etp', etp.id); setOpenActionMenu(null); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100"><Icon name="upload" className="mr-3 w-4 text-center" /> Carregar</button></li>
                                                      <li><button onClick={() => { setPreviewContext({ type: 'etp', id: etp.id }); setIsPreviewModalOpen(true); setOpenActionMenu(null); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100"><Icon name="eye" className="mr-3 w-4 text-center" /> Pré-visualizar</button></li>
                                                      <li><button onClick={() => { displayDocumentHistory(etp); setOpenActionMenu(null); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100"><Icon name="history" className="mr-3 w-4 text-center" /> Ver Histórico</button></li>
                                                      <li><button onClick={() => { handleDeleteDocument('etp', etp.id); setOpenActionMenu(null); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"><Icon name="trash" className="mr-3 w-4 text-center" /> Apagar</button></li>
                                                  </ul>
                                              </div>
                                          )}
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
                                  <div className="flex items-center justify-between w-full gap-2">
                                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                          <PriorityIndicator priority={tr.priority} />
                                          <span className="text-sm font-medium text-slate-700 truncate" title={tr.name}>{tr.name}</span>
                                      </div>
                                      <div className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0" title={tr.updatedAt ? `Atualizado em: ${new Date(tr.updatedAt).toLocaleString('pt-BR')}` : ''}>
                                          {tr.updatedAt && (
                                            <span>
                                              {new Date(tr.updatedAt).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                            </span>
                                          )}
                                      </div>
                                      <div className="relative flex-shrink-0">
                                          <button
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  openActionMenu?.id === tr.id ? setOpenActionMenu(null) : setOpenActionMenu({ type: 'tr', id: tr.id });
                                              }}
                                              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-purple-600 rounded-full hover:bg-slate-200 transition-colors"
                                              title="Mais opções"
                                          >
                                              <Icon name="ellipsis-v" />
                                          </button>
                                          {openActionMenu?.type === 'tr' && openActionMenu?.id === tr.id && (
                                              <div ref={actionMenuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 py-1 animate-scale-in">
                                                  <ul>
                                                      <li><button onClick={() => { handleStartEditing('tr', tr); setOpenActionMenu(null); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100"><Icon name="pencil-alt" className="mr-3 w-4 text-center" /> Renomear</button></li>
                                                      <li><button onClick={() => { handleLoadDocument('tr', tr.id); setOpenActionMenu(null); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100"><Icon name="upload" className="mr-3 w-4 text-center" /> Carregar</button></li>
                                                      <li><button onClick={() => { setPreviewContext({ type: 'tr', id: tr.id }); setIsPreviewModalOpen(true); setOpenActionMenu(null); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100"><Icon name="eye" className="mr-3 w-4 text-center" /> Pré-visualizar</button></li>
                                                      <li><button onClick={() => { displayDocumentHistory(tr); setOpenActionMenu(null); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100"><Icon name="history" className="mr-3 w-4 text-center" /> Ver Histórico</button></li>
                                                      <li><button onClick={() => { handleDeleteDocument('tr', tr.id); setOpenActionMenu(null); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"><Icon name="trash" className="mr-3 w-4 text-center" /> Apagar</button></li>
                                                  </ul>
                                              </div>
                                          )}
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

                {/* Accordion Section: Mapas de Risco */}
                <div className="py-1">
                  <button onClick={() => toggleSidebarSection('riskMaps')} className="w-full flex justify-between items-center text-left p-2 rounded-lg hover:bg-yellow-50 transition-colors">
                    <div className="flex items-center">
                        <Icon name="shield-alt" className="text-yellow-500 w-5 text-center" />
                        <h3 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider ml-2">Mapas de Risco</h3>
                    </div>
                    <Icon name={openSidebarSections.riskMaps ? 'chevron-up' : 'chevron-down'} className="text-slate-400 transition-transform" />
                  </button>
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSidebarSections.riskMaps ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-2">
                        {displayedRiskMaps.length > 0 ? (
                          <ul className="space-y-2">
                            {displayedRiskMaps.map(map => (
                              <li key={map.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                  {editingDoc?.type === 'mapa-riscos' && editingDoc?.id === map.id ? (
                                      <div className="w-full flex items-center gap-2" onBlur={handleEditorBlur}>
                                        {/* Editor inline para Mapa de Riscos */}
                                      </div>
                                  ) : (
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                            <PriorityIndicator priority={map.priority} />
                                            <span className="text-sm font-medium text-slate-700 truncate" title={map.name}>{map.name}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0" title={map.updatedAt ? `Atualizado em: ${new Date(map.updatedAt).toLocaleString('pt-BR')}` : ''}>
                                            {map.updatedAt && <span>{new Date(map.updatedAt).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</span>}
                                        </div>
                                        <div className="relative flex-shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openActionMenu?.id === map.id ? setOpenActionMenu(null) : setOpenActionMenu({ type: 'mapa-riscos', id: map.id });
                                                }}
                                                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-yellow-600 rounded-full hover:bg-slate-200 transition-colors"
                                                title="Mais opções"
                                            >
                                                <Icon name="ellipsis-v" />
                                            </button>
                                            {openActionMenu?.type === 'mapa-riscos' && openActionMenu?.id === map.id && (
                                                <div ref={actionMenuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 py-1 animate-scale-in">
                                                    <ul>
                                                      <li><button onClick={() => { handleLoadDocument('mapa-riscos', map.id); setOpenActionMenu(null); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100"><Icon name="upload" className="mr-3 w-4 text-center" /> Carregar</button></li>
                                                      <li><button onClick={() => { handleDeleteDocument('mapa-riscos', map.id); setOpenActionMenu(null); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"><Icon name="trash" className="mr-3 w-4 text-center" /> Apagar</button></li>
                                                    </ul>
                                                </div>
                                            )}
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
          
          <main className="flex-1 p-4 pb-40 sm:p-6 md:p-10 md:pb-10 overflow-y-auto bg-slate-100" onClick={() => { if(window.innerWidth < 768) setIsSidebarOpen(false) }}>
             <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex-grow">
                  <div className="border-b border-slate-200">
                    <nav className="-mb-px hidden md:flex space-x-6" aria-label="Tabs">
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
                        onClick={() => switchView('mapa-riscos')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors ${
                          activeView === 'mapa-riscos'
                            ? 'border-yellow-600 text-yellow-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        Mapa de Riscos
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
                     <h2 className="md:hidden text-2xl font-bold text-slate-800 py-4">
                        {activeView === 'etp' ? 'Gerador de ETP' : activeView === 'mapa-riscos' ? 'Mapa de Riscos' : 'Gerador de TR'}
                    </h2>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4 flex items-center gap-4">
                    <label htmlFor="web-search-toggle" className="flex items-center cursor-pointer gap-2 text-sm font-medium text-slate-600" title="Ativar para incluir resultados da web em tempo real nas respostas da IA.">
                        <Icon name="globe-americas" />
                        <span className="hidden sm:inline">Pesquisa Web</span>
                        <div className="relative">
                            <input id="web-search-toggle" type="checkbox" className="sr-only peer" checked={useWebSearch} onChange={() => setUseWebSearch(!useWebSearch)} />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                    </label>
                    {isOnline ? (
                        <div className="flex items-center justify-center w-8 h-8 md:w-auto md:px-2 md:py-1 md:gap-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full" title="A ligação à Internet está ativa.">
                            <Icon name="wifi" />
                            <span className="hidden md:inline">Online</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-8 h-8 md:w-auto md:px-2 md:py-1 md:gap-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full" title="Sem ligação à Internet. As funcionalidades online estão desativadas.">
                            <Icon name="wifi-slash" />
                            <span className="hidden md:inline">Offline</span>
                        </div>
                    )}
                </div>
            </header>
            
            <div className={`${activeView === 'etp' ? 'block' : 'hidden'}`}>
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
                        isLoading={loadingSection === section.id}
                        onEdit={() => handleOpenEditModal('etp', section.id, section.title)}
                        hasError={validationErrors.has(section.id)}
                        tooltip={section.tooltip}
                    />
                  );
                })}
                <div className="fixed bottom-[5.5rem] md:bottom-auto left-0 right-0 z-10 bg-white/90 backdrop-blur-sm p-4 border-t border-slate-200 md:relative md:bg-transparent md:p-0 md:border-none md:mt-6" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'}}>
                    <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
                        <span className="hidden md:block text-sm text-slate-500 italic mr-auto transition-colors">{autoSaveStatus}</span>
                        <button onClick={handleClearForm('etp')} className="bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-2">
                            <Icon name="eraser" /> Limpar Formulário
                        </button>
                        <button onClick={() => handleSaveDocument('etp')} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2">
                            <Icon name="save" /> Salvar ETP
                        </button>
                    </div>
                </div>
            </div>

            <div className={`${activeView === 'mapa-riscos' ? 'block' : 'hidden'}`}>
                {/* Dados Gerais */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b">Dados Gerais da Contratação</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="riskmap-processNumber" className="block text-sm font-medium text-slate-700 mb-1">Processo Administrativo nº</label>
                            <input id="riskmap-processNumber" type="text" value={riskMapContent.processNumber} onChange={e => handleRiskMapChange('processNumber', e.target.value)} placeholder="<XXXXXXXX>" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500"/>
                        </div>
                        <div>
                            <label htmlFor="riskmap-projectName" className="block text-sm font-medium text-slate-700 mb-1">Nome do Projeto / Solução</label>
                            <input id="riskmap-projectName" type="text" value={riskMapContent.projectName} onChange={e => handleRiskMapChange('projectName', e.target.value)} placeholder="<Nome do Projeto / Solução>" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500"/>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="riskmap-locationAndDate" className="block text-sm font-medium text-slate-700 mb-1">Local e Data</label>
                            <input id="riskmap-locationAndDate" type="text" value={riskMapContent.locationAndDate} onChange={e => handleRiskMapChange('locationAndDate', e.target.value)} placeholder="<Local>, <mês> de <ano>" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500"/>
                        </div>
                    </div>
                </div>

                {/* Histórico de Revisões */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800">Histórico de Revisões</h2>
                        <button onClick={() => setEditingRevision({ id: Date.now(), date: '', version: '', description: '', phase: 'PC', author: '' })} className="bg-yellow-100 text-yellow-800 font-bold py-2 px-4 rounded-lg hover:bg-yellow-200 transition-colors text-sm flex items-center gap-2">
                            <Icon name="plus" /> Adicionar Revisão
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Data</th>
                                    <th scope="col" className="px-4 py-3">Versão</th>
                                    <th scope="col" className="px-4 py-3">Descrição</th>
                                    <th scope="col" className="px-4 py-3">Fase</th>
                                    <th scope="col" className="px-4 py-3">Autor</th>
                                    <th scope="col" className="px-4 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {riskMapContent.revisions.map((rev) => (
                                    <tr key={rev.id} className="bg-white border-b">
                                        <td className="px-4 py-2">{rev.date}</td>
                                        <td className="px-4 py-2">{rev.version}</td>
                                        <td className="px-4 py-2">{rev.description}</td>
                                        <td className="px-4 py-2">{rev.phase}</td>
                                        <td className="px-4 py-2">{rev.author}</td>
                                        <td className="px-4 py-2 text-center">
                                            <button onClick={() => setEditingRevision(rev)} className="text-blue-600 hover:text-blue-800 p-1"><Icon name="pencil-alt" /></button>
                                            <button onClick={() => handleRiskMapChange('revisions', riskMapContent.revisions.filter(r => r.id !== rev.id))} className="text-red-600 hover:text-red-800 p-1"><Icon name="trash" /></button>
                                        </td>
                                    </tr>
                                ))}
                                {riskMapContent.revisions.length === 0 && (
                                    <tr><td colSpan={6} className="text-center italic text-slate-400 py-4">Nenhuma revisão adicionada.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Introdução */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-y-3">
                        <h2 className="text-xl font-bold text-slate-800">1 - INTRODUÇÃO</h2>
                        <div className="w-full sm:w-auto flex items-stretch gap-2 flex-wrap">
                            <button onClick={() => { navigator.clipboard.writeText(riskMapContent.introduction); setIsIntroCopied(true); setTimeout(() => setIsIntroCopied(false), 2000); }} className={`flex-1 flex items-center justify-center text-center px-3 py-2 text-xs font-semibold rounded-lg transition-colors min-w-[calc(50%-0.25rem)] sm:min-w-0 ${isIntroCopied ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} title={isIntroCopied ? 'Copiado!' : 'Copiar'}>
                                <Icon name={isIntroCopied ? 'check' : 'copy'} className="mr-2" />
                                <span>{isIntroCopied ? 'Copiado!' : 'Copiar'}</span>
                            </button>
                            <button onClick={() => handleOpenEditModal('mapa-riscos', 'introduction', 'Introdução')} className="flex-1 flex items-center justify-center text-center px-3 py-2 text-xs font-semibold text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors min-w-[calc(50%-0.25rem)] sm:min-w-0" title="Editar e Refinar">
                                <Icon name="pencil-alt" className="mr-2" />
                                <span>Editar/Refinar</span>
                            </button>
                            <button onClick={handleRewriteRiskMapIntroduction} disabled={loadingSection === 'riskmap-introduction'} className="flex-1 flex items-center justify-center text-center px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[calc(50%-0.25rem)] sm:min-w-0">
                                <Icon name={loadingSection === 'riskmap-introduction' ? 'spinner' : 'wand-magic-sparkles'} className={`mr-2 ${loadingSection === 'riskmap-introduction' ? 'fa-spin' : ''}`} />
                                <span>{loadingSection === 'riskmap-introduction' ? 'A gerar...' : 'Gerar com IA'}</span>
                            </button>
                        </div>
                    </div>
                    <textarea value={riskMapContent.introduction} onChange={e => handleRiskMapChange('introduction', e.target.value)} className="w-full h-40 p-3 bg-slate-50 border rounded-lg focus:ring-2 transition-colors border-slate-200 focus:ring-yellow-500" />
                </div>

                {/* Identificação de Riscos */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold text-slate-800">2 - IDENTIFICAÇÃO E ANÁLISE DOS PRINCIPAIS RISCOS</h2>
                        <button onClick={() => setEditingRisk({ id: `R${(riskMapContent.risks.length + 1).toString().padStart(2, '0')}`, risk: '', relatedTo: 'Planejamento da Contratação', probability: 5, impact: 5, probabilityText: 'Baixa', impactText: 'Baixo', damages: [''], treatment: 'Mitigar', preventiveActions: [], contingencyActions: [] })} className="bg-yellow-100 text-yellow-800 font-bold py-2 px-4 rounded-lg hover:bg-yellow-200 transition-colors text-sm flex items-center gap-2">
                           <Icon name="plus" /> Adicionar Risco
                        </button>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">A tabela a seguir apresenta uma síntese dos riscos identificados e classificados neste documento.</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-4 py-3">ID</th>
                                    <th scope="col" className="px-4 py-3">Risco</th>
                                    <th scope="col" className="px-4 py-3">Relacionado a</th>
                                    <th scope="col" className="px-4 py-3 text-center">P</th>
                                    <th scope="col" className="px-4 py-3 text-center">I</th>
                                    <th scope="col" className="px-4 py-3 text-center">Nível</th>
                                    <th scope="col" className="px-4 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {riskMapContent.risks.map((risk) => (
                                    <tr key={risk.id} className="bg-white border-b">
                                        <td className="px-4 py-2 font-semibold">{risk.id}</td>
                                        <td className="px-4 py-2">{risk.risk}</td>
                                        <td className="px-4 py-2">{risk.relatedTo}</td>
                                        <td className="px-4 py-2 text-center">{risk.probability}</td>
                                        <td className="px-4 py-2 text-center">{risk.impact}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`px-2 py-1 font-semibold rounded-full text-xs ${getRiskLevelClass(risk.probability * risk.impact)}`}>
                                                {risk.probability * risk.impact}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button onClick={() => setEditingRisk(risk)} className="text-blue-600 hover:text-blue-800 p-1" title="Detalhar/Editar Risco"><Icon name="tasks" /></button>
                                            <button onClick={() => handleRiskMapChange('risks', riskMapContent.risks.filter(r => r.id !== risk.id))} className="text-red-600 hover:text-red-800 p-1" title="Remover Risco"><Icon name="trash" /></button>
                                        </td>
                                    </tr>
                                ))}
                                {riskMapContent.risks.length === 0 && (
                                    <tr><td colSpan={7} className="text-center italic text-slate-400 py-4">Nenhum risco adicionado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-sm text-slate-500 italic mt-6 mb-4">{"<A seguir encontra-se um exemplo de relação de riscos, não exaustiva, de uma contratação de serviços de desenvolvimento e manutenção de software.>"}</p>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-4 py-3">Id</th>
                                    <th className="px-4 py-3">Risco</th>
                                    <th className="px-4 py-3">Relacionado ao(à):</th>
                                    <th className="px-4 py-3 text-center">P</th>
                                    <th className="px-4 py-3 text-center">I</th>
                                    <th className="px-4 py-3 text-center">Nível de Risco (P x I)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                               {exampleRisks.map(risk => (
                                <tr key={risk.id} className="border-b last:border-b-0">
                                    <td className="px-4 py-2 font-medium text-slate-900">{risk.id}</td>
                                    <td className="px-4 py-2">{risk.risk}</td>
                                    <td className="px-4 py-2">{risk.relatedTo}</td>
                                    <td className="px-4 py-2 text-center">{risk.p}</td>
                                    <td className="px-4 py-2 text-center">{risk.i}</td>
                                    <td className={`px-4 py-2 text-center ${getRiskLevelClassExample(risk.p * risk.i)}`}>{risk.p * risk.i}</td>
                                </tr>
                               ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Avaliação e Tratamento */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                   <h2 className="text-xl font-bold text-slate-800 mb-2">3 - AVALIAÇÃO E TRATAMENTO DOS RISCOS IDENTIFICADOS</h2>
                   <div className="space-y-2 text-sm text-slate-500 italic">
                      <p>{"<Riscos do processo de contratação (planejamento, seleção de fornecedores e gestão do contrato), ou qualquer outro risco relevante relacionado à solução identificados>."}</p>
                      <p>{"<Para o tratamento de riscos, as seguintes opções podem ser selecionadas: evitar, reduzir ou mitigar, transferir ou compartilhar, e aceitar ou tolerar o risco>."}</p>
                      <p>{"<A seguir são apresentados alguns riscos meramente exemplificativos>."}</p>
                   </div>
                   <p className="text-slate-600 mt-4">Clique no botão <Icon name="tasks" /> de um risco na tabela acima para detalhar seu tratamento, incluindo danos, ações preventivas e de contingência.</p>
                </div>

                {/* Acompanhamento */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800">4 - ACOMPANHAMENTO DAS AÇÕES DE TRATAMENTO DE RISCOS</h2>
                        <button onClick={() => setEditingFollowUp({ id: Date.now(), date: '', riskId: '', actionId: '', notes: '' })} className="bg-yellow-100 text-yellow-800 font-bold py-2 px-4 rounded-lg hover:bg-yellow-200 transition-colors text-sm flex items-center gap-2" disabled={riskMapContent.risks.length === 0}>
                            <Icon name="plus" /> Adicionar Acompanhamento
                        </button>
                    </div>
                    <p className="text-sm text-slate-500 italic mb-4">{"<Espaço para registro e acompanhamento das ações de tratamento dos riscos, que poderá conter eventos relevantes relacionados ao gerenciamento de riscos, conforme exemplo abaixo>."}</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Data</th>
                                    <th scope="col" className="px-4 py-3">ID Risco</th>
                                    <th scope="col" className="px-4 py-3">ID Ação</th>
                                    <th scope="col" className="px-4 py-3">Registro e Acompanhamento</th>
                                    <th scope="col" className="px-4 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {riskMapContent.followUps.map((follow) => (
                                    <tr key={follow.id} className="bg-white border-b">
                                        <td className="px-4 py-2">{follow.date}</td>
                                        <td className="px-4 py-2">{follow.riskId}</td>
                                        <td className="px-4 py-2">{follow.actionId}</td>
                                        <td className="px-4 py-2">{follow.notes}</td>
                                        <td className="px-4 py-2 text-center">
                                            <button onClick={() => setEditingFollowUp(follow)} className="text-blue-600 hover:text-blue-800 p-1"><Icon name="pencil-alt" /></button>
                                            <button onClick={() => handleRiskMapChange('followUps', riskMapContent.followUps.filter(f => f.id !== follow.id))} className="text-red-600 hover:text-red-800 p-1"><Icon name="trash" /></button>
                                        </td>
                                    </tr>
                                ))}
                                {riskMapContent.followUps.length === 0 && (
                                    <tr><td colSpan={5} className="text-center italic text-slate-400 py-4">Nenhum acompanhamento adicionado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Assinaturas */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b">Responsáveis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-slate-700 mb-2">Elaborado por:</h3>
                            <div className="space-y-3">
                                <input type="text" placeholder="Nome do Responsável" value={riskMapContent.preparedBy.name} onChange={e => handleRiskMapChange('preparedBy', {...riskMapContent.preparedBy, name: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"/>
                                <input type="text" placeholder="Cargo" value={riskMapContent.preparedBy.role} onChange={e => handleRiskMapChange('preparedBy', {...riskMapContent.preparedBy, role: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"/>
                                <input type="text" placeholder="Matrícula" value={riskMapContent.preparedBy.registration} onChange={e => handleRiskMapChange('preparedBy', {...riskMapContent.preparedBy, registration: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"/>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-700 mb-2">Aprovado por:</h3>
                            <div className="space-y-3">
                                <input type="text" placeholder="Nome do Responsável" value={riskMapContent.approvedBy.name} onChange={e => handleRiskMapChange('approvedBy', {...riskMapContent.approvedBy, name: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"/>
                                <input type="text" placeholder="Cargo" value={riskMapContent.approvedBy.role} onChange={e => handleRiskMapChange('approvedBy', {...riskMapContent.approvedBy, role: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"/>
                                <input type="text" placeholder="Matrícula" value={riskMapContent.approvedBy.registration} onChange={e => handleRiskMapChange('approvedBy', {...riskMapContent.approvedBy, registration: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Salvar Mapa de Riscos */}
                <div className="fixed bottom-[5.5rem] md:bottom-auto left-0 right-0 z-10 bg-white/90 backdrop-blur-sm p-4 border-t border-slate-200 md:relative md:bg-transparent md:p-0 md:border-none md:mt-6" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'}}>
                    <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
                        <span className="hidden md:block text-sm text-slate-500 italic mr-auto transition-colors">{autoSaveStatus}</span>
                        <button onClick={handleClearForm('mapa-riscos')} className="bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-2">
                            <Icon name="eraser" /> Limpar
                        </button>
                        <button onClick={() => handleSaveDocument('mapa-riscos')} className="bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-700 transition-colors shadow-md flex items-center justify-center gap-2">
                            <Icon name="save" /> Salvar Mapa
                        </button>
                    </div>
                </div>
            </div>

            <div className={`${activeView === 'tr' ? 'block' : 'hidden'}`}>
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <h2 className="text-lg font-semibold text-slate-700 mb-3">Carregar Documentos para Contexto</h2>
                    <p className="text-sm text-slate-500 mb-4">Selecione documentos salvos para fornecer contexto à IA na geração do Termo de Referência (TR).</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="etp-selector" className="block text-sm font-medium text-slate-600 mb-1">1. Estudo Técnico Preliminar (ETP)</label>
                            <select
                                id="etp-selector"
                                onChange={(e) => handleLoadEtpForTr(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                defaultValue=""
                            >
                                <option value="">-- Selecione um ETP --</option>
                                {savedETPs.map(etp => (
                                    <option key={etp.id} value={etp.id}>{etp.name}</option>
                                ))}
                            </select>
                            {loadedEtpForTr && (
                                <div className="mt-2 p-2 text-xs bg-green-50 text-green-800 border-l-4 border-green-500 rounded-r-lg">
                                    <p className="font-semibold">ETP "{loadedEtpForTr.name}" carregado.</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="riskmap-selector" className="block text-sm font-medium text-slate-600 mb-1">2. Mapa de Riscos</label>
                            <select
                                id="riskmap-selector"
                                onChange={(e) => handleLoadRiskMapForTr(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500"
                                defaultValue=""
                            >
                                <option value="">-- Selecione um Mapa de Risco --</option>
                                {savedRiskMaps.map(map => (
                                    <option key={map.id} value={map.id}>{map.name}</option>
                                ))}
                            </select>
                             {loadedRiskMapForTr && (
                                <div className="mt-2 p-2 text-xs bg-green-50 text-green-800 border-l-4 border-green-500 rounded-r-lg">
                                    <p className="font-semibold">Mapa "{loadedRiskMapForTr.name}" carregado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {trSections.map(section => {
                  if (section.isAttachmentSection) {
                    return (
                        <div key={section.id} className="bg-white p-6 rounded-xl shadow-sm mb-6 transition-all hover:shadow-md">
                            <div className="flex justify-between items-center mb-3 flex-wrap gap-y-3">
                                 <div className="flex items-center gap-2">
                                    <label className="block text-lg font-semibold text-slate-700">{section.title}</label>
                                    {section.tooltip && <Icon name="question-circle" className="text-slate-400 cursor-help" title={section.tooltip} />}
                                 </div>
                                 <button
                                    onClick={handleImportEtpAttachments}
                                    disabled={!loadedEtpForTr}
                                    className="px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Importar todos os anexos do ETP carregado"
                                 >
                                    <Icon name="file-import" className="mr-2" />
                                    Importar do ETP
                                 </button>
                            </div>
                            <textarea
                                id={section.id}
                                value={trSectionsContent[section.id] || ''}
                                onChange={(e) => handleSectionChange('tr', section.id, e.target.value)}
                                placeholder={section.placeholder}
                                className="w-full h-24 p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:border-blue-500 transition-colors border-slate-200 focus:ring-blue-500 mb-4"
                            />
                            
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
                        isLoading={loadingSection === section.id}
                        onAnalyze={() => handleRiskAnalysis('tr', section.id, section.title)}
                        hasRiskAnalysis={section.hasRiskAnalysis}
                        onEdit={() => handleOpenEditModal('tr', section.id, section.title)}
                        hasError={validationErrors.has(section.id)}
                        tooltip={section.tooltip}
                    />
                  );
                })}
                <div className="fixed bottom-[5.5rem] md:bottom-auto left-0 right-0 z-10 bg-white/90 backdrop-blur-sm p-4 border-t border-slate-200 md:relative md:bg-transparent md:p-0 md:border-none md:mt-6" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'}}>
                    <div className="grid grid-cols-3 gap-3 md:flex md:items-center">
                        <span className="hidden md:block text-sm text-slate-500 italic mr-auto transition-colors">{autoSaveStatus}</span>
                        <button onClick={handleClearForm('tr')} className="bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-2">
                            <Icon name="eraser" /> Limpar
                        </button>
                         <button 
                            onClick={handleComplianceCheck}
                            disabled={isCheckingCompliance}
                            className="bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Icon name="check-double" /> {isCheckingCompliance ? 'A verificar...' : 'Verificar'}
                        </button>
                        <button onClick={() => handleSaveDocument('tr')} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2">
                            <Icon name="save" /> Salvar TR
                        </button>
                    </div>
                </div>
            </div>

             <footer className="text-center mt-8 pt-6 border-t border-slate-200 text-slate-500 text-sm">
                <a href="https://wa.me/5584999780963" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                    Desenvolvido por Danilo Arruda
                </a>
            </footer>
          </main>
      </div>

      <Modal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title="Sobre o TR Genius" maxWidth="max-w-2xl">
          <div className="space-y-4 text-slate-600">
              <p>O <b>TR Genius</b> é o seu assistente inteligente para a elaboração de documentos de contratação pública, totalmente alinhado com a Nova Lei de Licitações e Contratos (Lei 14.133/21).</p>
                <ul className="list-none space-y-2">
                    <li className="flex items-start"><Icon name="wand-magic-sparkles" className="text-blue-500 mt-1 mr-3" /> <div><b>Geração de ETP e TR com IA:</b> Crie secções inteiras dos seus documentos com um clique, com base no contexto que fornecer.</div></li>
                    <li className="flex items-start"><Icon name="shield-alt" className="text-blue-500 mt-1 mr-3" /> <div><b>Análise de Riscos:</b> Identifique e mitigue potenciais problemas no seu projeto antes mesmo de ele começar.</div></li>
                    <li className="flex items-start"><Icon name="check-double" className="text-blue-500 mt-1 mr-3" /> <div><b>Verificador de Conformidade:</b> Garanta que os seus Termos de Referência estão em conformidade com a legislação vigente.</div></li>
                    <li className="flex items-start"><Icon name="file-alt" className="text-blue-500 mt-1 mr-3" /> <div><b>Contexto com Ficheiros:</b> Faça o upload de documentos para que a IA tenha um conhecimento ainda mais aprofundado sobre a sua necessidade específica.</div></li>
                </ul>
              <p>Esta ferramenta foi projetada para otimizar o seu tempo, aumentar a qualidade dos seus documentos e garantir a segurança jurídica das suas contratações.</p>
          </div>
      </Modal>

      <Modal 
        isOpen={isPreviewModalOpen} 
        onClose={() => {
          setIsPreviewModalOpen(false);
          setViewingAttachment(null);
          setSummaryState({ loading: false, content: null });
        }} 
        title="Pré-visualização do Documento" 
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end">
            <button
              onClick={handleExportToPDF}
              className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Icon name="file-pdf" className="mr-2" /> Exportar para PDF
            </button>
          </div>
        }
      >
          {renderPreviewContent()}
      </Modal>
      
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={`Editar: ${editingContent?.title}`} maxWidth="max-w-3xl">
        {editingContent && (
          <div>
            <textarea
              value={editingContent.text}
              onChange={(e) => setEditingContent({ ...editingContent, text: e.target.value })}
              className="w-full h-64 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors mb-4"
              disabled={isRefining}
            />
            <div className="bg-slate-100 p-4 rounded-lg mb-4">
              <label htmlFor="refine-prompt" className="block text-sm font-semibold text-slate-600 mb-2">Peça à IA para refinar o texto acima:</label>
              <div className="flex gap-2">
                <input
                  id="refine-prompt"
                  type="text"
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder="Ex: 'Torne o tom mais formal' ou 'Adicione um parágrafo sobre sustentabilidade'"
                  className="flex-grow p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  disabled={isRefining}
                />
                <button
                  onClick={handleRefineText}
                  disabled={!refinePrompt || isRefining}
                  className="bg-purple-600 text-white font-bold py-2 px-3 md:px-4 rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
                >
                  <Icon name="wand-magic-sparkles" className="md:mr-2" />
                  <span className="hidden md:inline">
                    {isRefining ? 'A refinar...' : 'Assim mas...'}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeEditModal} className="bg-transparent border border-slate-400 text-slate-600 font-bold py-2 px-4 rounded-lg hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveChanges} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                <Icon name="save" className="mr-2" /> Salvar Alterações
              </button>
            </div>
          </div>
        )}
    </Modal>

      <Modal isOpen={!!analysisContent.content} onClose={() => setAnalysisContent({title: '', content: null})} title={analysisContent.title} maxWidth="max-w-3xl">
          <div className="bg-slate-50 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
            <ContentRenderer text={analysisContent.content} />
          </div>
      </Modal>

      <Modal
        isOpen={isComplianceModalOpen}
        onClose={() => setIsComplianceModalOpen(false)}
        title="Relatório de Conformidade - Lei 14.133/21"
        maxWidth="max-w-3xl"
      >
        {isCheckingCompliance && !complianceCheckResult.startsWith("Erro") ? (
          <div className="flex items-center justify-center flex-col gap-4 p-8">
              <Icon name="spinner" className="fa-spin text-4xl text-blue-600" />
              <p className="text-slate-600 font-semibold">A IA está a analisar o seu documento... Por favor, aguarde.</p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-lg max-h-[60vh] overflow-y-auto">
              <ContentRenderer text={complianceCheckResult} />
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button onClick={() => setIsComplianceModalOpen(false)} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">Fechar</button>
        </div>
      </Modal>

      <Modal 
        isOpen={!!historyModalContent} 
        onClose={() => setHistoryModalContent(null)} 
        title={`Histórico de: ${historyModalContent?.name}`}
        maxWidth="max-w-6xl"
      >
        {historyModalContent && <HistoryViewer document={historyModalContent} allSections={[...etpSections, ...trSections]} />}
      </Modal>

    <Modal isOpen={isNewDocModalOpen} onClose={() => setIsNewDocModalOpen(false)} title="Criar Novo Documento" maxWidth="max-w-4xl">
      <div className="space-y-4">
        <p className="text-slate-600 mb-6">Comece com um template pré-definido para agilizar o seu trabalho ou crie um documento em branco.</p>
        
        {/* ETP Templates */}
        <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-800 mb-3 border-b-2 border-blue-200 pb-2">Estudo Técnico Preliminar (ETP)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <button 
                    onClick={() => handleCreateNewDocument('etp')}
                    className="w-full text-left p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border-2 border-dashed border-slate-300 flex flex-col justify-between h-full"
                >
                    <div>
                        <div className="flex items-center gap-3">
                            <Icon name="file-alt" className="text-slate-500 text-xl" />
                            <p className="font-bold text-slate-700">Documento em Branco</p>
                        </div>
                        <p className="text-sm text-slate-500 mt-2 pl-8">Comece um ETP do zero.</p>
                    </div>
                </button>
                {etpTemplates.map((template, index) => (
                    <button 
                        key={template.id}
                        onClick={() => handleCreateFromTemplate(template)}
                        className={`w-full text-left p-4 rounded-lg transition-colors border flex flex-col justify-between h-full ${etpTemplateColors[index % etpTemplateColors.length]}`}
                    >
                        <div>
                            <div className="flex items-center gap-3">
                                <Icon name="file-alt" className="text-current text-xl opacity-70" />
                                <p className="font-bold">{template.name}</p>
                            </div>
                            <p className="text-sm opacity-90 mt-2 pl-8">{template.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* TR Templates */}
        <div>
            <h3 className="text-lg font-bold text-purple-800 mb-3 border-b-2 border-purple-200 pb-2">Termo de Referência (TR)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <button 
                    onClick={() => handleCreateNewDocument('tr')}
                    className="w-full text-left p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border-2 border-dashed border-slate-300 flex flex-col justify-between h-full"
                >
                    <div>
                        <div className="flex items-center gap-3">
                            <Icon name="file-alt" className="text-slate-500 text-xl" />
                            <p className="font-bold text-slate-700">Documento em Branco</p>
                        </div>
                        <p className="text-sm text-slate-500 mt-2 pl-8">Comece um TR do zero.</p>
                    </div>
                </button>
                {trTemplates.map((template, index) => (
                    <button 
                        key={template.id}
                        onClick={() => handleCreateFromTemplate(template)}
                        className={`w-full text-left p-4 rounded-lg transition-colors border flex flex-col justify-between h-full ${trTemplateColors[index % trTemplateColors.length]}`}
                    >
                        <div>
                            <div className="flex items-center gap-3">
                                <Icon name="wrench" className="text-current text-xl opacity-70" />
                                <p className="font-bold">{template.name}</p>
                            </div>
                            <p className="text-sm opacity-90 mt-2 pl-8">{template.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </div>
    </Modal>
    
    <Modal 
      isOpen={isRagPreviewModalOpen} 
      onClose={() => {
        setIsRagPreviewModalOpen(false);
        setViewingAttachment(null);
      }} 
      title={`Pré-visualização: ${viewingAttachment?.name}`}
      maxWidth="max-w-4xl"
    >
      { viewingAttachment && (
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
    
    <Modal
        isOpen={!!generatedContentModal}
        onClose={() => setGeneratedContentModal(null)}
        title={`Conteúdo Gerado por IA para: ${generatedContentModal?.title}`}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setGeneratedContentModal(null)} className="bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => {
                if (generatedContentModal) {
                  handleSectionChange(generatedContentModal.docType, generatedContentModal.sectionId, generatedContentModal.content);
                  setGeneratedContentModal(null);
                  addNotification('Sucesso', 'O conteúdo foi inserido na seção.', 'success');
                }
              }}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icon name="check" className="mr-2" /> Usar este Texto
            </button>
          </div>
        }
      >
        <div className="bg-slate-50 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
            {generatedContentModal && <ContentRenderer text={generatedContentModal.content} />}
        </div>
      </Modal>

      {/* --- Modals for Risk Map --- */}
      <Modal isOpen={!!editingRevision} onClose={() => setEditingRevision(null)} title={editingRevision?.id ? 'Editar Revisão' : 'Adicionar Revisão'}>
        {editingRevision && (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Data</label>
                    <input type="date" value={editingRevision.date} onChange={e => setEditingRevision({...editingRevision, date: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Versão</label>
                    <input type="text" value={editingRevision.version} onChange={e => setEditingRevision({...editingRevision, version: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Descrição</label>
                    <input type="text" value={editingRevision.description} onChange={e => setEditingRevision({...editingRevision, description: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Fase</label>
                     <select value={editingRevision.phase} onChange={e => setEditingRevision({...editingRevision, phase: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 bg-white p-2">
                        <option value="PC">PC - Planejamento da Contratação</option>
                        <option value="SF">SF - Seleção de Fornecedores</option>
                        <option value="GC">GC - Gestão do Contrato</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Autor</label>
                    <input type="text" value={editingRevision.author} onChange={e => setEditingRevision({...editingRevision, author: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"/>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={() => setEditingRevision(null)} className="bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={handleSaveRevision} className="bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
                </div>
            </div>
        )}
      </Modal>

      <Modal isOpen={!!editingRisk} onClose={() => setEditingRisk(null)} title={riskMapContent.risks.some(r => r.id === editingRisk?.id) ? 'Editar Risco' : 'Adicionar Risco'} maxWidth="max-w-4xl">
         {/* Conteúdo do Modal de Riscos aqui */}
      </Modal>
      
      <Modal isOpen={!!editingFollowUp} onClose={() => setEditingFollowUp(null)} title={editingFollowUp?.id ? 'Editar Acompanhamento' : 'Adicionar Acompanhamento'}>
        {editingFollowUp && (
             <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Data</label>
                    <input type="date" value={editingFollowUp.date} onChange={e => setEditingFollowUp({...editingFollowUp, date: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">ID do Risco</label>
                     <select value={editingFollowUp.riskId} onChange={e => setEditingFollowUp({...editingFollowUp, riskId: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 bg-white p-2">
                         <option value="">Selecione um Risco</option>
                        {riskMapContent.risks.map(risk => <option key={risk.id} value={risk.id}>{risk.id} - {risk.risk}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">ID da Ação</label>
                    <input type="text" value={editingFollowUp.actionId} onChange={e => setEditingFollowUp({...editingFollowUp, actionId: e.target.value})} placeholder="Ex: P1, C2" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Registro e Acompanhamento</label>
                    <textarea value={editingFollowUp.notes} onChange={e => setEditingFollowUp({...editingFollowUp, notes: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500" rows={4}/>
                </div>
                 <div className="flex justify-end gap-3 pt-4">
                    <button onClick={() => setEditingFollowUp(null)} className="bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={handleSaveFollowUp} className="bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
                </div>
             </div>
        )}
      </Modal>


    {/* Floating Action Button for Mobile */}
    <div className="md:hidden fixed right-6 z-40" style={{ bottom: 'calc(10.5rem + env(safe-area-inset-bottom))' }}>
      <button
        onClick={() => setIsNewDocModalOpen(true)}
        className="bg-pink-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-pink-700 transition-transform transform hover:scale-110"
        title="Criar Novo Documento"
        aria-haspopup="dialog"
      >
        <Icon name="plus" />
      </button>
    </div>

    {installPrompt && isInstallBannerVisible && (
        <InstallPWA
            onInstall={handleInstallClick}
            onDismiss={handleDismissInstallBanner}
        />
    )}

    {/* Notifications Container */}
    <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
    </div>

    {/* Mobile Bottom Navigation */}
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-white/80 p-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] backdrop-blur-md border-t border-slate-200/80 z-20"
      style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom))' }}
    >
        <button onClick={() => switchView('etp')} className={`flex flex-col items-center justify-center rounded-full w-20 h-14 transition-colors ${activeView === 'etp' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Icon name="file-alt" className="text-2xl mb-0.5" />
            <span className="text-xs font-semibold">ETP</span>
        </button>
        <button onClick={() => switchView('mapa-riscos')} className={`flex flex-col items-center justify-center rounded-full w-20 h-14 transition-colors ${activeView === 'mapa-riscos' ? 'bg-yellow-50 text-yellow-600' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Icon name="shield-alt" className="text-2xl mb-0.5" />
            <span className="text-xs font-semibold">Riscos</span>
        </button>
        <button onClick={() => switchView('tr')} className={`flex flex-col items-center justify-center rounded-full w-20 h-14 transition-colors ${activeView === 'tr' ? 'bg-purple-50 text-purple-600' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Icon name="gavel" className="text-2xl mb-0.5" />
            <span className="text-xs font-semibold">TR</span>
        </button>
        <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center justify-center rounded-full w-20 h-14 text-slate-500 hover:bg-slate-100 transition-colors">
            <Icon name="bars" className="text-2xl mb-0.5" />
            <span className="text-xs font-semibold">Menu</span>
        </button>
    </div>
    </div>
  );
};

export default App;
