import React, { useState } from 'react';
import {
  GitBranch, X, ArrowLeft, Trash2, Edit2, History, Clock, Tag,
  Folder as FolderIcon, Pin, Plus, Copy, Search, ChevronDown, ChevronUp,
  ArrowUp, ArrowDown, Link as LinkIcon,
} from 'lucide-react';

// --- Shared utils (mirrored from App.jsx to avoid circular imports) ---
export const generateSeqId = (prefix) =>
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
export const SEQUENCE_STATUSES = ['draft', 'active', 'archived', 'template'];

const COLORS = ['blue', 'purple', 'green', 'orange', 'slate', 'cyan', 'gold', 'red'];

const getStatusClasses = (status) => {
  const map = {
    draft: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    active: 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400',
    archived: 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
    template: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  };
  return map[status] || map.draft;
};

// --- Shared form components ---
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

const StatusPicker = ({ status, setStatus }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
    <div className="flex gap-2 flex-wrap">
      {SEQUENCE_STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setStatus(s)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
            status === s
              ? `${getStatusClasses(s)} ring-2 ring-lime-400 ring-offset-1`
              : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

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
          placeholder="e.g., Added step 3 for component generation"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-lime-600 dark:text-lime-500 uppercase tracking-wider mb-1">Why Did It Change?</label>
        <input
          value={changeReason}
          onChange={(e) => { setChangeReason(e.target.value); setErrorMsg(''); }}
          className="w-full bg-white dark:bg-slate-900 border border-lime-200 dark:border-lime-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
          placeholder="e.g., Workflow was missing component generation"
        />
      </div>
    </div>
  </div>
);

// --- PromptPickerModal ---
export const PromptPickerModal = ({ prompts, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const filtered = prompts.filter(
    (p) =>
      p.title?.toLowerCase().includes(query.toLowerCase()) ||
      p.content?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-[60] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[92vw] sm:max-w-md p-5 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[calc(100dvh-32px)] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Select Prompt</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><X size={20} /></button>
        </div>
        <div className="relative mb-3 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts…"
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0" style={hideScrollbarStyle}>
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No prompts found.</p>
          ) : filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); onClose(); }}
              className="w-full text-left bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 hover:border-lime-400 dark:hover:border-lime-500 transition-colors"
            >
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{p.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 line-clamp-1">{p.content}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- SequenceStepCard ---
const SequenceStepCard = ({
  step, stepIndex, totalSteps, prompts, colorLabel,
  onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPromptPicker, setShowPromptPicker] = useState(false);

  const linkedPrompt = prompts.find((p) => p.id === step.linkedPromptId);
  const colorCls = getColorClasses(colorLabel);

  const update = (field, value) => onUpdate(step.id, { ...step, [field]: value });

  return (
    <div className="relative">
      {stepIndex < totalSteps - 1 && (
        <div className="absolute left-5 top-full h-3 w-0.5 bg-slate-200 dark:bg-slate-700 z-0 pointer-events-none" />
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm relative z-10">
        {/* Step header row */}
        <div className="flex items-center gap-2 p-3">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 ${colorCls}`}>
            {step.stepNumber}
          </span>
          <div className="flex-1 min-w-0">
            {isExpanded ? (
              <input
                value={step.title}
                onChange={(e) => update('title', e.target.value)}
                className="w-full bg-transparent text-slate-800 dark:text-slate-200 font-semibold text-sm focus:outline-none border-b border-slate-200 dark:border-slate-700 pb-0.5"
                placeholder="Step title…"
              />
            ) : (
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">
                {step.title || `Step ${step.stepNumber}`}
              </p>
            )}
            {!isExpanded && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono mt-0.5">
                {step.promptMode === 'linked'
                  ? (linkedPrompt ? linkedPrompt.title : 'No prompt linked')
                  : (step.inlinePrompt || 'No inline prompt yet')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => onMoveUp(stepIndex)}
              disabled={stepIndex === 0}
              title="Move up"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-25 transition-colors rounded-md"
            ><ArrowUp size={14} /></button>
            <button
              onClick={() => onMoveDown(stepIndex)}
              disabled={stepIndex === totalSteps - 1}
              title="Move down"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-25 transition-colors rounded-md"
            ><ArrowDown size={14} /></button>
            <button
              onClick={() => onDuplicate(step)}
              title="Duplicate step"
              className="p-1.5 text-slate-400 hover:text-lime-600 dark:hover:text-lime-400 transition-colors rounded-md"
            ><Copy size={14} /></button>
            <button
              onClick={() => onDelete(step.id)}
              title="Delete step"
              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-md"
            ><Trash2 size={14} /></button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors rounded-md"
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Expanded body */}
        {isExpanded && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-3">
            {/* Prompt mode */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Prompt</label>
              <div className="flex gap-2 mb-2">
                {['linked', 'inline'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => update('promptMode', mode)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                      step.promptMode === mode
                        ? 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 border-lime-300 dark:border-lime-700'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {mode === 'linked' ? 'Import Existing' : 'Create Inline'}
                  </button>
                ))}
              </div>

              {step.promptMode === 'linked' ? (
                linkedPrompt ? (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{linkedPrompt.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 line-clamp-2">{linkedPrompt.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPromptPicker(true)}
                      className="text-xs font-semibold text-lime-600 dark:text-lime-400 hover:underline flex-shrink-0"
                    >Change</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPromptPicker(true)}
                    className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:border-lime-400 dark:hover:border-lime-500 hover:text-lime-600 dark:hover:text-lime-400 transition-colors font-medium"
                  >
                    + Select Prompt from Repository
                  </button>
                )
              ) : (
                <textarea
                  value={step.inlinePrompt}
                  onChange={(e) => update('inlinePrompt', e.target.value)}
                  rows={4}
                  className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 font-mono resize-y"
                  placeholder="Act as a…"
                />
              )}
            </div>

            {/* Expected output */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expected Output</label>
              <input
                value={step.expectedOutput}
                onChange={(e) => update('expectedOutput', e.target.value)}
                className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
                placeholder="e.g., React component with TypeScript types"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
              <textarea
                value={step.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={2}
                className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 resize-y"
                placeholder="Additional context for this step…"
              />
            </div>
          </div>
        )}
      </div>

      {showPromptPicker && (
        <PromptPickerModal
          prompts={prompts}
          onSelect={(p) => update('linkedPromptId', p.id)}
          onClose={() => setShowPromptPicker(false)}
        />
      )}
    </div>
  );
};

// --- Steps editor (used in Create/Edit modals) ---
const StepsEditor = ({ steps, setSteps, prompts, colorLabel }) => {
  const addStep = () => {
    const newStep = {
      id: generateSeqId('step'),
      stepNumber: steps.length + 1,
      title: '',
      promptMode: 'inline',
      linkedPromptId: null,
      inlinePrompt: '',
      references: [],
      expectedOutput: '',
      notes: '',
      tags: [],
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id, updated) => setSteps(steps.map((s) => (s.id === id ? updated : s)));

  const deleteStep = (id) => {
    const remaining = steps.filter((s) => s.id !== id);
    setSteps(remaining.map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  const duplicateStep = (step) => {
    const idx = steps.findIndex((s) => s.id === step.id);
    const copy = { ...step, id: generateSeqId('step') };
    const next = [...steps.slice(0, idx + 1), copy, ...steps.slice(idx + 1)];
    setSteps(next.map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  const moveStep = (fromIdx, toIdx) => {
    const next = [...steps];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setSteps(next.map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-semibold text-slate-500 uppercase">Steps ({steps.length})</label>
        <button
          type="button"
          onClick={addStep}
          className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline flex items-center gap-1"
        >
          <Plus size={12} /> Add Step
        </button>
      </div>

      {steps.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-3">No steps yet</p>
          <button type="button" onClick={addStep} className="text-sm font-semibold text-lime-600 dark:text-lime-400 hover:underline">
            + Add First Step
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <SequenceStepCard
              key={step.id}
              step={step}
              stepIndex={idx}
              totalSteps={steps.length}
              prompts={prompts}
              colorLabel={colorLabel}
              onUpdate={updateStep}
              onDelete={deleteStep}
              onDuplicate={duplicateStep}
              onMoveUp={() => moveStep(idx, idx - 1)}
              onMoveDown={() => moveStep(idx, idx + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- CreateSequenceModal ---
export const CreateSequenceModal = ({ onClose, onSave }) => {
  const [wizardStep, setWizardStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [color, setColor] = useState('blue');
  const [status, setStatus] = useState('draft');

  const GOAL_EXAMPLES = [
    'Generate a frontend landing page',
    'Create a startup MVP',
    'Build a backend API structure',
    'Generate UI inspiration workflows',
    'Create branding assets',
    'Produce React Native screens',
  ];

  const handleGoalNext = (e) => {
    e.preventDefault();
    if (!goal.trim()) return;
    if (!title) setTitle(goal.trim());
    setWizardStep(2);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !goal.trim()) return;
    onSave({
      title: title.trim(),
      goal: goal.trim(),
      description: description.trim(),
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      colorLabel: color,
      status,
    });
  };

  return (
    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[94vw] sm:max-w-lg p-5 shadow-2xl flex flex-col border border-slate-100 dark:border-slate-800 max-h-[calc(100dvh-32px)] animate-slide-in-right overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <GitBranch size={18} className="text-blue-500" />
            {wizardStep === 1 ? 'New Sequence' : 'Sequence Details'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><X size={20} /></button>
        </div>

        {wizardStep === 1 ? (
          <form onSubmit={handleGoalNext} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">What is the goal of this sequence?</p>
            <textarea
              autoFocus
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 resize-none"
              placeholder="e.g., Generate a frontend landing page…"
            />
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Examples</p>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setGoal(ex)}
                    className="text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:border-lime-400 dark:hover:border-lime-500 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
                  >{ex}</button>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full bg-lime-400 dark:bg-lime-500 text-slate-900 font-bold py-2.5 rounded-xl hover:bg-lime-500 dark:hover:bg-lime-400 transition-colors">
              Continue →
            </button>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1 min-h-0" style={hideScrollbarStyle}>
            <div className="bg-lime-50 dark:bg-lime-900/20 border border-lime-200 dark:border-lime-900/50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-lime-600 dark:text-lime-500 uppercase mb-1">Goal</p>
              <p className="text-sm text-lime-800 dark:text-lime-300">{goal}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sequence Title</label>
              <input
                autoFocus value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description (optional)</label>
              <input
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
                placeholder="Describe this sequence…"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tags (Comma Separated)</label>
              <input
                value={tags} onChange={(e) => setTags(e.target.value)}
                className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
                placeholder="e.g., frontend, landing-page"
              />
            </div>

            <StatusPicker status={status} setStatus={setStatus} />
            <ColorPicker color={color} setColor={setColor} />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >← Back</button>
              <button
                type="submit"
                className="flex-1 bg-lime-400 dark:bg-lime-500 text-slate-900 font-bold py-2.5 rounded-xl hover:bg-lime-500 dark:hover:bg-lime-400 transition-colors"
              >Create Sequence</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- EditSequenceModal ---
export const EditSequenceModal = ({ sequence, prompts, onClose, onSave }) => {
  const [title, setTitle] = useState(sequence.title || '');
  const [goal, setGoal] = useState(sequence.goal || '');
  const [description, setDescription] = useState(sequence.description || '');
  const [tags, setTags] = useState(sequence.tags ? sequence.tags.join(', ') : '');
  const [color, setColor] = useState(sequence.colorLabel || 'blue');
  const [status, setStatus] = useState(sequence.status || 'draft');
  const [steps, setSteps] = useState(sequence.steps || []);
  const [notes, setNotes] = useState(sequence.notes || '');
  const [changeNote, setChangeNote] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !goal.trim()) return;
    if (!changeNote.trim() || !changeReason.trim()) {
      setErrorMsg('Please add a comment explaining what changed and why before saving this version.');
      return;
    }
    onSave({
      title: title.trim(),
      goal: goal.trim(),
      description: description.trim(),
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      colorLabel: color,
      status,
      steps,
      notes: notes.trim(),
      changeNote: changeNote.trim(),
      changeReason: changeReason.trim(),
    });
  };

  return (
    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[94vw] sm:max-w-lg p-5 shadow-2xl flex flex-col border border-slate-100 dark:border-slate-800 max-h-[calc(100dvh-32px)] animate-slide-in-right overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <GitBranch size={18} className="text-blue-500" /> Edit Sequence
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1 min-h-0" style={hideScrollbarStyle}>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Title</label>
            <input
              autoFocus value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Goal / Objective</label>
            <textarea
              value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} required
              className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 resize-none"
            />
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

          <StatusPicker status={status} setStatus={setStatus} />
          <ColorPicker color={color} setColor={setColor} />

          <StepsEditor steps={steps} setSteps={setSteps} prompts={prompts} colorLabel={color} />

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sequence Notes</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 resize-none"
              placeholder="General notes about this sequence…"
            />
          </div>

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

// --- SequenceDetailModal ---
export const SequenceDetailModal = ({
  selectedSequence, setSelectedSequence, prompts,
  folders, versions, onEditRequest, onDeleteRequest, handleCopy,
}) => {
  const [activeTab, setActiveTab] = useState('steps');
  const [expandedStepId, setExpandedStepId] = useState(null);

  const seqVersions = versions
    .filter((v) => v.entityType === 'sequence' && v.entityId === selectedSequence.id)
    .sort((a, b) => b.versionNum - a.versionNum);

  const steps = selectedSequence.steps || [];
  const linkedStepPrompts = steps
    .filter((s) => s.promptMode === 'linked' && s.linkedPromptId)
    .map((s) => ({ step: s, prompt: prompts.find((p) => p.id === s.linkedPromptId) }))
    .filter((x) => x.prompt);

  const tabs = [
    { id: 'steps', label: `Steps (${steps.length})` },
    { id: 'linked', label: `Linked (${linkedStepPrompts.length})` },
    { id: 'notes', label: 'Notes' },
    { id: 'history', label: `History (${seqVersions.length})` },
  ];

  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-900 z-30 flex flex-col animate-slide-in-right overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 gap-2">
        <button
          onClick={() => setSelectedSequence(null)}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-1 flex-wrap justify-end min-w-0">
          <button onClick={() => onEditRequest(selectedSequence)} title="Edit Sequence" className="p-2 text-slate-500 hover:text-lime-600 dark:text-slate-400 dark:hover:text-lime-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
            <Edit2 size={18} />
          </button>
          <button onClick={() => onDeleteRequest(selectedSequence)} title="Delete" className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0" style={hideScrollbarStyle}>
        {/* Meta */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getColorClasses(selectedSequence.colorLabel)}`}>
              {selectedSequence.colorLabel}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide capitalize ${getStatusClasses(selectedSequence.status)}`}>
              {selectedSequence.status}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center gap-1">
              <GitBranch size={12} /> {steps.length} steps
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 leading-tight">{selectedSequence.title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 font-medium">
            <span className="text-slate-400 dark:text-slate-500 font-normal">Goal: </span>{selectedSequence.goal}
          </p>
          {selectedSequence.description && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">{selectedSequence.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1"><Clock size={14} /> Updated {formatDate(selectedSequence.updatedAt)}</span>
            <span className="flex items-center gap-1"><History size={14} /> v{selectedSequence.currentVersion}</span>
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

        <div className="p-3 sm:p-4 pb-8">
          {/* Steps tab */}
          {activeTab === 'steps' && (
            <div>
              {steps.length === 0 ? (
                <div className="text-center py-12">
                  <GitBranch size={40} strokeWidth={1} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">No steps yet. Edit this sequence to add steps.</p>
                  <button
                    onClick={() => onEditRequest(selectedSequence)}
                    className="mt-3 text-sm font-semibold text-lime-600 dark:text-lime-400 hover:underline"
                  >+ Add Steps</button>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical timeline rail */}
                  {steps.length > 1 && (
                    <div
                      className="absolute left-5 w-0.5 bg-slate-200 dark:bg-slate-800 z-0 pointer-events-none"
                      style={{ top: '40px', bottom: '56px' }}
                    />
                  )}
                  <div className="space-y-4 relative z-10">
                    {steps.map((step) => {
                      const linked = step.promptMode === 'linked' ? prompts.find((p) => p.id === step.linkedPromptId) : null;
                      const promptPreview = step.promptMode === 'inline' ? step.inlinePrompt : linked?.content;
                      const isExpanded = expandedStepId === step.id;
                      return (
                        <div key={step.id} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${getColorClasses(selectedSequence.colorLabel)}`}>
                              {step.stepNumber}
                            </div>
                          </div>
                          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm min-w-0 mb-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{step.title || `Step ${step.stepNumber}`}</h4>
                              <button
                                onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                                className="flex-shrink-0 p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title={isExpanded ? "Collapse" : "Expand & Edit"}
                              >
                                {isExpanded ? <ChevronUp size={18} /> : <Edit2 size={18} />}
                              </button>
                            </div>
                            {step.promptMode === 'linked' && linked && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                <LinkIcon size={10} className="flex-shrink-0" />
                                <span>Linked: </span>
                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{linked.title}</span>
                              </div>
                            )}
                            {promptPreview && (
                              <div className="relative group">
                                <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-2 text-xs text-slate-600 dark:text-slate-400 font-mono line-clamp-3 border border-slate-200 dark:border-slate-800 mb-2">
                                  {promptPreview}
                                </div>
                                <button
                                  onClick={() => handleCopy(promptPreview)}
                                  className="absolute top-1 right-1 p-1.5 bg-lime-400 hover:bg-lime-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 z-10 font-semibold"
                                  title="Copy prompt"
                                >
                                  <Copy size={16} />
                                </button>
                              </div>
                            )}
                            {step.expectedOutput && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Output: </span>{step.expectedOutput}
                              </p>
                            )}
                            {step.notes && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Notes: </span>{step.notes}
                              </p>
                            )}
                            {isExpanded && (
                              <div className="border-t border-slate-200 dark:border-slate-800 mt-3 pt-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-semibold uppercase">Edit Step</p>
                                <button
                                  onClick={() => onEditRequest(selectedSequence)}
                                  className="w-full bg-lime-400 hover:bg-lime-500 dark:bg-lime-500 dark:hover:bg-lime-600 text-slate-900 dark:text-slate-900 font-semibold py-2 rounded-lg transition-colors text-sm"
                                >
                                  Open Full Editor
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Linked tab */}
          {activeTab === 'linked' && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Prompts Used in Steps</h4>
              {linkedStepPrompts.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">No linked prompts in any step.</p>
              ) : (
                <div className="space-y-2">
                  {linkedStepPrompts.map(({ step, prompt: p }) => (
                    <div key={step.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 relative group">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Step {step.stepNumber}</div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{p.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 line-clamp-2">{p.content}</p>
                      <button
                        onClick={() => handleCopy(p.content)}
                        className="absolute top-2 right-2 p-1.5 bg-lime-400 hover:bg-lime-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 z-10 font-semibold"
                        title="Copy prompt"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes tab */}
          {activeTab === 'notes' && (
            <div>
              {selectedSequence.notes ? (
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-800 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedSequence.notes}</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-400 dark:text-slate-500">No notes yet. Edit this sequence to add notes.</p>
                </div>
              )}
            </div>
          )}

          {/* History tab */}
          {activeTab === 'history' && (
            <div className="relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-slate-200 dark:bg-slate-800 z-0" />
              <div className="space-y-6 relative z-10">
                {seqVersions.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic pl-8">No version history yet.</p>
                ) : seqVersions.map((v, idx) => (
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

// --- SequenceCard ---
export const SequenceCard = ({ sequence, onClick, onPin, viewMode }) => {
  const colorCls = getColorClasses(sequence.colorLabel);
  const steps = sequence.steps || [];
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-lime-400 dark:hover:border-lime-500 transition-all cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 group ${viewMode === 'grid' ? 'flex flex-col h-full' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <GitBranch size={14} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors truncate">{sequence.title}</h3>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onPin(sequence.id); }}
          className="p-1.5 text-slate-300 hover:text-lime-500 dark:text-slate-600 dark:hover:text-lime-400 rounded-md transition-colors flex-shrink-0 ml-1"
        >
          <Pin size={14} className={sequence.isPinned ? 'fill-lime-500 text-lime-500 dark:fill-lime-400 dark:text-lime-400' : ''} />
        </button>
      </div>
      <p className={`text-xs text-slate-500 dark:text-slate-400 mb-2 ${viewMode === 'grid' ? 'line-clamp-2 flex-1' : 'line-clamp-1'}`}>{sequence.goal}</p>
      <div className="flex items-center gap-2 flex-wrap mt-auto">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${colorCls}`}>v{sequence.currentVersion}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide capitalize ${getStatusClasses(sequence.status)}`}>{sequence.status}</span>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{steps.length} steps</span>
        {sequence.tags && sequence.tags.slice(0, 1).map((tag) => (
          <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Tag size={10} /> {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

// --- SequenceList ---
export const SequenceList = ({ sequences, onClick, onPin, viewMode }) => {
  if (!sequences || sequences.length === 0) return null;
  return (
    <div className="space-y-2 pt-2">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sequences</p>
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'flex flex-col gap-2'}>
        {sequences.map((seq) => (
          <SequenceCard key={seq.id} sequence={seq} onClick={() => onClick(seq)} onPin={onPin} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
};
