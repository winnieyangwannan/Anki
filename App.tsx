
import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, Flashcard, Deck } from './types';
import { generateFlashcards } from './services/geminiService';
import StudyView from './components/StudyView';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [targetDeckId, setTargetDeckId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [creationMode, setCreationMode] = useState<'AI' | 'MANUAL'>('AI');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Inline Rename State
  const [renamingDeckId, setRenamingDeckId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');

  // AI Form States
  const [prompt, setPrompt] = useState('');
  const [cardCount, setCardCount] = useState(5);
  
  // Manual Form States
  const [manualFront, setManualFront] = useState('');
  const [manualBack, setManualBack] = useState('');
  const [manualExplanation, setManualExplanation] = useState('');
  const [manualIsCoding, setManualIsCoding] = useState(false);
  const [manualDeckTitle, setManualDeckTitle] = useState('');

  // Persistence
  useEffect(() => {
    const savedDecks = localStorage.getItem('gemini-flashcards-decks-v2');
    if (savedDecks) {
      setDecks(JSON.parse(savedDecks));
    } else {
      const sampleDeck: Deck = {
        id: 'sample-1',
        title: 'Python Mastery',
        cards: [
          {
            id: 'c1',
            front: 'Write the code to create a sorted vocabulary of unique characters from a list of strings named `words`.',
            back: 'chars = sorted(list(set("".join(words))))',
            explanation: `### Core Logic
The goal is to extract every unique character across multiple strings and present them in a standard alphabetical order.

### Step-by-Step Breakdown
- **Join**: \`"".join(words)\` merges all strings in the list into one.
- **Set**: \`set(...)\` cast removes all duplicates (Sets only store unique elements).
- **Sort**: \`sorted(...)\` takes the unique characters and arranges them.

---

> **Example Case**:
> Input: \`["apple", "pear"]\`
> Result: \`['a', 'e', 'l', 'p', 'r']\`

### Performance Tip
Using \`set\` is significantly faster than manually iterating and checking for uniqueness in a list.`,
            isCoding: true,
            createdAt: Date.now()
          }
        ]
      };
      setDecks([sampleDeck]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gemini-flashcards-decks-v2', JSON.stringify(decks));
  }, [decks]);

  const handleExport = () => {
    const dataStr = JSON.stringify(decks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'gemini-flashcards-export.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedDecks = JSON.parse(content);
        if (Array.isArray(importedDecks)) {
          if (window.confirm("Importing will add these decks to your library. Proceed?")) {
            setDecks(prev => [...importedDecks, ...prev]);
          }
        } else {
          alert("Invalid file format. Please use a valid flashcard export JSON.");
        }
      } catch (err) {
        alert("Error reading file. Make sure it's a valid JSON.");
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    fileReader.readAsText(files[0]);
  };

  const handleCreateOrAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (creationMode === 'AI') {
      if (!prompt.trim()) return;
      setIsGenerating(true);
      try {
        const generated = await generateFlashcards(prompt, cardCount);
        const newCards: Flashcard[] = generated.map((c, i) => ({
          id: `card-${Date.now()}-${i}`,
          front: c.front || '',
          back: c.back || '',
          explanation: c.explanation || '',
          isCoding: !!c.isCoding,
          createdAt: Date.now()
        }));

        if (targetDeckId) {
          setDecks(decks.map(d => d.id === targetDeckId ? { ...d, cards: [...d.cards, ...newCards] } : d));
        } else {
          const newDeck: Deck = {
            id: `deck-${Date.now()}`,
            title: prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt,
            cards: newCards
          };
          setDecks([newDeck, ...decks]);
        }
        setPrompt('');
        setTargetDeckId(null);
        setViewMode(ViewMode.DASHBOARD);
      } catch (err) {
        alert("Failed to generate cards. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Manual Mode
      if (!manualFront.trim() || !manualBack.trim()) return;
      if (!targetDeckId && !manualDeckTitle.trim()) {
        alert("Please provide a title for your new deck.");
        return;
      }

      const newCard: Flashcard = {
        id: `card-${Date.now()}`,
        front: manualFront,
        back: manualBack,
        explanation: manualExplanation,
        isCoding: manualIsCoding,
        createdAt: Date.now()
      };

      if (targetDeckId) {
        setDecks(decks.map(d => d.id === targetDeckId ? { ...d, cards: [...d.cards, newCard] } : d));
      } else {
        const newDeck: Deck = {
          id: `deck-${Date.now()}`,
          title: manualDeckTitle,
          cards: [newCard]
        };
        setDecks([newDeck, ...decks]);
      }

      // Reset
      setManualFront('');
      setManualBack('');
      setManualExplanation('');
      setManualIsCoding(false);
      setManualDeckTitle('');
      setTargetDeckId(null);
      setViewMode(ViewMode.DASHBOARD);
    }
  };

  const handleUpdateCard = (cardId: string, updates: { front: string; back: string; explanation?: string; isCoding?: boolean }) => {
    setDecks(prevDecks => prevDecks.map(deck => ({
      ...deck,
      cards: deck.cards.map(card => card.id === cardId ? { ...card, ...updates } : card)
    })));
  };

  const handleDeleteCard = (cardId: string) => {
    setDecks(prevDecks => prevDecks.map(deck => ({
      ...deck,
      cards: deck.cards.filter(card => card.id !== cardId)
    })));
  };

  const deleteDeck = (id: string) => {
    if (window.confirm("Delete this deck?")) {
      setDecks(decks.filter(d => d.id !== id));
    }
  };

  const handleStartRename = (id: string, currentTitle: string) => {
    setRenamingDeckId(id);
    setRenamingValue(currentTitle);
  };

  const handleSaveRename = () => {
    if (renamingDeckId && renamingValue.trim() !== "") {
      setDecks(decks.map(d => d.id === renamingDeckId ? { ...d, title: renamingValue.trim() } : d));
    }
    setRenamingDeckId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRename();
    if (e.key === 'Escape') setRenamingDeckId(null);
  };

  const initiateAddCards = (deckId: string) => {
    setTargetDeckId(deckId);
    setViewMode(ViewMode.CREATE);
  };

  const startStudying = (id: string) => {
    setSelectedDeckId(id);
    setViewMode(ViewMode.STUDY);
  };

  const selectedDeck = decks.find(d => d.id === selectedDeckId);
  const targetDeck = decks.find(d => d.id === targetDeckId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100 selection:text-indigo-700">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImport} 
        className="hidden" 
        accept=".json"
      />
      
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => {
              setViewMode(ViewMode.DASHBOARD);
              setTargetDeckId(null);
            }}
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white mr-3 shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Gemini Flashcard Pro
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setTargetDeckId(null);
                setViewMode(ViewMode.CREATE);
              }}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center shadow-lg shadow-indigo-100 active:scale-95"
            >
              <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Create Deck
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">
        {viewMode === ViewMode.DASHBOARD && (
          <div>
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-4xl font-black text-slate-800 mb-2">My Library</h2>
                <p className="text-slate-500 font-medium tracking-tight">Sharpen your coding skills with AI-powered interactive challenges.</p>
              </div>
              
              <div className="flex justify-center gap-2">
                <button 
                  onClick={handleImportClick}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center"
                  title="Import JSON Backup"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  Restore
                </button>
                <button 
                  onClick={handleExport}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center"
                  title="Export Library to JSON"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Backup
                </button>
              </div>
            </div>

            {decks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-6">
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Empty Library</h3>
                <p className="text-slate-500 mb-8 max-w-xs text-center">Your knowledge base is currently empty. Use the AI assistant to start learning!</p>
                <button 
                  onClick={() => { setTargetDeckId(null); setViewMode(ViewMode.CREATE); }}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                  Create First Deck
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {decks.map(deck => (
                  <div key={deck.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100/50 transition-colors"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleStartRename(deck.id, deck.title)} title="Rename deck" className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${renamingDeckId === deck.id ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-300 hover:bg-amber-500 hover:text-white'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onClick={() => initiateAddCards(deck.id)} title="Add cards" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                        <button onClick={() => deleteDeck(deck.id)} title="Delete deck" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-500 hover:text-white transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-2 relative z-10 min-h-[3rem] flex items-center">
                      {renamingDeckId === deck.id ? (
                        <input
                          autoFocus
                          value={renamingValue}
                          onChange={(e) => setRenamingValue(e.target.value)}
                          onBlur={handleSaveRename}
                          onKeyDown={handleRenameKeyDown}
                          className="w-full text-xl font-bold text-slate-800 bg-slate-50 border-2 border-indigo-400 rounded-lg px-2 py-1 outline-none shadow-inner"
                        />
                      ) : (
                        <h3 className="text-xl font-bold text-slate-800 line-clamp-2">{deck.title}</h3>
                      )}
                    </div>

                    <p className="text-slate-400 text-sm mb-8 relative z-10 font-medium">{deck.cards.length} Interactive Cards</p>
                    <button 
                      onClick={() => startStudying(deck.id)}
                      className="mt-auto w-full py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm relative z-10 group/btn"
                    >
                      Study Deck
                      <svg className="w-5 h-5 ml-2 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === ViewMode.CREATE && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 flex items-center justify-between px-4">
               <button onClick={() => { setViewMode(ViewMode.DASHBOARD); setTargetDeckId(null); }} className="text-slate-400 hover:text-indigo-600 font-black text-xs transition-colors flex items-center uppercase tracking-tighter">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                Back to Dashboard
              </button>
              <h2 className="text-2xl font-black text-slate-800">
                {targetDeckId ? `Refine "${targetDeck?.title}"` : 'Construct New Deck'}
              </h2>
              <div className="w-24"></div>
            </div>

            <div className="flex bg-slate-200 p-1.5 rounded-2xl mb-8">
              <button 
                onClick={() => setCreationMode('AI')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${creationMode === 'AI' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                AI Generator
              </button>
              <button 
                onClick={() => setCreationMode('MANUAL')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${creationMode === 'MANUAL' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Manual Draft
              </button>
            </div>

            <form onSubmit={handleCreateOrAdd} className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
              {!targetDeckId && creationMode === 'MANUAL' && (
                <div className="mb-8">
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Deck Identifier</label>
                  <input 
                    type="text"
                    value={manualDeckTitle}
                    onChange={(e) => setManualDeckTitle(e.target.value)}
                    placeholder="e.g. Python Advanced Patterns"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                    required={creationMode === 'MANUAL'}
                  />
                </div>
              )}

              {creationMode === 'AI' ? (
                <>
                  <div className="mb-8">
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Target Subject / Documentation</label>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={targetDeckId ? "Focus for additional cards..." : "Paste documentation, code snippets, or a topic name..."}
                      className="w-full h-48 p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium text-slate-700 transition-all"
                      required={creationMode === 'AI'}
                    />
                  </div>
                  <div className="mb-10">
                    <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest text-center">Batch Size</label>
                    <div className="flex gap-4">
                      {[3, 5, 8, 12].map(num => (
                        <button key={num} type="button" onClick={() => setCardCount(num)} className={`flex-1 py-3 rounded-2xl border-2 transition-all font-bold text-lg ${cardCount === num ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-100' : 'border-slate-100 bg-white text-slate-300 hover:border-slate-200'}`}>
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Front Side (Question / Prompt)</label>
                    <textarea 
                      value={manualFront}
                      onChange={(e) => setManualFront(e.target.value)}
                      placeholder="The prompt or challenge..."
                      className="w-full h-24 p-5 bg-slate-50 border border-slate-200 rounded-[1.2rem] focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium text-slate-700 transition-all"
                      required={creationMode === 'MANUAL'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Back Side (Concise Answer)</label>
                    <textarea 
                      value={manualBack}
                      onChange={(e) => setManualBack(e.target.value)}
                      placeholder="The correct answer or solution..."
                      className="w-full h-24 p-5 bg-slate-50 border border-slate-200 rounded-[1.2rem] focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium text-slate-700 transition-all"
                      required={creationMode === 'MANUAL'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Deep Dive Explanation (Optional)</label>
                    <textarea 
                      value={manualExplanation}
                      onChange={(e) => setManualExplanation(e.target.value)}
                      placeholder="Step-by-step breakdown of the logic..."
                      className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-[1.2rem] focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium text-slate-700 transition-all text-sm italic"
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                    <input 
                      type="checkbox" 
                      id="isCoding" 
                      checked={manualIsCoding} 
                      onChange={(e) => setManualIsCoding(e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-200 cursor-pointer"
                    />
                    <label htmlFor="isCoding" className="text-sm font-bold text-indigo-700 cursor-pointer select-none">
                      Enable Interactive Code Workspace on Front
                    </label>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={isGenerating || (creationMode === 'AI' ? !prompt.trim() : (!manualFront.trim() || !manualBack.trim()))}
                className="mt-10 w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-indigo-200 flex items-center justify-center transition-all active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Synthesizing Knowledge...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    {creationMode === 'AI' ? (targetDeckId ? 'Generate & Append' : 'Initialize Deck') : (targetDeckId ? 'Confirm Addition' : 'Finalize Deck')}
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {viewMode === ViewMode.STUDY && selectedDeck && (
          <StudyView 
            cards={selectedDeck.cards} 
            onFinish={() => setViewMode(ViewMode.DASHBOARD)} 
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
          />
        )}
      </main>

      <footer className="py-10 text-center text-slate-400 text-xs border-t border-slate-100 bg-white">
        <p className="font-bold tracking-widest uppercase">
          © {new Date().getFullYear()} Gemini Flashcard Pro • <span className="text-indigo-600">Advanced Cognitive Engine</span>
        </p>
      </footer>
    </div>
  );
};

export default App;
