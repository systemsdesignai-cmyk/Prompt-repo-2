import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { IonApp } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { Preferences } from '@capacitor/preferences';
import { App as CapApp } from '@capacitor/app';
import { 
  Folder, FileText, Search, Plus, ChevronRight, 
  Copy, History, Tag, ArrowLeft, Clock, 
  Check, X, Moon, Sun, Trash2, Edit2, AlertTriangle,
  Mic, MicOff, Pin, FilePlus, Camera, ExternalLink, Download,
  LayoutGrid, List, Settings, RefreshCw, Github,
  GitBranch, BookOpen, CloudUpload, CloudDownload, Key, Eye, EyeOff,
} from 'lucide-react';

import { githubGistService } from './githubGistService.js';

import {
  CreateSkillModal, EditSkillModal, SkillDetailModal, SkillList,
} from './SkillsSystem.jsx';
import {
  CreateSequenceModal, EditSequenceModal, SequenceDetailModal, SequenceList,
  generateSeqId,
} from './SequencesSystem.jsx';

// ... (ErrorBoundary and other utils remain same)

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center font-sans">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Rendering Error</h1>
          <p className="text-slate-400 mb-6 text-center max-w-md">An unexpected error occurred. See details below.</p>
          <div className="bg-slate-800 p-4 rounded-xl w-full max-w-2xl overflow-auto border border-slate-700">
            <p className="font-bold text-red-400">{this.state.error && this.state.error.toString()}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- UTILS & ID GENERATION ---
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const getColorClasses = (colorName) => {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
    green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/50',
    gold: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50',
  };
  return colors[colorName] || colors.slate;
};

const formatDate = (isoString) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'Unknown Date';
  }
};

const hideScrollbarStyle = { msOverflowStyle: 'none', scrollbarWidth: 'none' };

// --- MOCK DATABASE ---
const MOCK_FOLDERS = [
  { id: 'f1', name: 'Websites', parentId: null, color: 'blue' },
  { id: 'f2', name: 'Source Code', parentId: null, color: 'slate' },
  { id: 'f3', name: 'Live Coding', parentId: null, color: 'green' },
  { id: 'f4', name: 'UI Prompts', parentId: 'f1', color: 'blue' },
  { id: 'f5', name: 'Frontend', parentId: 'f1', color: 'orange' },
];

const MOCK_PROMPTS = [
  { 
    id: 'p1', title: 'React Native Component Generator', folderId: 'f2', 
    colorLabel: 'orange', tags: ['frontend', 'react'], isPinned: true,
    currentVersion: 4, lastUpdated: '2026-05-14T10:30:00Z',
    content: 'Act as an expert React Native developer. Generate a highly reusable, performant functional component using Tailwind CSS for styling. Include prop types, loading states, and error handling. Context: [INSERT CONTEXT]'
  },
  { 
    id: 'p2', title: 'UX Persona Architect', folderId: 'f4', 
    colorLabel: 'purple', tags: ['ux', 'research'], isPinned: false,
    currentVersion: 2, lastUpdated: '2026-05-10T14:20:00Z',
    content: 'Create 3 detailed user personas for a [INSERT PRODUCT TYPE]. Include demographics, pain points, goals, and their primary technology stack. Format as a markdown table.'
  }
];

const MOCK_REFERENCES = [
  { id: 'r1', folderId: 'f1', type: 'link', title: 'React Native Docs', url: 'https://reactnative.dev' },
  { id: 'r2', folderId: 'f4', type: 'image', title: 'UI Dashboard Inspiration', url: 'https://picsum.photos/600/400' },
];

const MOCK_VERSIONS = [
  { id: 'v4', promptId: 'p1', versionNum: 4, timestamp: '2026-05-14T10:30:00Z', changeNote: 'Added requirement for loading and error states.', changeReason: 'The previous component lacked error handling causing app crashes.', content: 'Act as an expert React Native developer. Generate a highly reusable, performant functional component using Tailwind CSS for styling. Include prop types, loading states, and error handling. Context: [INSERT CONTEXT]' },
  { id: 'v3', promptId: 'p1', versionNum: 3, timestamp: '2026-04-20T09:00:00Z', changeNote: 'Switched to Tailwind CSS requirement.', changeReason: 'Standardizing all components to use Tailwind framework.', content: 'Act as an expert React Native developer. Generate a highly reusable functional component using Tailwind CSS. Include prop types. Context: [INSERT CONTEXT]' },
  { id: 'v2', promptId: 'p1', versionNum: 2, timestamp: '2026-03-15T11:20:00Z', changeNote: 'Added prop types instruction.', changeReason: 'Needed stricter type checking for props.', content: 'Act as an expert React Native developer. Generate a highly reusable functional component. Include prop types. Context: [INSERT CONTEXT]' },
  { id: 'v1', promptId: 'p1', versionNum: 1, timestamp: '2026-01-10T14:00:00Z', changeNote: 'Initial prompt creation.', changeReason: 'Initial setup.', content: 'Act as an expert React Native developer. Generate a functional component. Context: [INSERT CONTEXT]' },
  { id: 'v2_p2', promptId: 'p2', versionNum: 2, timestamp: '2026-05-10T14:20:00Z', changeNote: 'Forced markdown table format for better readability.', changeReason: 'Output was too messy in paragraph form.', content: 'Create 3 detailed user personas for a [INSERT PRODUCT TYPE]. Include demographics, pain points, goals, and their primary technology stack. Format as a markdown table.' },
  { id: 'v1_p2', promptId: 'p2', versionNum: 1, timestamp: '2026-02-05T09:10:00Z', changeNote: 'Initial draft', changeReason: 'Initial setup.', content: 'Create 3 detailed user personas for a [INSERT PRODUCT TYPE]. Include demographics, pain points, and goals.' },
];

const MOCK_SEQUENCES = [
  {
    id: 'seq1',
    title: 'Landing Page Generation',
    goal: 'Generate a complete frontend landing page from scratch',
    description: 'A structured workflow for creating production-ready landing pages',
    tags: ['frontend', 'landing-page', 'ui'],
    folderId: 'f1',
    colorLabel: 'blue',
    status: 'active',
    isPinned: false,
    currentVersion: 1,
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-05-14T10:00:00Z',
    steps: [
      {
        id: 'step1_1', stepNumber: 1, title: 'Define UX Personas',
        promptMode: 'linked', linkedPromptId: 'p2', inlinePrompt: '',
        references: [], expectedOutput: 'User persona doc with demographics and pain points', notes: '', tags: [],
      },
      {
        id: 'step1_2', stepNumber: 2, title: 'Generate Component Structure',
        promptMode: 'linked', linkedPromptId: 'p1', inlinePrompt: '',
        references: [], expectedOutput: 'React component tree for the landing page', notes: '', tags: [],
      },
    ],
    notes: '',
    linkedSkillIds: [],
    linkedPromptIds: ['p1', 'p2'],
  },
];

const MOCK_SKILLS = [
  {
    id: 'skill1',
    title: 'React Native Best Practices',
    description: 'Comprehensive methodology for building performant React Native applications',
    category: 'Frontend Design',
    markdownContent: '# React Native Best Practices\n\n## Component Architecture\n\n- Use functional components with hooks\n- Keep components small and focused\n- Separate business logic from UI\n\n## Performance\n\n- Use FlatList for long lists\n- Memoize expensive computations with useMemo\n- Avoid inline function definitions in render\n\n## Styling\n\n- Use StyleSheet.create for performance\n- Consider NativeWind for Tailwind-style classes\n- Test on both iOS and Android',
    tags: ['react-native', 'mobile', 'performance'],
    folderId: null,
    colorLabel: 'orange',
    isPinned: true,
    currentVersion: 1,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-14T10:00:00Z',
    notes: '',
    linkedPromptIds: ['p1'],
    linkedSequenceIds: [],
    references: [],
  },
];

const APP_STATE_KEY = 'prompt_repository_state_v2';
const GITHUB_TOKEN_KEY = 'gist-sync-token';
const GIST_ID_KEY = 'gist-sync-id';
const AUTO_SYNC_PUSH_KEY = 'gist-auto-sync-push';
const AUTO_SYNC_PULL_ON_START_KEY = 'gist-auto-sync-pull-on-start';
const AUTO_SYNC_DEBOUNCE_MS = 2500;

const DEFAULT_APP_STATE = {
  settings: {
    isDarkMode: true,
    viewMode: 'list',
  },
  folders: MOCK_FOLDERS,
  prompts: MOCK_PROMPTS,
  versions: [
    ...MOCK_VERSIONS,
    { id: 'vs_seq1', entityType: 'sequence', entityId: 'seq1', versionNum: 1, timestamp: '2026-05-10T10:00:00Z', changeNote: 'Initial sequence creation.', changeReason: 'Initial setup.' },
    { id: 'vs_skill1', entityType: 'skill', entityId: 'skill1', versionNum: 1, timestamp: '2026-05-01T10:00:00Z', changeNote: 'Initial skill creation.', changeReason: 'Initial setup.' },
  ],
  references: MOCK_REFERENCES,
  sequences: MOCK_SEQUENCES,
  skills: MOCK_SKILLS,
  uiState: {
    activeFolderId: null,
    searchQuery: '',
    activeContentType: 'all',
  }
};

const safeParseState = (raw) => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Migrate v1 versions: add entityType/entityId from promptId
    const rawVersions = Array.isArray(parsed?.versions) ? parsed.versions : DEFAULT_APP_STATE.versions;
    const versions = rawVersions.map((v) =>
      v.entityType ? v : { ...v, entityType: 'prompt', entityId: v.promptId }
    );
    return {
      settings: parsed?.settings ?? DEFAULT_APP_STATE.settings,
      folders: Array.isArray(parsed?.folders) ? parsed.folders : DEFAULT_APP_STATE.folders,
      prompts: Array.isArray(parsed?.prompts) ? parsed.prompts : DEFAULT_APP_STATE.prompts,
      versions,
      references: Array.isArray(parsed?.references) ? parsed.references : DEFAULT_APP_STATE.references,
      sequences: Array.isArray(parsed?.sequences) ? parsed.sequences : DEFAULT_APP_STATE.sequences,
      skills: Array.isArray(parsed?.skills) ? parsed.skills : DEFAULT_APP_STATE.skills,
      uiState: {
        activeFolderId: parsed?.uiState?.activeFolderId ?? null,
        searchQuery: parsed?.uiState?.searchQuery ?? '',
        activeContentType: parsed?.uiState?.activeContentType ?? 'all',
      },
    };
  } catch (err) {
    console.error('Failed to parse persisted state:', err);
    return null;
  }
};

// --- SHARED COMPONENTS ---
const Toast = ({ message, isVisible }) => {
  if (!isVisible) return null;
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-[90] text-sm font-medium transition-opacity duration-300 max-w-[calc(100vw-2rem)]">
      <Check size={16} className="text-lime-400 dark:text-lime-500 flex-shrink-0" />
      <span className="truncate max-w-[250px]">{message}</span>
    </div>
  );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-[80] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[92vw] sm:max-w-sm p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-slide-in-right max-h-[calc(100dvh-32px)] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
          <AlertTriangle size={24} />
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors">
            Confirm Action
          </button>
        </div>
      </div>
    </div>
  );
};

// --- NEW FULLSCREEN IMAGE VIEWER MODAL ---
const ImageViewerModal = ({ imageRef, onClose }) => {
  if (!imageRef) return null;

  const handleSaveImage = () => {
    try {
      const link = document.createElement('a');
      link.href = imageRef.url;
      link.download = `${imageRef.title.replace(/\s+/g, '_')}_Reference`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download image. Security settings may be blocking the action.");
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/95 z-[70] flex flex-col animate-fade-in backdrop-blur-md overflow-hidden">
      <div className="flex justify-between items-center p-4 text-white border-b border-slate-800 flex-shrink-0 gap-3">
        <h3 className="font-bold truncate pr-4 text-lg min-w-0 flex-1">{imageRef.title}</h3>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleSaveImage} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-lime-400" title="Save Image">
            <Download size={24} />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-lime-400">
            <X size={24} />
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden min-h-0">
         <img src={imageRef.url} alt={imageRef.title} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl ring-2 ring-lime-500/20" />
      </div>
    </div>
  );
};

// --- MODALS ---
const CreateFolderModal = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');
  const colors = ['blue', 'purple', 'green', 'orange', 'slate', 'cyan', 'gold', 'red'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  };

  return (
    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[92vw] sm:max-w-sm p-5 shadow-2xl border border-slate-100 dark:border-slate-800 animate-slide-in-right max-h-[calc(100dvh-32px)] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">New Folder</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Folder Name</label>
            <input autoFocus value={name} onChange={(e)=>setName(e.target.value)} className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400" placeholder="e.g., UI Components" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Color Label</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-slate-800 dark:border-slate-100 scale-110' : 'border-transparent'} ${getColorClasses(c).split(' ')[0]}`}></button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-lime-400 dark:bg-lime-500 text-slate-900 font-bold py-2.5 rounded-xl mt-2 hover:bg-lime-500 dark:hover:bg-lime-400 transition-colors">Create Folder</button>
        </form>
      </div>
    </div>
  );
};

const CreateReferenceModal = ({ type, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [fileData, setFileData] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (type === 'link' && !url.trim()) return;
    if (type === 'image' && !fileData) return;
    
    const finalUrl = type === 'image' ? fileData : url.trim();
    onSave({ title: title.trim(), url: finalUrl, type });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[92vw] sm:max-w-sm p-5 shadow-2xl border border-slate-100 dark:border-slate-800 animate-slide-in-right max-h-[calc(100dvh-32px)] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Add {type === 'image' ? 'Image' : 'Link'}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Title</label>
            <input autoFocus value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400" placeholder={type === 'image' ? "e.g., UI Mockup Screenshot" : "e.g., Reference design"} />
          </div>
          
          {type === 'link' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">URL / Source</label>
              <input value={url} onChange={(e)=>setUrl(e.target.value)} className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400" placeholder="https://..." />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Upload Image File</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-lime-100 file:text-lime-800 hover:file:bg-lime-200 dark:file:bg-lime-900/40 dark:file:text-lime-400 cursor-pointer transition-colors" 
              />
              {fileData && (
                <div className="mt-3 h-32 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                  <img src={fileData} alt="Preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          )}
          
          <button type="submit" className="w-full bg-lime-400 dark:bg-lime-500 text-slate-900 font-bold py-2.5 rounded-xl mt-2 hover:bg-lime-500 dark:hover:bg-lime-400 transition-colors">Save Reference</button>
        </form>
      </div>
    </div>
  );
};

const EditPromptModal = ({ prompt, onClose, onSave }) => {
  const [title, setTitle] = useState(prompt?.title || '');
  const [content, setContent] = useState(prompt?.content || '');
  const [tags, setTags] = useState(prompt?.tags ? prompt.tags.join(', ') : '');
  const [color, setColor] = useState(prompt?.colorLabel || 'slate');
  const [changeNote, setChangeNote] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const isEditing = !!prompt;
  const colors = ['blue', 'purple', 'green', 'orange', 'slate', 'cyan', 'gold', 'red'];

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const toggleDictation = () => {
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    
    if (!SpeechRecognition) {
      alert("Microphone dictation is not supported in this browser environment. Please type your prompt.");
      return;
    }

    if (isListening) {
      if(recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
          if (finalTranscript) {
            setContent(prev => prev + finalTranscript);
          }
        };
        
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        
        recognition.start();
        setIsListening(true);
        recognitionRef.current = recognition;
      } catch (err) {
        console.error("Speech recognition error:", err);
        setIsListening(false);
        alert("Could not start microphone. Please ensure permissions are granted.");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    if (isEditing && (!changeNote.trim() || !changeReason.trim())) {
      setErrorMsg("Please add a comment explaining what changed and why before saving this version.");
      return;
    }
    
    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    onSave({ 
      title: title.trim(), 
      content: content.trim(), 
      tags: tagsArray, 
      colorLabel: color,
      changeNote: changeNote.trim() || 'Initial prompt creation.',
      changeReason: changeReason.trim() || 'Initial setup.'
    });
  };

  return (
    <div data-testid="prompt-modal" className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[94vw] sm:max-w-lg p-5 shadow-2xl flex flex-col border border-slate-100 dark:border-slate-800 max-h-[calc(100dvh-32px)] animate-slide-in-right overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{isEditing ? 'Edit Prompt' : 'New Prompt'}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1 min-h-0" style={hideScrollbarStyle}>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Prompt Title</label>
            <input autoFocus value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400" placeholder="e.g., Code Refactoring Assistant" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tags (Comma Separated)</label>
            <input value={tags} onChange={(e)=>setTags(e.target.value)} className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400" placeholder="e.g., react, debugging" />
          </div>
          <div className="relative">
            <div className="flex justify-between items-end mb-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Prompt Body</label>
              <button 
                type="button" 
                onClick={toggleDictation}
                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md transition-colors ${isListening ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'}`}
              >
                {isListening ? <Mic size={14} /> : <MicOff size={14} />}
                {isListening ? 'Dictating...' : 'Dictate'}
              </button>
            </div>
            <textarea value={content} onChange={(e)=>setContent(e.target.value)} rows={6} className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 font-mono" placeholder="Act as a..."></textarea>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Color Label</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-slate-800 dark:border-slate-100 scale-110' : 'border-transparent'} ${getColorClasses(c).split(' ')[0]}`}></button>
              ))}
            </div>
          </div>
          
          {isEditing && (
            <div className="bg-lime-50 dark:bg-lime-900/20 p-3 rounded-xl border border-lime-200 dark:border-lime-900/50 mt-2">
              <label className="block text-xs font-bold text-lime-700 dark:text-lime-400 uppercase tracking-wider mb-2">Version Update Details (Required)</label>
              {errorMsg && <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-3">{errorMsg}</p>}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-lime-600 dark:text-lime-500 uppercase tracking-wider mb-1">What Changed?</label>
                  <input value={changeNote} onChange={(e)=>{setChangeNote(e.target.value); setErrorMsg('');}} className="w-full bg-white dark:bg-slate-900 border border-lime-200 dark:border-lime-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400" placeholder="e.g., Added instructions for error handling" required={isEditing} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-lime-600 dark:text-lime-500 uppercase tracking-wider mb-1">Why Did It Change?</label>
                  <input value={changeReason} onChange={(e)=>{setChangeReason(e.target.value); setErrorMsg('');}} className="w-full bg-white dark:bg-slate-900 border border-lime-200 dark:border-lime-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400" placeholder="e.g., Previous output crashed on edge cases" required={isEditing} />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-lime-400 dark:bg-lime-500 text-slate-900 font-bold py-2.5 rounded-xl mt-4 hover:bg-lime-500 dark:hover:bg-lime-400 transition-colors shrink-0">
            {isEditing ? 'Save New Version' : 'Save Prompt'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- MAIN VIEWS ---
const SettingsModal = ({ onClose, appState, setAppState, syncConfig, setSyncConfig }) => {
  const [appInfo, setAppInfo] = useState({ version: '...', build: '...' });
  const [latestRelease, setLatestRelease] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);

  const [githubToken, setGithubToken] = useState(syncConfig.githubToken || '');
  const [gistId, setGistId] = useState(syncConfig.gistId || '');
  const [autoPushEnabled, setAutoPushEnabled] = useState(!!syncConfig.autoPushEnabled);
  const [pullOnStartEnabled, setPullOnStartEnabled] = useState(!!syncConfig.pullOnStartEnabled);
  const [showToken, setShowToken] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const GITHUB_REPO = 'sys-internal-tools/Prompt-repo-2';

  useEffect(() => {
    const getInfo = async () => {
      try {
        const info = await CapApp.getInfo();
        setAppInfo(info);
      } catch (err) {
        console.error('Failed to get app info:', err);
      }
    };
    getInfo();
  }, []);

  const handleSaveSyncSettings = async () => {
    await Preferences.set({ key: GITHUB_TOKEN_KEY, value: githubToken });
    await Preferences.set({ key: GIST_ID_KEY, value: gistId });
    await Preferences.set({ key: AUTO_SYNC_PUSH_KEY, value: autoPushEnabled ? 'true' : 'false' });
    await Preferences.set({ key: AUTO_SYNC_PULL_ON_START_KEY, value: pullOnStartEnabled ? 'true' : 'false' });
    setSyncConfig({ githubToken, gistId, autoPushEnabled, pullOnStartEnabled });
    setSyncMsg({ type: 'success', text: 'Sync settings saved locally.' });
    setTimeout(() => setSyncMsg(null), 3000);
  };

  const handleCloudPush = async () => {
    if (!githubToken) {
      setSyncMsg({ type: 'error', text: 'GitHub Token required for sync.' });
      return;
    }
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      if (gistId) {
        await githubGistService.updateGist(gistId, githubToken, appState);
        setSyncMsg({ type: 'success', text: 'Data pushed to Gist successfully!' });
      } else {
        const gist = await githubGistService.createGist(githubToken, appState);
        setGistId(gist.id);
        await Preferences.set({ key: GIST_ID_KEY, value: gist.id });
        setSyncConfig((prev) => ({ ...prev, githubToken, gistId: gist.id }));
        setSyncMsg({ type: 'success', text: 'New Gist created and data pushed!' });
      }
    } catch (err) {
      console.error('Sync push failed:', err);
      setSyncMsg({ type: 'error', text: `Push failed: ${err.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudPull = async () => {
    if (!githubToken || !gistId) {
      setSyncMsg({ type: 'error', text: 'Token and Gist ID required to pull.' });
      return;
    }
    if (!window.confirm('Pulling from cloud will overwrite your local data. Continue?')) return;
    
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      const data = await githubGistService.fetchGist(gistId, githubToken);
      setAppState(data);
      setSyncMsg({ type: 'success', text: 'Data pulled and restored successfully!' });
    } catch (err) {
      console.error('Sync pull failed:', err);
      setSyncMsg({ type: 'error', text: `Pull failed: ${err.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const checkForUpdate = async () => {
    // TODO: If this repo remains private, implement a secure proxy (e.g. Cloudflare Worker)
    // to hide the GitHub PAT instead of calling the public API directly.
    setIsChecking(true);
    setError(null);
    try {
      // Fetch latest release from GitHub API
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
      if (!response.ok) throw new Error('Failed to fetch latest release');
      
      const data = await response.json();
      // Remove 'mobile-' and 'v' prefixes to get just the version number (e.g., mobile-v1.0.0 -> 1.0.0)
      const latestVersion = data.tag_name.replace('mobile-', '').replace('v', '');
      
      // Basic version comparison
      if (latestVersion !== appInfo.version) {
        setLatestRelease(data);
      } else {
        setTimeout(() => setError("App is already up to date."), 500);
      }
    } catch (err) {
      console.error('Failed to check for update:', err);
      setError("Failed to check GitHub for updates.");
    } finally {
      setIsChecking(false);
    }
  };

  const downloadUpdate = () => {
    if (!latestRelease) return;
    
    // Find the APK asset in the release
    const apkAsset = latestRelease.assets.find(asset => asset.name.endsWith('.apk'));
    const downloadUrl = apkAsset ? apkAsset.browser_download_url : latestRelease.html_url;
    
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[92vw] sm:max-w-sm p-5 shadow-2xl border border-slate-100 dark:border-slate-800 animate-slide-in-right max-h-[calc(100dvh-32px)] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Settings</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><X size={20}/></button>
        </div>
        
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">App Information</p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 dark:text-slate-400">Current Version</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{appInfo.version} ({appInfo.build})</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-slate-600 dark:text-slate-400">Platform</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white capitalize">{Capacitor.getPlatform()}</span>
            </div>
          </div>

          {Capacitor.getPlatform() !== 'web' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Github size={14} className="text-slate-400" />
                <p className="text-xs font-bold text-slate-400 uppercase">GitHub Release</p>
              </div>
              
              {latestRelease ? (
                <div className="bg-lime-50 dark:bg-lime-900/20 border border-lime-200 dark:border-lime-800 p-4 rounded-xl">
                  <p className="text-sm font-bold text-lime-700 dark:text-lime-400 mb-1">Update Available: {latestRelease.tag_name}</p>
                  <p className="text-[10px] text-lime-600 dark:text-lime-500 mb-4 line-clamp-2">{latestRelease.name || 'New version available on GitHub'}</p>
                  <button 
                    onClick={downloadUpdate}
                    className="w-full bg-lime-400 dark:bg-lime-500 text-slate-900 font-bold py-2.5 rounded-xl hover:bg-lime-500 dark:hover:bg-lime-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Download APK
                  </button>
                </div>
              ) : (
                <button 
                  onClick={checkForUpdate}
                  disabled={isChecking}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isChecking ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  {isChecking ? 'Check GitHub for Updates' : 'Check for Updates'}
                </button>
              )}
              {error && <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">{error}</p>}
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-center text-slate-400">Updates are fetched directly from the GitHub repository releases.</p>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <CloudUpload size={16} className="text-slate-400" />
              <p className="text-xs font-bold text-slate-400 uppercase">Gist Cloud Sync</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key size={14} />
                </div>
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="GitHub Personal Access Token"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/20"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                />
                <button 
                  onClick={() => setShowToken(!showToken)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <input
                type="text"
                placeholder="Gist ID (leave empty to create new)"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/20"
                value={gistId}
                onChange={(e) => setGistId(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleCloudPush}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold py-2.5 rounded-xl text-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                  Push
                </button>
                <button 
                  onClick={handleCloudPull}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-xl text-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <CloudDownload size={16} />}
                  Pull
                </button>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    className="mt-1 accent-lime-500"
                    checked={autoPushEnabled}
                    onChange={(e) => setAutoPushEnabled(e.target.checked)}
                  />
                  <span>
                    <span className="block font-bold">Auto-push local changes</span>
                    <span className="block text-[10px] text-slate-400 leading-tight">Uploads changes to the configured Gist after edits settle.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    className="mt-1 accent-lime-500"
                    checked={pullOnStartEnabled}
                    onChange={(e) => setPullOnStartEnabled(e.target.checked)}
                  />
                  <span>
                    <span className="block font-bold">Pull latest on launch</span>
                    <span className="block text-[10px] text-slate-400 leading-tight">Restores the Gist copy when the app starts.</span>
                  </span>
                </label>
              </div>

              <button 
                onClick={handleSaveSyncSettings}
                className="w-full text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
              >
                Save Settings Only
              </button>

              {syncMsg && (
                <p className={`text-center text-[10px] font-bold ${syncMsg.type === 'error' ? 'text-red-500' : 'text-lime-600'}`}>
                  {syncMsg.text}
                </p>
              )}
            </div>
            <p className="text-[10px] text-center text-slate-400 leading-tight">
              Synchronize your data across devices using a private GitHub Gist. Requires a GitHub token with 'gist' scope.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CONTENT_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'sequences', label: 'Sequences' },
  { id: 'skills', label: 'Skills' },
  { id: 'references', label: 'References' },
];

const Header = ({ searchQuery, setSearchQuery, isDarkMode, setIsDarkMode, viewMode, setViewMode, onOpenSettings, activeContentType, setActiveContentType }) => (
  <div className="bg-white dark:bg-slate-900 px-4 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 z-10 flex-shrink-0" style={{ paddingTop: 'calc(var(--safe-top) + 12px)', paddingLeft: 'calc(var(--safe-left) + 16px)', paddingRight: 'calc(var(--safe-right) + 16px)' }}>
    <div className="flex justify-between items-center mb-4 gap-3">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2 min-w-0 flex-1">
        <div className="w-6 h-6 bg-lime-400 dark:bg-lime-500 rounded-md flex items-center justify-center">
          <span className="text-slate-900 text-xs font-black">PR</span>
        </div>
        <span className="truncate">Prompt Repository</span>
      </h1>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button 
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} 
          className="p-2 text-slate-400 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          title={`Switch to ${viewMode === 'grid' ? 'List' : 'Grid'} View`}
        >
          {viewMode === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
        </button>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className="p-2 text-slate-400 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button 
          onClick={onOpenSettings} 
          className="p-2 text-slate-400 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
    
    <div className="relative mb-3">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
      <input 
        type="text" 
        placeholder="Search prompts, sequences, skills, tags…" 
        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 text-sm transition-colors"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>

    {/* Content-type filter pills */}
    <div className="flex gap-2 overflow-x-auto pb-0.5" style={hideScrollbarStyle}>
      {CONTENT_TYPES.map((ct) => (
        <button
          key={ct.id}
          onClick={() => setActiveContentType(ct.id)}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            activeContentType === ct.id
              ? 'bg-lime-400 dark:bg-lime-500 text-slate-900'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {ct.label}
        </button>
      ))}
    </div>
  </div>
);

const Breadcrumbs = ({ searchQuery, activeFolderId, setActiveFolderId, breadcrumbs }) => {
  if (searchQuery) return null;
  return (
    <div className="px-4 py-3 flex items-center gap-1 overflow-x-auto whitespace-nowrap bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-sm transition-colors flex-shrink-0" style={hideScrollbarStyle}>
      <button 
        onClick={() => setActiveFolderId(null)}
        className={`font-medium ${activeFolderId === null ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 hover:text-lime-600 dark:hover:text-lime-400 transition-colors'}`}
      >
        Home
      </button>
      {breadcrumbs.map((crumb, idx) => (
        <React.Fragment key={crumb.id}>
          <ChevronRight size={14} className="text-slate-400 dark:text-slate-600 flex-shrink-0" />
          <button 
            onClick={() => setActiveFolderId(crumb.id)}
            className={`font-medium transition-colors ${idx === breadcrumbs.length - 1 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 hover:text-lime-600 dark:hover:text-lime-400'}`}
          >
            {crumb.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

const FolderList = ({ currentFolders, setActiveFolderId, searchQuery, onDeleteFolder, onDropPrompt, viewMode }) => {
  const [dragOverId, setDragOverId] = useState(null);

  if (!currentFolders || currentFolders.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {!searchQuery && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 mt-2">Folders</p>}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" : "flex flex-col gap-2"}>
        {currentFolders.map(folder => {
          const colorCls = getColorClasses(folder.color);
          const isDragOver = dragOverId === folder.id;
          return (
            <div 
              key={folder.id} 
              className="relative group"
              onDragOver={(e) => { e.preventDefault(); setDragOverId(folder.id); }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverId(null);
                try {
                  const promptId = e.dataTransfer.getData('text/plain');
                  if (promptId) onDropPrompt(promptId, folder.id);
                } catch(err) { console.error(err); }
              }}
            >
              <button 
                onClick={() => setActiveFolderId(folder.id)}
                className={`w-full bg-white dark:bg-slate-900 border ${isDragOver ? 'border-lime-500 ring-2 ring-lime-200 dark:ring-lime-900/50' : 'border-slate-200 dark:border-slate-800'} rounded-xl p-3 text-left shadow-sm hover:border-slate-300 transition-all flex items-center gap-3 active:scale-95`}
              >
                <div className={`p-2 rounded-lg ${colorCls} bg-opacity-20`}>
                  <Folder size={18} />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-200 text-sm truncate pr-6">{folder.name}</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder); }} className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  );
};

const ReferenceList = ({ currentReferences, onDeleteReference, onViewImage, viewMode }) => {
  if (!currentReferences || currentReferences.length === 0) return null;
  return (
    <div className="space-y-2 pt-2">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Assets & References</p>
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" : "flex flex-col gap-2"}>
        {currentReferences.map(ref => (
          <div key={ref.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex items-center justify-between group">
            {ref.type === 'image' ? (
              <button onClick={() => onViewImage(ref)} className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden hover:opacity-80 transition-opacity text-left">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <img src={ref.url} alt={ref.title} className="w-full h-full object-cover" />
                </div>
                <div className="truncate pr-4 flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{ref.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Tap to expand image</p>
                </div>
              </button>
            ) : (
              <a href={ref.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden hover:opacity-80 transition-opacity">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 flex-shrink-0">
                  <ExternalLink size={16} />
                </div>
                <div className="truncate pr-4 flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{ref.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ref.url}</p>
                </div>
              </a>
            )}
            <button onClick={() => onDeleteReference(ref)} className="p-2 flex-shrink-0 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const PromptList = ({ currentPrompts, searchQuery, setSelectedPrompt, handleCopy, onTogglePin, viewMode }) => {
  if (!currentPrompts || (currentPrompts.length === 0 && !searchQuery)) return null;
  
  return (
    <div className="space-y-2 pt-2">
      {!searchQuery && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Prompts (Drag to move)</p>}
      
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col gap-2"}>
        {currentPrompts.map(prompt => {
          const colorCls = getColorClasses(prompt.colorLabel);
          return (
            <div 
              key={prompt.id}
              draggable
              onDragStart={(e) => {
                try { e.dataTransfer.setData('text/plain', prompt.id); } catch(err) {}
              }}
              onClick={() => setSelectedPrompt(prompt)}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-lime-400 dark:hover:border-lime-500 transition-all cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 group ${viewMode === 'grid' ? 'flex flex-col h-full' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-tight pr-4 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{prompt.title}</h3>
                <div className="flex gap-1 flex-shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onTogglePin(prompt.id); }}
                    className="p-1.5 text-slate-300 hover:text-lime-500 dark:text-slate-600 dark:hover:text-lime-400 rounded-md transition-colors"
                  >
                    <Pin size={16} className={prompt.isPinned ? "fill-lime-500 text-lime-500 dark:fill-lime-400 dark:text-lime-400" : ""} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCopy(prompt.content); }}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 rounded-md transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <p className={`text-sm text-slate-500 dark:text-slate-400 mb-3 leading-relaxed font-mono text-xs ${viewMode === 'grid' ? 'line-clamp-4 flex-1' : 'line-clamp-2'}`}>{prompt.content}</p>
              <div className="flex items-center gap-2 flex-wrap mt-auto">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${colorCls}`}>v{prompt.currentVersion}</span>
                {prompt.tags && prompt.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1"><Tag size={10} /> {tag}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

const PromptDetailModal = ({ 
  selectedPrompt, setSelectedPrompt, handleCopy, folders, versions, 
  onTogglePin, onEditRequest, onDeleteRequest, onRestoreVersion, onDuplicateRequest
}) => {
  const [activeTab, setActiveTab] = useState('content');
  const promptVersions = versions.filter(v =>
    (v.entityType === 'prompt' && v.entityId === selectedPrompt.id) ||
    (!v.entityType && v.promptId === selectedPrompt.id)
  ).sort((a, b) => b.versionNum - a.versionNum);

  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-900 z-30 flex flex-col animate-slide-in-right overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 gap-2">
        <button onClick={() => setSelectedPrompt(null)} className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-1 flex-wrap justify-end min-w-0">
          <button onClick={() => onTogglePin(selectedPrompt.id)} title="Pin to Top" className="p-2 text-slate-400 hover:text-lime-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
            <Pin size={18} className={selectedPrompt.isPinned ? "fill-lime-500 text-lime-500 dark:fill-lime-400 dark:text-lime-400" : ""} />
          </button>
          <button onClick={() => onDuplicateRequest(selectedPrompt)} title="Duplicate Prompt" className="p-2 text-slate-500 hover:text-lime-600 dark:text-slate-400 dark:hover:text-lime-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
            <FilePlus size={18} />
          </button>
          <button onClick={() => onEditRequest(selectedPrompt)} title="Edit Prompt" className="p-2 text-slate-500 hover:text-lime-600 dark:text-slate-400 dark:hover:text-lime-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
            <Edit2 size={18} />
          </button>
          <button onClick={() => onDeleteRequest(selectedPrompt)} title="Delete" className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 min-h-0" style={{ ...hideScrollbarStyle, paddingBottom: 'calc(var(--safe-bottom) + 96px)' }}>
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getColorClasses(selectedPrompt.colorLabel)}`}>{selectedPrompt.colorLabel}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Folder size={12} /> {folders.find(f => f.id === selectedPrompt.folderId)?.name || 'Root'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 leading-tight">{selectedPrompt.title}</h2>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1"><Clock size={14} /> Updated {formatDate(selectedPrompt.lastUpdated)}</span>
            <span className="flex items-center gap-1"><History size={14} /> {promptVersions.length} Versions</span>
          </div>
        </div>

        <div className="flex px-3 sm:px-4 pt-2 border-b border-slate-200 dark:border-slate-800">
          <button onClick={() => setActiveTab('content')} className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'content' ? 'border-lime-500 dark:border-lime-400 text-lime-600 dark:text-lime-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Prompt Body</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 pb-3 text-sm font-semibold border-b-2 flex justify-center gap-2 transition-colors ${activeTab === 'history' ? 'border-lime-500 dark:border-lime-400 text-lime-600 dark:text-lime-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            Version History <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'history' ? 'bg-lime-100 dark:bg-lime-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>{promptVersions.length}</span>
          </button>
        </div>

        <div className="p-3 sm:p-4">
          {activeTab === 'content' ? (
            <div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 relative group overflow-hidden">
                <p className="text-slate-800 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">{selectedPrompt.content}</p>
                <button onClick={() => handleCopy(selectedPrompt.content)} className="absolute top-3 right-3 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-slate-600 hover:text-lime-600 dark:hover:text-lime-400 active:scale-95 transition-colors"><Copy size={16} /></button>
              </div>
              <div className="mt-6">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Tags</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedPrompt.tags && selectedPrompt.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg flex items-center gap-1.5">
                      <Tag size={12} className="text-slate-400" /> {tag}
                    </span>
                  ))}
                  <button onClick={() => onEditRequest(selectedPrompt)} className="px-3 py-1 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-lime-600 dark:hover:text-lime-400 hover:border-lime-400 dark:hover:border-lime-500 transition-colors">+ Add Tag</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-slate-200 dark:bg-slate-800 z-0"></div>
              <div className="space-y-6 relative z-10">
                {promptVersions.map((v, idx) => (
                  <div key={v.id} className="flex gap-4">
                    <div className="flex flex-col items-center pt-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold ${idx === 0 ? 'bg-lime-100 dark:bg-lime-900/40 border-lime-500 dark:border-lime-400 text-lime-700 dark:text-lime-400' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'}`}>v{v.versionNum}</div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm min-w-0">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{formatDate(v.timestamp)}</span>
                        {idx === 0 && <span className="text-[10px] uppercase font-bold tracking-wider text-lime-700 dark:text-lime-400 bg-lime-100 dark:bg-lime-900/30 px-2 py-0.5 rounded">Active</span>}
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 rounded p-3 text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 mb-3 space-y-1">
                        <p><span className="font-semibold text-slate-900 dark:text-slate-100">What:</span> {v.changeNote}</p>
                        {v.changeReason && <p><span className="font-semibold text-slate-900 dark:text-slate-100">Why:</span> {v.changeReason}</p>}
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-900/50 rounded p-3 text-xs text-slate-600 dark:text-slate-400 font-mono line-clamp-2 border border-slate-200 dark:border-slate-700">{v.content}</div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => handleCopy(v.content)} className="text-xs font-semibold text-lime-600 hover:text-lime-800 dark:text-lime-400 dark:hover:text-lime-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-lime-50 dark:hover:bg-lime-900/30 transition-colors"><Copy size={12} /> Copy</button>
                        {idx !== 0 && (
                          <button onClick={() => onRestoreVersion(selectedPrompt, v)} className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><History size={12} /> Restore</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)', paddingLeft: 'calc(var(--safe-left) + 16px)', paddingRight: 'calc(var(--safe-right) + 16px)' }}>
        <button onClick={() => handleCopy(selectedPrompt.content)} className="w-full bg-lime-400 dark:bg-lime-500 text-slate-900 font-bold py-3.5 rounded-xl shadow-md hover:bg-lime-500 dark:hover:bg-lime-400 active:scale-[0.98] transition-colors flex items-center justify-center gap-2 text-sm">
          <Copy size={18} /> Copy Latest Prompt
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP ---
function AppMain() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(DEFAULT_APP_STATE.settings.isDarkMode);
  const [viewMode, setViewMode] = useState(DEFAULT_APP_STATE.settings.viewMode);

  const [folders, setFolders] = useState(DEFAULT_APP_STATE.folders);
  const [prompts, setPrompts] = useState(DEFAULT_APP_STATE.prompts);
  const [references, setReferences] = useState(DEFAULT_APP_STATE.references);
  const [versions, setVersions] = useState(DEFAULT_APP_STATE.versions);
  const [sequences, setSequences] = useState(DEFAULT_APP_STATE.sequences);
  const [skills, setSkills] = useState(DEFAULT_APP_STATE.skills);

  const [activeFolderId, setActiveFolderId] = useState(DEFAULT_APP_STATE.uiState.activeFolderId);
  const [searchQuery, setSearchQuery] = useState(DEFAULT_APP_STATE.uiState.searchQuery);
  const [activeContentType, setActiveContentType] = useState(DEFAULT_APP_STATE.uiState.activeContentType);

  // Helper to set all app state at once (used for Pull)
  const setFullAppState = useCallback((state) => {
    if (!state) return;
    setIsDarkMode(!!state.settings?.isDarkMode);
    setViewMode(state.settings?.viewMode === 'grid' ? 'grid' : 'list');
    setFolders(state.folders || []);
    setPrompts(state.prompts || []);
    setVersions(state.versions || []);
    setReferences(state.references || []);
    setSequences(state.sequences || []);
    setSkills(state.skills || []);
    setActiveFolderId(state.uiState?.activeFolderId ?? null);
    setSearchQuery(state.uiState?.searchQuery ?? '');
    setActiveContentType(state.uiState?.activeContentType ?? 'all');
  }, []);

  const currentAppState = useMemo(() => ({
    settings: { isDarkMode, viewMode },
    folders,
    prompts,
    versions,
    references,
    sequences,
    skills,
    uiState: { activeFolderId, searchQuery, activeContentType },
  }), [isDarkMode, viewMode, folders, prompts, versions, references, sequences, skills, activeFolderId, searchQuery, activeContentType]);

  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);

  const [toastMsg, setToastMsg] = useState('');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [createModalType, setCreateModalType] = useState(null);
  const [promptToEdit, setPromptToEdit] = useState(null);
  const [sequenceToEdit, setSequenceToEdit] = useState(null);
  const [skillToEdit, setSkillToEdit] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [viewingImage, setViewingImage] = useState(null);
  const [syncConfig, setSyncConfig] = useState({
    githubToken: '',
    gistId: '',
    autoPushEnabled: false,
    pullOnStartEnabled: false,
  });
  const [autoSyncMsg, setAutoSyncMsg] = useState('');
  const autoSyncTimerRef = useRef(null);
  const lastCloudSnapshotRef = useRef('');
  const isRemoteApplyRef = useRef(false);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [
          { value },
          { value: token },
          { value: gistId },
          { value: autoPush },
          { value: pullOnStart },
        ] = await Promise.all([
          Preferences.get({ key: APP_STATE_KEY }),
          Preferences.get({ key: GITHUB_TOKEN_KEY }),
          Preferences.get({ key: GIST_ID_KEY }),
          Preferences.get({ key: AUTO_SYNC_PUSH_KEY }),
          Preferences.get({ key: AUTO_SYNC_PULL_ON_START_KEY }),
        ]);
        const nextSyncConfig = {
          githubToken: token || '',
          gistId: gistId || '',
          autoPushEnabled: autoPush === 'true',
          pullOnStartEnabled: pullOnStart === 'true',
        };
        setSyncConfig(nextSyncConfig);
        const state = safeParseState(value);
        lastCloudSnapshotRef.current = JSON.stringify(state || DEFAULT_APP_STATE);
        if (state) {
          setFullAppState(state);
        }
        if (nextSyncConfig.pullOnStartEnabled && nextSyncConfig.githubToken && nextSyncConfig.gistId) {
          try {
            const cloudState = await githubGistService.fetchGist(nextSyncConfig.gistId, nextSyncConfig.githubToken);
            isRemoteApplyRef.current = true;
            setFullAppState(cloudState);
            lastCloudSnapshotRef.current = JSON.stringify(cloudState);
            setAutoSyncMsg('Pulled latest cloud data');
            setTimeout(() => setAutoSyncMsg(''), 3000);
          } catch (err) {
            console.error('Auto pull failed:', err);
            setAutoSyncMsg('Auto pull failed');
            setTimeout(() => setAutoSyncMsg(''), 3000);
          }
        }
      } catch (err) {
        console.error('Failed to hydrate local state:', err);
      } finally {
        setIsHydrated(true);
      }
    };
    hydrate();
  }, [setFullAppState]);

  useEffect(() => {
    if (!isHydrated) return;
    const persist = async () => {
      try {
        await Preferences.set({ key: APP_STATE_KEY, value: JSON.stringify(currentAppState) });
      } catch (err) {
        console.error('Failed to persist local state:', err);
      }
    };
    persist();
  }, [isHydrated, currentAppState]);

  useEffect(() => {
    if (!isHydrated || !syncConfig.autoPushEnabled || !syncConfig.githubToken) return;

    const snapshot = JSON.stringify(currentAppState);
    if (snapshot === lastCloudSnapshotRef.current) {
      isRemoteApplyRef.current = false;
      return;
    }

    if (isRemoteApplyRef.current) {
      isRemoteApplyRef.current = false;
      return;
    }

    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
    }

    autoSyncTimerRef.current = setTimeout(async () => {
      try {
        if (syncConfig.gistId) {
          await githubGistService.updateGist(syncConfig.gistId, syncConfig.githubToken, currentAppState);
          lastCloudSnapshotRef.current = JSON.stringify(currentAppState);
          setAutoSyncMsg('Auto-synced to Gist');
        } else {
          const gist = await githubGistService.createGist(syncConfig.githubToken, currentAppState);
          await Preferences.set({ key: GIST_ID_KEY, value: gist.id });
          setSyncConfig((prev) => ({ ...prev, gistId: gist.id }));
          lastCloudSnapshotRef.current = JSON.stringify(currentAppState);
          setAutoSyncMsg('Created Gist and auto-synced');
        }
      } catch (err) {
        console.error('Auto sync failed:', err);
        setAutoSyncMsg('Auto-sync failed');
      } finally {
        setTimeout(() => setAutoSyncMsg(''), 3000);
      }
    }, AUTO_SYNC_DEBOUNCE_MS);

    return () => {
      if (autoSyncTimerRef.current) {
        clearTimeout(autoSyncTimerRef.current);
      }
    };
  }, [isHydrated, currentAppState, syncConfig]);

  // Data Filtering & Sorting
  const currentFolders = useMemo(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return folders.filter((f) => f.name?.toLowerCase().includes(q));
    }
    return folders.filter(f => f.parentId === activeFolderId);
  }, [activeFolderId, searchQuery, folders]);

  const currentPrompts = useMemo(() => {
    if (activeContentType !== 'all' && activeContentType !== 'prompts') return [];
    let filtered = prompts;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(q) || 
        p.content?.toLowerCase().includes(q) ||
        folders.find((f) => f.id === p.folderId)?.name?.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    } else {
      filtered = filtered.filter(p => p.folderId === activeFolderId);
    }
    return [...filtered].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [activeFolderId, searchQuery, prompts, activeContentType]);

  const currentReferences = useMemo(() => {
    if (activeContentType !== 'all' && activeContentType !== 'references') return [];
    let filtered = references;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title?.toLowerCase().includes(q) ||
        folders.find((f) => f.id === r.folderId)?.name?.toLowerCase().includes(q)
      );
    } else {
      filtered = filtered.filter(r => r.folderId === activeFolderId);
    }
    return filtered;
  }, [activeFolderId, searchQuery, references, folders, activeContentType]);

  const currentSequences = useMemo(() => {
    if (activeContentType !== 'all' && activeContentType !== 'sequences') return [];
    let filtered = sequences;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title?.toLowerCase().includes(q) ||
        s.goal?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(q))) ||
        (s.steps && s.steps.some(step =>
          step.title?.toLowerCase().includes(q) ||
          step.inlinePrompt?.toLowerCase().includes(q)
        ))
      );
    } else if (!searchQuery) {
      filtered = filtered.filter(s => s.folderId === activeFolderId || (!s.folderId && activeFolderId === null));
    }
    return [...filtered].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [activeFolderId, searchQuery, sequences, activeContentType]);

  const currentSkills = useMemo(() => {
    if (activeContentType !== 'all' && activeContentType !== 'skills') return [];
    let filtered = skills;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.markdownContent?.toLowerCase().includes(q) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(q)))
      );
    } else if (!searchQuery) {
      filtered = filtered.filter(s => s.folderId === activeFolderId || (!s.folderId && activeFolderId === null));
    }
    return [...filtered].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [activeFolderId, searchQuery, skills, activeContentType]);

  const breadcrumbs = useMemo(() => {
    const crumbs = [];
    let curr = activeFolderId;
    const visited = new Set();
    
    while (curr) {
      if (visited.has(curr)) break;
      visited.add(curr);
      
      const folder = folders.find(f => f.id === curr);
      if (folder) {
        crumbs.unshift(folder);
        curr = folder.parentId;
      } else {
        break;
      }
    }
    return crumbs;
  }, [activeFolderId, folders]);

  // Robust Copy Functionality
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }, []);

  const handleCopy = useCallback(async (text) => {
    const fallbackCopy = (copyText) => {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = copyText;
        textArea.style.position = "fixed"; 
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showToast('Prompt copied to clipboard');
      } catch (e) {
        showToast('Failed to copy. Try selecting manually.');
      }
    };

    try {
      await Clipboard.write({ string: text });
      showToast('Prompt copied to clipboard');
      return;
    } catch (_) {}

    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Prompt copied to clipboard');
        return;
      } catch (_) {}
    }
    fallbackCopy(text);
  }, [showToast]);

  // Interactions
  const handleTogglePin = useCallback((promptId) => {
    setPrompts((prev) => prev.map((p) => p.id === promptId ? { ...p, isPinned: !p.isPinned } : p));
    setSelectedPrompt((prev) => prev?.id === promptId ? { ...prev, isPinned: !prev.isPinned } : prev);
  }, []);

  const handleDropPrompt = useCallback((promptId, targetFolderId) => {
    setPrompts((prev) => prev.map((p) => p.id === promptId ? { ...p, folderId: targetFolderId } : p));
    showToast('Prompt moved successfully');
  }, [showToast]);

  const handleDuplicatePrompt = useCallback((prompt) => {
    const newId = generateId('p');
    const timestamp = new Date().toISOString();
    
    const newPrompt = { ...prompt, id: newId, title: `${prompt.title} (Copy)`, currentVersion: 1, lastUpdated: timestamp };
    const newVersion = { id: generateId('v'), entityType: 'prompt', entityId: newId, promptId: newId, versionNum: 1, timestamp, changeNote: 'Duplicated from existing prompt.', changeReason: 'User initiated duplicate action.', content: prompt.content };
    
    setPrompts((prev) => [...prev, newPrompt]);
    setVersions((prev) => [...prev, newVersion]);
    showToast('Prompt duplicated');
  }, [showToast]);

  // --- Sequence handlers ---
  const handleCreateSequence = useCallback((data) => {
    const timestamp = new Date().toISOString();
    const seqId = generateSeqId('seq');
    const newSeq = {
      id: seqId,
      folderId: activeFolderId,
      title: data.title,
      goal: data.goal,
      description: data.description || '',
      tags: data.tags || [],
      colorLabel: data.colorLabel || 'blue',
      status: data.status || 'draft',
      isPinned: false,
      currentVersion: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      steps: [],
      notes: '',
      linkedSkillIds: [],
      linkedPromptIds: [],
    };
    const initVersion = {
      id: generateSeqId('sv'),
      entityType: 'sequence',
      entityId: seqId,
      versionNum: 1,
      timestamp,
      changeNote: 'Initial sequence creation.',
      changeReason: 'Initial setup.',
    };
    setSequences((prev) => [...prev, newSeq]);
    setVersions((prev) => [...prev, initVersion]);
    setCreateModalType(null);
    showToast('Sequence created');
  }, [activeFolderId, showToast]);

  const handleSaveSequence = useCallback((data) => {
    const timestamp = new Date().toISOString();
    const newVersionNum = sequenceToEdit.currentVersion + 1;
    const updated = {
      ...sequenceToEdit,
      title: data.title,
      goal: data.goal,
      description: data.description,
      tags: data.tags,
      colorLabel: data.colorLabel,
      status: data.status,
      steps: data.steps,
      notes: data.notes,
      currentVersion: newVersionNum,
      updatedAt: timestamp,
    };
    const newVersionRecord = {
      id: generateSeqId('sv'),
      entityType: 'sequence',
      entityId: sequenceToEdit.id,
      versionNum: newVersionNum,
      timestamp,
      changeNote: data.changeNote,
      changeReason: data.changeReason,
    };
    setSequences((prev) => prev.map((s) => s.id === sequenceToEdit.id ? updated : s));
    setVersions((prev) => [...prev, newVersionRecord]);
    setSelectedSequence(updated);
    setSequenceToEdit(null);
    showToast(`Sequence saved as v${newVersionNum}`);
  }, [sequenceToEdit, showToast]);

  const handleTogglePinSequence = useCallback((id) => {
    setSequences((prev) => prev.map((s) => s.id === id ? { ...s, isPinned: !s.isPinned } : s));
    setSelectedSequence((prev) => prev?.id === id ? { ...prev, isPinned: !prev.isPinned } : prev);
  }, []);

  const requestDeleteSequence = useCallback((seq) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Delete Sequence',
      message: `Are you sure you want to delete "${seq.title}"?`,
      onConfirm: () => {
        setSequences((prev) => prev.filter((s) => s.id !== seq.id));
        setVersions((prev) => prev.filter((v) => !(v.entityType === 'sequence' && v.entityId === seq.id)));
        if (selectedSequence?.id === seq.id) setSelectedSequence(null);
        setConfirmModalData({ isOpen: false, title: '', message: '' });
        showToast('Sequence deleted');
      },
    });
  }, [selectedSequence, showToast]);

  // --- Skill handlers ---
  const handleCreateSkill = useCallback((data) => {
    const timestamp = new Date().toISOString();
    const skillId = generateSeqId('skill');
    const newSkill = {
      id: skillId,
      folderId: activeFolderId,
      title: data.title,
      description: data.description || '',
      category: data.category || 'Custom',
      markdownContent: data.markdownContent || '',
      tags: data.tags || [],
      colorLabel: data.colorLabel || 'purple',
      isPinned: false,
      currentVersion: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      notes: '',
      linkedPromptIds: [],
      linkedSequenceIds: [],
      references: [],
    };
    const initVersion = {
      id: generateSeqId('skv'),
      entityType: 'skill',
      entityId: skillId,
      versionNum: 1,
      timestamp,
      changeNote: 'Initial skill creation.',
      changeReason: 'Initial setup.',
    };
    setSkills((prev) => [...prev, newSkill]);
    setVersions((prev) => [...prev, initVersion]);
    setCreateModalType(null);
    showToast('Skill created');
  }, [activeFolderId, showToast]);

  const handleSaveSkill = useCallback((data) => {
    const timestamp = new Date().toISOString();
    const newVersionNum = skillToEdit.currentVersion + 1;
    const updated = {
      ...skillToEdit,
      title: data.title,
      description: data.description,
      category: data.category,
      markdownContent: data.markdownContent,
      tags: data.tags,
      colorLabel: data.colorLabel,
      currentVersion: newVersionNum,
      updatedAt: timestamp,
    };
    const newVersionRecord = {
      id: generateSeqId('skv'),
      entityType: 'skill',
      entityId: skillToEdit.id,
      versionNum: newVersionNum,
      timestamp,
      changeNote: data.changeNote,
      changeReason: data.changeReason,
    };
    setSkills((prev) => prev.map((s) => s.id === skillToEdit.id ? updated : s));
    setVersions((prev) => [...prev, newVersionRecord]);
    setSelectedSkill(updated);
    setSkillToEdit(null);
    showToast(`Skill saved as v${newVersionNum}`);
  }, [skillToEdit, showToast]);

  const handleTogglePinSkill = useCallback((id) => {
    setSkills((prev) => prev.map((s) => s.id === id ? { ...s, isPinned: !s.isPinned } : s));
    setSelectedSkill((prev) => prev?.id === id ? { ...prev, isPinned: !prev.isPinned } : prev);
  }, []);

  const requestDeleteSkill = useCallback((skill) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Delete Skill',
      message: `Are you sure you want to delete "${skill.title}"?`,
      onConfirm: () => {
        setSkills((prev) => prev.filter((s) => s.id !== skill.id));
        setVersions((prev) => prev.filter((v) => !(v.entityType === 'skill' && v.entityId === skill.id)));
        if (selectedSkill?.id === skill.id) setSelectedSkill(null);
        setConfirmModalData({ isOpen: false, title: '', message: '' });
        showToast('Skill deleted');
      },
    });
  }, [selectedSkill, showToast]);

  // Creations
  const handleCreateFolder = ({ name, color }) => {
    const newFolder = { id: generateId('f'), name, parentId: activeFolderId, color };
    setFolders([...folders, newFolder]);
    setCreateModalType(null);
    showToast('Folder created');
  };

  const handleCreateReference = ({ title, url, type }) => {
    const newRef = { id: generateId('r'), folderId: activeFolderId, type, title, url };
    setReferences([...references, newRef]);
    setCreateModalType(null);
    showToast('Reference added');
  };

  const handleSavePrompt = (data) => {
    const timestamp = new Date().toISOString();
    
    if (promptToEdit) {
      const newVersionNum = promptToEdit.currentVersion + 1;
      const updatedPrompt = { ...promptToEdit, title: data.title, content: data.content, tags: data.tags, colorLabel: data.colorLabel, currentVersion: newVersionNum, lastUpdated: timestamp };
      const newVersionRecord = { id: generateId('v'), entityType: 'prompt', entityId: promptToEdit.id, promptId: promptToEdit.id, versionNum: newVersionNum, timestamp, changeNote: data.changeNote, changeReason: data.changeReason, content: data.content };

      setPrompts(prompts.map(p => p.id === promptToEdit.id ? updatedPrompt : p));
      setVersions([...versions, newVersionRecord]);
      setSelectedPrompt(updatedPrompt);
      showToast(`Saved as version ${newVersionNum}`);
    } else {
      const promptId = generateId('p');
      const newPrompt = { id: promptId, folderId: activeFolderId, title: data.title, content: data.content, tags: data.tags, colorLabel: data.colorLabel, isPinned: false, currentVersion: 1, lastUpdated: timestamp };
      const initialVersion = { id: generateId('v'), entityType: 'prompt', entityId: promptId, promptId, versionNum: 1, timestamp, changeNote: 'Initial prompt creation.', changeReason: 'Initial setup.', content: data.content };

      setPrompts([...prompts, newPrompt]);
      setVersions([...versions, initialVersion]);
      showToast('Prompt created');
    }
    setPromptToEdit(null);
    setCreateModalType(null);
  };

  const handleRestoreVersion = (prompt, oldVersionData) => {
    const timestamp = new Date().toISOString();
    const newVersionNum = prompt.currentVersion + 1;
    const updatedPrompt = { ...prompt, content: oldVersionData.content, currentVersion: newVersionNum, lastUpdated: timestamp };
    const newVersionRecord = { id: generateId('v'), entityType: 'prompt', entityId: prompt.id, promptId: prompt.id, versionNum: newVersionNum, timestamp, changeNote: `Restored from v${oldVersionData.versionNum}`, changeReason: 'Restored previous state to recover older functionality.', content: oldVersionData.content };

    setPrompts(prompts.map(p => p.id === prompt.id ? updatedPrompt : p));
    setVersions([...versions, newVersionRecord]);
    setSelectedPrompt(updatedPrompt);
    showToast(`Restored to version ${newVersionNum}`);
  };

  // Deletions
  const requestDeletePrompt = (prompt) => {
    setConfirmModalData({
      isOpen: true, title: 'Delete Prompt', message: `Are you sure you want to delete "${prompt.title}"?`,
      onConfirm: () => {
        setPrompts(prompts.filter(p => p.id !== prompt.id));
        setVersions(versions.filter(v => v.promptId !== prompt.id));
        if (selectedPrompt?.id === prompt.id) setSelectedPrompt(null);
        setConfirmModalData({ isOpen: false, title: '', message: '' });
        showToast('Prompt deleted');
      }
    });
  };

  const requestDeleteFolder = (folder) => {
    setConfirmModalData({
      isOpen: true, title: 'Delete Folder', message: `Are you sure you want to delete "${folder.name}"? This removes its contents.`,
      onConfirm: () => {
        const idsToDelete = new Set([folder.id]);
        let changed = true;
        while (changed) {
          changed = false;
          folders.forEach((f) => {
            if (!idsToDelete.has(f.id) && idsToDelete.has(f.parentId)) {
              idsToDelete.add(f.id);
              changed = true;
            }
          });
        }
        setFolders(folders.filter(f => !idsToDelete.has(f.id)));
        setPrompts(prompts.filter(p => !idsToDelete.has(p.folderId)));
        setReferences(references.filter(r => !idsToDelete.has(r.folderId)));
        setConfirmModalData({ isOpen: false, title: '', message: '' });
        showToast('Folder deleted');
      }
    });
  };

  const requestDeleteReference = (ref) => {
    setReferences(references.filter(r => r.id !== ref.id));
    showToast('Reference deleted');
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <p className="text-sm">Loading local vault...</p>
      </div>
    );
  }

  return (
    <div className={`h-dvh ${isDarkMode ? 'dark' : ''} selection:bg-lime-300 dark:selection:bg-lime-900/50 overflow-hidden`}>
      <div className="h-full bg-slate-200 dark:bg-slate-950 flex justify-center font-sans text-slate-900 dark:text-slate-100 transition-colors overflow-hidden">
        
        <div className="w-full max-w-4xl bg-slate-50 dark:bg-slate-900 h-full shadow-2xl relative flex flex-col overflow-hidden">
          <Toast message={toastMsg || autoSyncMsg} isVisible={!!toastMsg || !!autoSyncMsg} />
          <ConfirmModal {...confirmModalData} onCancel={() => setConfirmModalData({ isOpen: false, title: '', message: '' })} />
          <ImageViewerModal imageRef={viewingImage} onClose={() => setViewingImage(null)} />

          {/* Modals */}
          {isSettingsOpen && (
          <SettingsModal 
            onClose={() => setIsSettingsOpen(false)} 
            appState={currentAppState}
            setAppState={setFullAppState}
            syncConfig={syncConfig}
            setSyncConfig={setSyncConfig}
          />
        )}
          {createModalType === 'folder' && <CreateFolderModal onClose={() => setCreateModalType(null)} onSave={handleCreateFolder} />}
          {(createModalType === 'image' || createModalType === 'link') && <CreateReferenceModal type={createModalType} onClose={() => setCreateModalType(null)} onSave={handleCreateReference} />}
          {(createModalType === 'prompt' || promptToEdit) && <EditPromptModal prompt={promptToEdit} onClose={() => { setCreateModalType(null); setPromptToEdit(null); }} onSave={handleSavePrompt} />}
          {createModalType === 'sequence' && <CreateSequenceModal onClose={() => setCreateModalType(null)} onSave={handleCreateSequence} />}
          {sequenceToEdit && <EditSequenceModal sequence={sequenceToEdit} prompts={prompts} onClose={() => setSequenceToEdit(null)} onSave={handleSaveSequence} />}
          {createModalType === 'skill' && <CreateSkillModal onClose={() => setCreateModalType(null)} onSave={handleCreateSkill} />}
          {skillToEdit && <EditSkillModal skill={skillToEdit} onClose={() => setSkillToEdit(null)} onSave={handleSaveSkill} showToast={showToast} />}

          {/* App Content — Detail views take full screen */}
          {selectedSequence ? (
            <SequenceDetailModal
              selectedSequence={selectedSequence}
              setSelectedSequence={setSelectedSequence}
              prompts={prompts}
              folders={folders}
              versions={versions}
              onEditRequest={(seq) => { setSequenceToEdit(seq); }}
              onDeleteRequest={requestDeleteSequence}
              handleCopy={handleCopy}
            />
          ) : selectedSkill ? (
            <SkillDetailModal
              selectedSkill={selectedSkill}
              setSelectedSkill={setSelectedSkill}
              prompts={prompts}
              sequences={sequences}
              folders={folders}
              versions={versions}
              onEditRequest={(skill) => { setSkillToEdit(skill); }}
              onDeleteRequest={requestDeleteSkill}
            />
          ) : selectedPrompt ? (
            <PromptDetailModal 
              selectedPrompt={selectedPrompt} setSelectedPrompt={setSelectedPrompt} handleCopy={handleCopy} 
              folders={folders} versions={versions} onTogglePin={handleTogglePin} onEditRequest={setPromptToEdit} 
              onDeleteRequest={requestDeletePrompt} onRestoreVersion={handleRestoreVersion} onDuplicateRequest={handleDuplicatePrompt}
            />
          ) : (
            <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
              <Header 
                searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
                isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} 
                viewMode={viewMode} setViewMode={setViewMode} 
                onOpenSettings={() => setIsSettingsOpen(true)}
                activeContentType={activeContentType}
                setActiveContentType={setActiveContentType}
              />
              <Breadcrumbs searchQuery={searchQuery} activeFolderId={activeFolderId} setActiveFolderId={setActiveFolderId} breadcrumbs={breadcrumbs} />
              
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 pb-24 md:px-8 md:py-6" style={{ ...hideScrollbarStyle, paddingLeft: 'calc(var(--safe-left) + 16px)', paddingRight: 'calc(var(--safe-right) + 16px)', paddingBottom: 'calc(var(--safe-bottom) + 112px)' }}>
                {searchQuery && currentPrompts.length === 0 && currentFolders.length === 0 && currentReferences.length === 0 && currentSequences.length === 0 && currentSkills.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                     <Search size={48} strokeWidth={1} className="mb-4 text-slate-300 dark:text-slate-700" />
                     <p>No results found for &quot;{searchQuery}&quot;</p>
                   </div>
                )}
                
                <FolderList currentFolders={currentFolders} setActiveFolderId={setActiveFolderId} searchQuery={searchQuery} onDeleteFolder={requestDeleteFolder} onDropPrompt={handleDropPrompt} viewMode={viewMode} />
                <ReferenceList currentReferences={currentReferences} onDeleteReference={requestDeleteReference} onViewImage={setViewingImage} viewMode={viewMode} />
                <SequenceList sequences={currentSequences} onClick={setSelectedSequence} onPin={handleTogglePinSequence} viewMode={viewMode} />
                <SkillList skills={currentSkills} onClick={setSelectedSkill} onPin={handleTogglePinSkill} viewMode={viewMode} />
                <PromptList currentPrompts={currentPrompts} searchQuery={searchQuery} setSelectedPrompt={setSelectedPrompt} handleCopy={handleCopy} onTogglePin={handleTogglePin} viewMode={viewMode} />
              </div>

              {/* Floating Action Menu */}
              {isFabOpen && (
                <div className="absolute flex flex-col gap-2 z-20 max-w-[calc(100vw-32px)] items-end" style={{ right: 'max(16px, calc(var(--safe-right) + 8px))', bottom: 'calc(var(--safe-bottom) + 92px)' }}>
                  <button data-testid="fab-create-link" onClick={() => { setCreateModalType('link'); setIsFabOpen(false); }} className="bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-lime-600 dark:hover:text-lime-400 active:scale-95 border border-slate-100 dark:border-slate-700 transition-colors max-w-[min(82vw,280px)]">
                    Add Link Ref <ExternalLink size={18} />
                  </button>
                  <button data-testid="fab-create-image" onClick={() => { setCreateModalType('image'); setIsFabOpen(false); }} className="bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-lime-600 dark:hover:text-lime-400 active:scale-95 border border-slate-100 dark:border-slate-700 transition-colors max-w-[min(82vw,280px)]">
                    Add Image Ref <Camera size={18} />
                  </button>
                  <button data-testid="fab-create-folder" onClick={() => { setCreateModalType('folder'); setIsFabOpen(false); }} className="bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-lime-600 dark:hover:text-lime-400 active:scale-95 border border-slate-100 dark:border-slate-700 transition-colors max-w-[min(82vw,280px)]">
                    Create Folder <Folder size={18} />
                  </button>
                  <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-0.5" />
                  <button data-testid="fab-create-skill" onClick={() => { setCreateModalType('skill'); setIsFabOpen(false); }} className="bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 active:scale-95 border border-slate-100 dark:border-slate-700 transition-colors max-w-[min(82vw,280px)]">
                    Create Skill <BookOpen size={18} />
                  </button>
                  <button data-testid="fab-create-sequence" onClick={() => { setCreateModalType('sequence'); setIsFabOpen(false); }} className="bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 border border-slate-100 dark:border-slate-700 transition-colors max-w-[min(82vw,280px)]">
                    Create Sequence <GitBranch size={18} />
                  </button>
                  <button data-testid="fab-create-prompt" onClick={() => { setCreateModalType('prompt'); setIsFabOpen(false); }} className="bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-lime-600 dark:hover:text-lime-400 active:scale-95 border border-slate-100 dark:border-slate-700 transition-colors max-w-[min(82vw,280px)]">
                    Create Prompt <FileText size={18} />
                  </button>
                </div>
              )}

              {isFabOpen && <div className="absolute inset-0 z-10 bg-slate-900/10 dark:bg-slate-900/40" onClick={() => setIsFabOpen(false)} />}
              <button data-testid="fab-toggle" onClick={() => setIsFabOpen(!isFabOpen)} className="absolute bottom-6 right-4 sm:right-6 w-14 h-14 bg-lime-400 dark:bg-lime-500 text-slate-900 rounded-full shadow-lg flex items-center justify-center hover:bg-lime-500 dark:hover:bg-lime-400 active:scale-90 transition-all z-20" style={{ right: 'max(16px, calc(var(--safe-right) + 8px))', bottom: 'calc(var(--safe-bottom) + 16px)' }}>
                <Plus size={24} className={`transition-transform duration-300 ${isFabOpen ? 'rotate-45' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <IonApp>
      <ErrorBoundary>
        <AppMain />
      </ErrorBoundary>
    </IonApp>
  );
}
