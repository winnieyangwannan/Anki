
import React, { useState } from 'react';
import { Flashcard } from '../types';
import FlashcardItem from './FlashcardItem';

interface StudyViewProps {
  cards: Flashcard[];
  onFinish: () => void;
  onUpdateCard?: (id: string, updates: { front: string; back: string; explanation?: string }) => void;
  onDeleteCard?: (id: string) => void;
}

const StudyView: React.FC<StudyViewProps> = ({ cards, onFinish, onUpdateCard, onDeleteCard }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this card from the deck? This cannot be undone.")) {
      if (cards.length === 1) {
        // If it was the last card, return to dashboard
        onDeleteCard?.(id);
        onFinish();
      } else {
        // If we are at the last card, move to previous one before deleting
        if (currentIndex === cards.length - 1) {
          setCurrentIndex(prev => prev - 1);
        }
        onDeleteCard?.(id);
      }
    }
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p>No cards to study in this deck.</p>
        <button onClick={onFinish} className="mt-4 text-indigo-600 font-medium">Return to Dashboard</button>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl text-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-3xl font-extrabold mb-2 text-slate-800">Mastery Achieved!</h2>
        <p className="text-slate-500 mb-10 leading-relaxed">You've successfully navigated all {cards.length} challenges in this curriculum.</p>
        <button 
          onClick={onFinish}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
        >
          Return to Library
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8 px-2">
        <button onClick={onFinish} className="flex items-center text-slate-400 hover:text-indigo-600 font-bold text-sm transition-colors group">
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          ABANDON STUDY
        </button>
        <div className="text-xs font-bold text-indigo-400 bg-indigo-50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-indigo-100">
          Module {currentIndex + 1} / {cards.length}
        </div>
      </div>

      <FlashcardItem 
        key={cards[currentIndex].id} 
        id={cards[currentIndex].id}
        front={cards[currentIndex].front} 
        back={cards[currentIndex].back} 
        explanation={cards[currentIndex].explanation}
        isCoding={cards[currentIndex].isCoding}
        onUpdate={onUpdateCard}
        onDelete={handleDelete}
      />

      <div className="mt-12 flex items-center justify-center gap-8">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white shadow-md text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-indigo-600 transition-all active:scale-90 border border-slate-100"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        
        <button 
          onClick={handleNext}
          className="flex-grow py-5 rounded-3xl bg-indigo-600 text-white font-black text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center active:scale-[0.98]"
        >
          {currentIndex === cards.length - 1 ? 'COMPLETE STUDY' : 'CONTINUE'}
          <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        </button>
      </div>

      <div className="mt-10 w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner border border-slate-100">
        <div 
          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-700 ease-out" 
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default StudyView;
