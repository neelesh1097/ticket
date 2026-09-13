'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  StickyNote,
  Plus,
  X,
  Pin,
  Minimize2,
  Maximize2,
  Trash2,
  Palette,
  Sparkles,
  Eye,
  EyeOff,
  Move,
  Check,
} from 'lucide-react';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  color: string;
  textColor: string;
  x: number;
  y: number;
  isMinimized: boolean;
  isPinned: boolean;
  zIndex: number;
  updatedAt: string;
}

const NOTE_COLORS = [
  { name: 'Sunflower Yellow', bg: '#fef08a', darkBg: '#854d0e', text: '#713f12', darkText: '#fef08a', border: '#fde047' },
  { name: 'Neon Mint', bg: '#bbf7d0', darkBg: '#14532d', text: '#14532d', darkText: '#bbf7d0', border: '#86efac' },
  { name: 'Cyber Cyan', bg: '#bae6fd', darkBg: '#0c4a6e', text: '#0369a1', darkText: '#bae6fd', border: '#7dd3fc' },
  { name: 'Blush Rose', bg: '#fbcfe8', darkBg: '#701a75', text: '#831843', darkText: '#fbcfe8', border: '#f472b6' },
  { name: 'Electric Violet', bg: '#ddd6fe', darkBg: '#3b0764', text: '#5b21b6', darkText: '#ddd6fe', border: '#c4b5fd' },
  { name: 'Obsidian Slate', bg: '#1e293b', darkBg: '#0f172a', text: '#f8fafc', darkText: '#f8fafc', border: '#475569' },
];

export default function StickyNotes() {
  const { currentUser, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [maxZIndex, setMaxZIndex] = useState(100);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load notes strictly for the logged-in user
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) {
      setNotes([]);
      return;
    }
    const storageKey = `ticketpulse_notes_${currentUser.id}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotes(parsed);
          const highestZ = parsed.reduce((max, n) => Math.max(max, n.zIndex || 100), 100);
          setMaxZIndex(highestZ + 1);
        }
      } else {
        // Create initial welcoming note
        const initialNote: NoteItem = {
          id: `note-${Date.now()}`,
          title: 'My Daily Activity & Notes',
          content: '• Track urgent tickets\n• Log developer hours\n• Follow up on testing bugs\n\n(Drag me anywhere on screen!)',
          color: NOTE_COLORS[0].bg,
          textColor: NOTE_COLORS[0].text,
          x: window.innerWidth > 768 ? Math.max(20, window.innerWidth - 380) : 20,
          y: 90,
          isMinimized: false,
          isPinned: false,
          zIndex: 100,
          updatedAt: new Date().toISOString(),
        };
        setNotes([initialNote]);
        localStorage.setItem(storageKey, JSON.stringify([initialNote]));
      }
    } catch (e) {
      console.error('Failed to load sticky notes:', e);
    }
  }, [isAuthenticated, currentUser?.id]);

  // Persist notes per user
  const saveNotes = (updatedNotes: NoteItem[]) => {
    setNotes(updatedNotes);
    if (currentUser?.id) {
      localStorage.setItem(`ticketpulse_notes_${currentUser.id}`, JSON.stringify(updatedNotes));
    }
  };

  const createNote = () => {
    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);
    const colorTheme = NOTE_COLORS[notes.length % NOTE_COLORS.length];
    
    // Position offset
    const offset = (notes.length % 5) * 25;
    const defaultX = isMobile ? 15 : Math.max(20, window.innerWidth - 360 - offset);
    const defaultY = isMobile ? 80 + offset : 110 + offset;

    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: 'New Note',
      content: '',
      color: colorTheme.bg,
      textColor: colorTheme.text,
      x: defaultX,
      y: defaultY,
      isMinimized: false,
      isPinned: false,
      zIndex: newZ,
      updatedAt: new Date().toISOString(),
    };

    const updated = [newNote, ...notes];
    saveNotes(updated);
    setIsVisible(true);
  };

  const updateNote = (id: string, updates: Partial<NoteItem>) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    );
    saveNotes(updated);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    saveNotes(updated);
  };

  const bringToFront = (id: string) => {
    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);
    updateNote(id, { zIndex: newZ });
  };

  // Dragging logic with Pointer Events (supports mouse & touch)
  const handleDragStart = (
    e: React.PointerEvent<HTMLDivElement>,
    note: NoteItem
  ) => {
    if (note.isPinned) return;
    bringToFront(note.id);

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialNoteX = note.x;
    const initialNoteY = note.y;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Smart viewport bounds
      const maxX = Math.max(0, window.innerWidth - (isMobile ? 260 : 300));
      const maxY = Math.max(60, window.innerHeight - 80);

      const newX = Math.min(Math.max(10, initialNoteX + deltaX), maxX);
      const newY = Math.min(Math.max(65, initialNoteY + deltaY), maxY);

      updateNote(note.id, { x: newX, y: newY });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      try {
        target.releasePointerCapture(upEvent.pointerId);
      } catch (err) {
        // ignore
      }
      target.removeEventListener('pointermove', onPointerMove as any);
      target.removeEventListener('pointerup', onPointerUp as any);
      target.removeEventListener('pointercancel', onPointerUp as any);
    };

    target.addEventListener('pointermove', onPointerMove as any);
    target.addEventListener('pointerup', onPointerUp as any);
    target.addEventListener('pointercancel', onPointerUp as any);
  };

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  return (
    <>
      {/* Floating Notes Control Pill (Bottom Right) */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black shadow-lg backdrop-blur-md transition-all duration-300 ${
            isVisible
              ? 'bg-slate-900/90 text-white dark:bg-indigo-600 dark:text-white border border-slate-700/50 hover:scale-105'
              : 'bg-white/90 text-slate-800 dark:bg-slate-800/90 dark:text-white border border-slate-200 dark:border-slate-700 hover:scale-105'
          }`}
          title={isVisible ? 'Hide Sticky Notes' : 'Show Sticky Notes'}
        >
          <StickyNote className="w-4 h-4 text-amber-400" />
          <span>Notes ({notes.length})</span>
          {isVisible ? <Eye className="w-3.5 h-3.5 opacity-70" /> : <EyeOff className="w-3.5 h-3.5 opacity-70" />}
        </button>

        <button
          onClick={createNote}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg hover:shadow-indigo-500/25 hover:scale-110 active:scale-95 transition-all duration-200"
          title="Create New Sticky Note"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Render All Sticky Notes */}
      {isVisible &&
        notes.map((note) => {
          const isDarkColor = note.color === '#1e293b';

          return (
            <div
              key={note.id}
              onClick={() => bringToFront(note.id)}
              style={{
                left: `${note.x}px`,
                top: `${note.y}px`,
                zIndex: note.zIndex,
                backgroundColor: note.color,
                color: note.textColor,
                width: isMobile ? 'calc(100vw - 32px)' : '300px',
                maxWidth: '320px',
              }}
              className={`fixed rounded-2xl shadow-xl transition-shadow duration-200 border border-black/10 dark:border-white/10 ${
                note.isPinned ? 'ring-2 ring-indigo-500/60' : ''
              } sticky-note-peel select-none`}
            >
              {/* Note Drag Bar Header */}
              <div
                onPointerDown={(e) => handleDragStart(e, note)}
                style={{ touchAction: 'none' }}
                className="px-3.5 py-2.5 flex items-center justify-between border-b border-black/10 cursor-grab active:cursor-grabbing rounded-t-2xl bg-black/5"
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                  <Move className="w-3.5 h-3.5 opacity-40 shrink-0" />
                  <input
                    type="text"
                    value={note.title}
                    onChange={(e) => updateNote(note.id, { title: e.target.value })}
                    placeholder="Note title..."
                    className="w-full bg-transparent text-xs font-black tracking-tight outline-none truncate placeholder:opacity-50"
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
                  {/* Pin button */}
                  <button
                    onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
                    className={`p-1 rounded-lg transition-colors ${
                      note.isPinned ? 'bg-black/15 text-indigo-600' : 'opacity-60 hover:opacity-100 hover:bg-black/10'
                    }`}
                    title={note.isPinned ? 'Unpin' : 'Pin Note'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
                  </button>

                  {/* Palette color picker */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveColorPicker(activeColorPicker === note.id ? null : note.id)
                      }
                      className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 transition-colors"
                      title="Change Color"
                    >
                      <Palette className="w-3.5 h-3.5" />
                    </button>

                    {activeColorPicker === note.id && (
                      <div className="absolute top-7 right-0 p-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 flex gap-1.5">
                        {NOTE_COLORS.map((c) => (
                          <button
                            key={c.name}
                            onClick={() => {
                              updateNote(note.id, { color: c.bg, textColor: c.text });
                              setActiveColorPicker(null);
                            }}
                            style={{ backgroundColor: c.bg }}
                            className="w-5 h-5 rounded-full border border-black/20 hover:scale-125 transition-transform"
                            title={c.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Minimize / Expand */}
                  <button
                    onClick={() => updateNote(note.id, { isMinimized: !note.isMinimized })}
                    className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 transition-colors"
                    title={note.isMinimized ? 'Expand Note' : 'Minimize Note'}
                  >
                    {note.isMinimized ? (
                      <Maximize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Minimize2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:text-red-600 hover:bg-black/10 transition-colors"
                    title="Delete Note"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Note Body (Hidden when Minimized) */}
              {!note.isMinimized && (
                <div className="p-3">
                  <textarea
                    rows={isMobile ? 4 : 6}
                    value={note.content}
                    onChange={(e) => updateNote(note.id, { content: e.target.value })}
                    placeholder="Type your notes, ticket IDs, reminders here..."
                    className="w-full bg-transparent text-xs font-medium leading-relaxed resize-none outline-none placeholder:opacity-40"
                  />
                  <div className="flex items-center justify-between pt-2 border-t border-black/5 text-[9px] opacity-50 font-mono">
                    <span>Private to you</span>
                    <span>{new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </>
  );
}
