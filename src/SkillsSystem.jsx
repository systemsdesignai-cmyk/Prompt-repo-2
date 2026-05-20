import React, { useState, useRef } from 'react';
import {
  BookOpen, X, ArrowLeft, Trash2, Edit2, History, Clock, Tag,
  Folder as FolderIcon, Pin, Upload, Eye, AlertTriangle,
} from 'lucide-react';

// --- Shared utils (mirrored from App.jsx to avoid circular imports) ---
export const generateSkillId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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

// --- Constants ---
export const SKILL_CATEGORIES = [
  'Frontend Design',
  'Backend Architecture',
  'Prompt Engineering',
  'Branding',
  'Startup Strategy',
  'AI Workflows',
  'Debugging',
  'Custom',
];

const COLORS = ['blue', 'purple', 'green', 'orange', 'slate', 'cyan', 'gold', 'red'];

// --- Markdown toolbar helper ---
const insertMarkdown = (textareaRef, before, after, value, onChange) => {
  const el = textareaRef.current;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = value.substring(start, end);
  const next = value.substring(0, start) + before + selected + after + value.substring(end);
  onChange(next);
  setTimeout(() => {
    el.focus();
    el.setSelectionRange(start + before.length, end + before.length);
  }, 0);
};

// --- MarkdownEditor ---
const MarkdownEditor = ({ value, onChange, showToast }) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        onChange(evt.target.result || '');
        if (showToast) showToast('Markdown file loaded');
      } catch {
        if (showToast) showToast('Failed to read file');
      }
    };
    reader.onerror = () => {
      if (showToast) showToast('Failed to read file — check encoding');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toolbar = [
    { label: 'B', title: 'Bold', before: '**', after: '**' },
    { label: 'I', title: 'Italic', before: '_', after: '_' },
    { label: '#', title: 'Heading', before: '## ', after: '' },
    { label: '<>', title: 'Inline Code', before: '`', after: '`' },
    { label: '•', title: 'List item', before: '\n- ', after: '' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {toolbar.map((btn) => (
            <button
              key={btn.label}
              type="button"
              title={btn.title}
              onClick={() => insertMarkdown(textareaRef, btn.before, btn.after, value, onChange)}
              className="px-2.5 py-1 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-lime-600 dark:hover:text-lime-400 rounded transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Upload size={12} /> Upload .md
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              showPreview
                ? 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Eye size={12} /> {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {showPreview ? (
        <div
          className="w-full min-h-[200px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono leading-relaxed overflow-auto"
          style={hideScrollbarStyle}
        >
          {value || <span className="text-slate-400 italic">No content yet…</span>}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 font-mono leading-relaxed resize-y"
          placeholder={'# Skill Title\n\nWrite your methodology, framework, or knowledge system here…\n\n## Section\n\n- Point one\n- Point two'}
        />
      )}
    </div>
  );
};

// --- Version control block (reusable) ---
const VersionControlBlock = ({ changeNote, setChangeNote, changeReason, setChangeReason, errorMsg, setErrorMsg }) => (
  <div className="bg-lime-50 dark:bg-lime-900/20 p-3 rounded-xl border border-lime-200 dark:border-lime-900/50">
    <label className="block text-xs font-bold text-lime-700 dark:text-lime-400 uppercase tracking-wider mb-2">
      Version Update Details (Required)
    </label>
    {errorMsg && <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-3">{errorMsg}</p>}
    <div className="space-y-3">
      <div>
        <label className="block text-[10px] font-bold text-lime-600 dark:text-lime-500 uppercase tracking-wider mb-1">What Changed?</label>
        <input
          value={changeNote}
          onChange={(e) => { setChangeNote(e.target.value); setErrorMsg(''); }}
          className="w-full bg-white dark:bg-slate-900 border border-lime-200 dark:border-lime-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
          placeholder="e.g., Added performance section"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-lime-600 dark:text-lime-500 uppercase tracking-wider mb-1">Why Did It Change?</label>
        <input
          value={changeReason}
          onChange={(e) => { setChangeReason(e.target.value); setErrorMsg(''); }}
          className="w-full bg-white dark:bg-slate-900 border border-lime-200 dark:border-lime-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
          placeholder="e.g., Missing critical performance guidance"
        />
      </div>
    </div>
  </div>
);

// --- Shared form fields ---
const ColorPicker = ({ color, setColor }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Color Label</label>
    <div className="flex gap-2 flex-wrap">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setColor(c)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            color === c ? 'border-slate-800 dark:border-slate-100 scale-110' : 'border-transparent'
          } ${getColorClasses(c).split(' ')[0]}`}
        />
      ))}
    </div>
  </div>
);

// --- CreateSkillModal ---
export const CreateSkillModal = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Frontend Design');
  const [markdownContent, setMarkdownContent] = useState('');
  const [tags, setTags] = useState('');
  const [color, setColor] = useState('purple');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      markdownContent: markdownContent.trim(),
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      colorLabel: color,
    });
  };

  return (
    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[94vw] sm:max-w-lg p-5 shadow-2xl flex flex-col border border-slate-100 dark:border-slate-800 max-h-[calc(100dvh-32px)] animate-slide-in-right overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen size={18} className="text-purple-500" /> New Skill
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1 min-h-0" style={hideScrollbarStyle}>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Skill Title</label>
            <input
              autoFocus value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
              placeholder="e.g., React Native Best Practices"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
            <select
              value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
            >
              {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label>
            <input
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
              placeholder="Brief description of this skill…"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tags (Comma Separated)</label>
            <input
              value={tags} onChange={(e) => setTags(e.target.value)}
              className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
              placeholder="e.g., react, performance, mobile"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Content</label>
            <MarkdownEditor value={markdownContent} onChange={setMarkdownContent} />
          </div>

          <ColorPicker color={color} setColor={setColor} />

          <button type="submit" className="w-full bg-lime-400 dark:bg-lime-500 text-slate-900 font-bold py-2.5 rounded-xl mt-2 hover:bg-lime-500 dark:hover:bg-lime-400 transition-colors shrink-0">
            Save Skill
          </button>
        </form>
      </div>
    </div>
  );
};

// --- EditSkillModal ---
export const EditSkillModal = ({ skill, onClose, onSave, showToast }) => {
  const [title, setTitle] = useState(skill.title || '');
  const [description, setDescription] = useState(skill.description || '');
  const [category, setCategory] = useState(skill.category || 'Frontend Design');
  const [markdownContent, setMarkdownContent] = useState(skill.markdownContent || '');
  const [tags, setTags] = useState(skill.tags ? skill.tags.join(', ') : '');
  const [color, setColor] = useState(skill.colorLabel || 'purple');
  const [changeNote, setChangeNote] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!changeNote.trim() || !changeReason.trim()) {
      setErrorMsg('Please add a comment explaining what changed and why before saving this version.');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      markdownContent: markdownContent.trim(),
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      colorLabel: color,
      changeNote: changeNote.trim(),
      changeReason: changeReason.trim(),
    });
  };

  return (
    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[94vw] sm:max-w-lg p-5 shadow-2xl flex flex-col border border-slate-100 dark:border-slate-800 max-h-[calc(100dvh-32px)] animate-slide-in-right overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen size={18} className="text-purple-500" /> Edit Skill
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1 min-h-0" style={hideScrollbarStyle}>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Skill Title</label>
            <input
              autoFocus value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
            <select
              value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
            >
              {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label>
            <input
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tags (Comma Separated)</label>
            <input
              value={tags} onChange={(e) => setTags(e.target.value)}
              className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Content</label>
            <MarkdownEditor value={markdownContent} onChange={setMarkdownContent} showToast={showToast} />
          </div>

          <ColorPicker color={color} setColor={setColor} />

          <VersionControlBlock
            changeNote={changeNote} setChangeNote={setChangeNote}
            changeReason={changeReason} setChangeReason={setChangeReason}
            errorMsg={errorMsg} setErrorMsg={setErrorMsg}
          />

          <button type="submit" className="w-full bg-lime-400 dark:bg-lime-500 text-slate-900 font-bold py-2.5 rounded-xl mt-4 hover:bg-lime-500 dark:hover:bg-lime-400 transition-colors shrink-0">
            Save New Version
          </button>
        </form>
      </div>
    </div>
  );
};

// --- SkillDetailModal ---
export const SkillDetailModal = ({ selectedSkill, setSelectedSkill, prompts, sequences, folders, versions, onEditRequest, onDeleteRequest }) => {
  const [activeTab, setActiveTab] = useState('content');

  const skillVersions = versions
    .filter((v) => v.entityType === 'skill' && v.entityId === selectedSkill.id)
    .sort((a, b) => b.versionNum - a.versionNum);

  const linkedPrompts = prompts.filter((p) => (selectedSkill.linkedPromptIds || []).includes(p.id));
  const linkedSequences = sequences.filter((s) => (selectedSkill.linkedSequenceIds || []).includes(s.id));

  const tabs = [
    { id: 'content', label: 'Content' },
    { id: 'linked', label: `Linked (${linkedPrompts.length + linkedSequences.length})` },
    { id: 'history', label: `History (${skillVersions.length})` },
  ];

  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-900 z-30 flex flex-col animate-slide-in-right overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 gap-2">
        <button
          onClick={() => setSelectedSkill(null)}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-1 flex-wrap justify-end min-w-0">
          <button onClick={() => onEditRequest(selectedSkill)} title="Edit Skill" className="p-2 text-slate-500 hover:text-lime-600 dark:text-slate-400 dark:hover:text-lime-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
            <Edit2 size={18} />
          </button>
          <button onClick={() => onDeleteRequest(selectedSkill)} title="Delete" className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0" style={hideScrollbarStyle}>
        {/* Meta */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getColorClasses(selectedSkill.colorLabel)}`}>
              {selectedSkill.category}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <FolderIcon size={12} /> {folders.find((f) => f.id === selectedSkill.folderId)?.name || 'Root'}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center gap-1">
              <BookOpen size={12} /> Skill
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 leading-tight">{selectedSkill.title}</h2>
          {selectedSkill.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{selectedSkill.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1"><Clock size={14} /> Updated {formatDate(selectedSkill.updatedAt)}</span>
            <span className="flex items-center gap-1"><History size={14} /> v{selectedSkill.currentVersion}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-3 sm:px-4 pt-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto" style={hideScrollbarStyle}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3 pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-lime-500 dark:border-lime-400 text-lime-600 dark:text-lime-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-3 sm:p-4">
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                <pre className="text-slate-800 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {selectedSkill.markdownContent || (
                    <span className="text-slate-400 italic">No content yet. Edit this skill to add content.</span>
                  )}
                </pre>
              </div>
              {selectedSkill.tags && selectedSkill.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Tags</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedSkill.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg flex items-center gap-1.5">
                        <Tag size={12} className="text-slate-400" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'linked' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Linked Prompts ({linkedPrompts.length})</h4>
                {linkedPrompts.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">No prompts linked yet.</p>
                ) : (
                  <div className="space-y-2">
                    {linkedPrompts.map((p) => (
                      <div key={p.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{p.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 line-clamp-1">{p.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Linked Sequences ({linkedSequences.length})</h4>
                {linkedSequences.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">No sequences linked yet.</p>
                ) : (
                  <div className="space-y-2">
                    {linkedSequences.map((s) => (
                      <div key={s.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{s.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{s.goal}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-slate-200 dark:bg-slate-800 z-0" />
              <div className="space-y-6 relative z-10">
                {skillVersions.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic pl-8">No version history yet.</p>
                ) : skillVersions.map((v, idx) => (
                  <div key={v.id} className="flex gap-4">
                    <div className="flex-shrink-0 pt-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold ${
                        idx === 0
                          ? 'bg-lime-100 dark:bg-lime-900/40 border-lime-500 dark:border-lime-400 text-lime-700 dark:text-lime-400'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                      }`}>v{v.versionNum}</div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm min-w-0">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{formatDate(v.timestamp)}</span>
                        {idx === 0 && <span className="text-[10px] uppercase font-bold tracking-wider text-lime-700 dark:text-lime-400 bg-lime-100 dark:bg-lime-900/30 px-2 py-0.5 rounded">Active</span>}
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 rounded p-3 text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 space-y-1">
                        <p><span className="font-semibold text-slate-900 dark:text-slate-100">What:</span> {v.changeNote}</p>
                        {v.changeReason && <p><span className="font-semibold text-slate-900 dark:text-slate-100">Why:</span> {v.changeReason}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- SkillCard ---
export const SkillCard = ({ skill, onClick, onPin, viewMode }) => {
  const colorCls = getColorClasses(skill.colorLabel);
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-lime-400 dark:hover:border-lime-500 transition-all cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 group ${viewMode === 'grid' ? 'flex flex-col h-full' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <BookOpen size={14} className="text-purple-500 dark:text-purple-400 flex-shrink-0" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors truncate">{skill.title}</h3>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onPin(skill.id); }}
          className="p-1.5 text-slate-300 hover:text-lime-500 dark:text-slate-600 dark:hover:text-lime-400 rounded-md transition-colors flex-shrink-0 ml-1"
        >
          <Pin size={14} className={skill.isPinned ? 'fill-lime-500 text-lime-500 dark:fill-lime-400 dark:text-lime-400' : ''} />
        </button>
      </div>
      {skill.description && (
        <p className={`text-xs text-slate-500 dark:text-slate-400 mb-2 ${viewMode === 'grid' ? 'line-clamp-2 flex-1' : 'line-clamp-1'}`}>{skill.description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap mt-auto">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${colorCls}`}>{skill.category}</span>
        {skill.tags && skill.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Tag size={10} /> {tag}
          </span>
        ))}
        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">{formatDate(skill.updatedAt)}</span>
      </div>
    </div>
  );
};

// --- SkillList ---
export const SkillList = ({ skills, onClick, onPin, viewMode }) => {
  if (!skills || skills.length === 0) return null;
  return (
    <div className="space-y-2 pt-2">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Skills</p>
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'flex flex-col gap-2'}>
        {skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} onClick={() => onClick(skill)} onPin={onPin} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
};
