
import React, { useState } from 'react';

interface FlashcardItemProps {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  isCoding?: boolean;
  isFlippedInitially?: boolean;
  onUpdate?: (id: string, updates: { front: string; back: string; explanation?: string; isCoding?: boolean }) => void;
  onDelete?: (id: string) => void;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({ id, front, back, explanation, isCoding = false, isFlippedInitially = false, onUpdate, onDelete }) => {
  const [isFlipped, setIsFlipped] = useState(isFlippedInitially);
  const [isEditing, setIsEditing] = useState(false);
  const [userInput, setUserInput] = useState('');

  // Form states for editing
  const [editFront, setEditFront] = useState(front);
  const [editBack, setEditBack] = useState(back);
  const [editExplanation, setEditExplanation] = useState(explanation || '');
  const [editIsCoding, setEditIsCoding] = useState(isCoding);

  const formatText = (text: string) => {
    if (!text) return null;

    // Handle code blocks first (triple backticks)
    const blocks = text.split(/(```[\s\S]*?```)/g);
    
    return blocks.map((block, blockIdx) => {
      if (block.startsWith('```') && block.endsWith('```')) {
        const lines = block.split('\n');
        const lang = lines[0].replace('```', '').trim();
        const codeContent = lines.slice(1, -1).join('\n').trim();
        return (
          <div key={blockIdx} className="relative group my-4">
            {lang && (
              <div className="absolute top-0 right-4 -translate-y-1/2 bg-slate-700 text-[10px] text-slate-300 px-2 py-0.5 rounded font-bold uppercase tracking-widest shadow-sm">
                {lang}
              </div>
            )}
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
              {codeContent}
            </pre>
          </div>
        );
      }

      // Handle regular text, lists, and headers
      return block.split('\n').map((line, i) => {
        const trimmedLine = line.trim();
        
        // Horizontal Rule
        if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
          return <hr key={`${blockIdx}-${i}`} className="my-6 border-t border-slate-200" />;
        }

        // Headers (supports #, ##, ###)
        if (trimmedLine.startsWith('# ')) {
          return <h3 key={`${blockIdx}-${i}`} className="text-slate-800 font-bold text-lg mt-6 mb-4 uppercase tracking-wider">{trimmedLine.replace(/^#\s*/, '')}</h3>;
        }
        if (trimmedLine.startsWith('## ')) {
          return <h4 key={`${blockIdx}-${i}`} className="text-slate-700 font-bold text-base mt-5 mb-3 uppercase tracking-tight">{trimmedLine.replace(/^##\s*/, '')}</h4>;
        }
        if (trimmedLine.startsWith('### ')) {
          return <h5 key={`${blockIdx}-${i}`} className="text-indigo-600 font-bold text-sm mt-4 mb-2 uppercase tracking-tight">{trimmedLine.replace(/^###\s*/, '')}</h5>;
        }

        // Blockquotes
        if (trimmedLine.startsWith('> ')) {
          return (
            <blockquote key={`${blockIdx}-${i}`} className="border-l-4 border-indigo-300 pl-4 py-1 my-4 text-slate-500 italic bg-indigo-50/20 rounded-r-lg">
              {renderInlineStyles(trimmedLine.replace(/^>\s*/, ''))}
            </blockquote>
          );
        }

        // Lists
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          const content = trimmedLine.replace(/^[-*]\s*/, '');
          return (
            <div key={`${blockIdx}-${i}`} className="flex gap-3 ml-2 mb-3 items-start">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2.5 flex-shrink-0" />
              <div className="flex-1 text-[15px] text-slate-600 leading-relaxed font-medium">{renderInlineStyles(content)}</div>
            </div>
          );
        }

        if (!trimmedLine) return <div key={`${blockIdx}-${i}`} className="h-4" />;

        return (
          <p key={`${blockIdx}-${i}`} className="mb-4 leading-relaxed text-[15px] text-slate-600 font-medium">
            {renderInlineStyles(line)}
          </p>
        );
      });
    });
  };

  const renderInlineStyles = (text: string) => {
    // Process Bold and Inline Code
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-[0.88em] font-medium border border-slate-200/50">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdate) {
      onUpdate(id, {
        front: editFront,
        back: editBack,
        explanation: editExplanation,
        isCoding: editIsCoding
      });
    }
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditFront(front);
    setEditBack(back);
    setEditExplanation(explanation || '');
    setEditIsCoding(isCoding);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative w-full h-[34rem] bg-white border-2 border-indigo-400 rounded-3xl shadow-2xl flex flex-col p-8 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Markdown Editor</span>
          <div className="flex gap-2">
            <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase px-2 py-1 transition-colors">Cancel</button>
            <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95">Save Changes</button>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto space-y-6 pr-2 scrollbar-thin">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Front (Challenge)</label>
            <textarea 
              value={editFront}
              onChange={(e) => setEditFront(e.target.value)}
              className="w-full h-20 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Back (Solution)</label>
            <textarea 
              value={editBack}
              onChange={(e) => setEditBack(e.target.value)}
              className="w-full h-20 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deep Dive (Supports Markdown)</label>
            <textarea 
              value={editExplanation}
              onChange={(e) => setEditExplanation(e.target.value)}
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono text-slate-600"
              placeholder="# Header 1&#10;## Header 2&#10;### Header 3&#10;- Bullet point&#10;> Quote&#10;---&#10;```python&#10;code_here()&#10;```"
            />
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-xl border border-indigo-100/50">
            <input 
              type="checkbox" 
              id={`edit-coding-${id}`}
              checked={editIsCoding} 
              onChange={(e) => setEditIsCoding(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-200 cursor-pointer"
            />
            <label htmlFor={`edit-coding-${id}`} className="text-[10px] font-bold text-indigo-700 cursor-pointer select-none uppercase tracking-widest">
              Interactive Code Workspace
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[34rem] perspective-1000 group">
      {/* Absolute Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
          className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:scale-110 transition-all active:scale-95"
          title="Delete card"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all active:scale-95"
          title="Edit card content"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        </button>
      </div>

      <div className={`relative w-full h-full duration-700 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front Side */}
        <div className="absolute inset-0 bg-white border-2 border-slate-200 rounded-3xl shadow-xl backface-hidden flex flex-col p-10 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">Front Side</span>
            {isCoding && <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Interactive Code</span>}
          </div>
          
          <div className="flex-grow overflow-y-auto pr-3 mb-4 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="text-xl font-bold text-slate-800 mb-8 whitespace-pre-wrap leading-tight">
              {formatText(front)}
            </div>

            {isCoding && (
              <div className="mt-4 relative">
                <div className="absolute top-3 left-4 text-[10px] font-black text-indigo-300 uppercase z-10">Python Editor</div>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="# Solution goes here..."
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-56 pt-10 p-6 bg-slate-900 text-emerald-400 font-mono text-sm rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-2xl transition-all border border-slate-800"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
            <div className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">
              Think first
            </div>
            <button 
              onClick={() => setIsFlipped(true)}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center active:scale-95 uppercase tracking-wider"
            >
              Reveal
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>

        {/* Back Side */}
        <div className="absolute inset-0 bg-slate-50 border-2 border-indigo-200 rounded-3xl shadow-2xl backface-hidden rotate-y-180 flex flex-col p-10 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100/50">Back Side</span>
          </div>
          
          <div className="flex-grow overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-indigo-100">
            {isCoding && userInput.trim() && (
              <div className="mb-8">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Your Attempt</h4>
                <div className="bg-white/50 border border-slate-200 p-4 rounded-2xl font-mono text-xs text-slate-500 whitespace-pre-wrap">
                  {userInput}
                </div>
              </div>
            )}

            <div className="mb-10">
              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3 ml-2">Correct Response</h4>
              <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-emerald-100 font-bold text-lg text-slate-800">
                {formatText(back)}
              </div>
            </div>

            {explanation && (
              <div className="relative">
                <div className="bg-white p-10 rounded-[2.5rem] border border-indigo-100/30 shadow-sm relative overflow-hidden min-h-[200px]">
                   {/* Vertical decoration like a notebook */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-200/50" />
                  <div className="relative z-10 prose prose-slate max-w-none">
                    {formatText(explanation)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 flex justify-center">
            <button 
              onClick={() => setIsFlipped(false)}
              className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors flex items-center py-2 active:scale-95"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              Go Back
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FlashcardItem;
