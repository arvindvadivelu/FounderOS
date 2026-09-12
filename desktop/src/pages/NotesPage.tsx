import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText,
  Plus,
  Trash2,
  Pin,
  Search,
  Folder,
  Eye,
  Edit3,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Tag,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { db } from '../db';
import { EmptyState } from '../components/common/EmptyState';
import { createNote, updateNote, deleteNote } from '../db/services/goalNoteService';
import { formatRelativeTime } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { Note } from '../types';

export const NotesPage: React.FC = () => {
  const { showToast } = useToast();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Active Note Edit State
  const [activeTitle, setActiveTitle] = useState('');
  const [activeCategory, setActiveCategory] = useState('Strategy');
  const [activeContent, setActiveContent] = useState('');
  const [activeIsPinned, setActiveIsPinned] = useState(false);

  // Live Queries
  const notes = useLiveQuery(
    async () => {
      const list = await db.notes.toArray();
      return list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    },
    []
  ) || [];

  // Extract unique categories
  const categories: string[] = Array.from(new Set(notes.map((n) => n.category || 'General')));

  // Filtered Notes
  const filteredNotes = notes.filter((n) => {
    const matchesCat = categoryFilter === 'all' || n.category === categoryFilter;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Select initial note
  useEffect(() => {
    if (!selectedNoteId && filteredNotes.length > 0) {
      setSelectedNoteId(filteredNotes[0].id);
    }
  }, [filteredNotes, selectedNoteId]);

  // Sync editor state when selection changes
  useEffect(() => {
    const note = notes.find((n) => n.id === selectedNoteId);
    if (note) {
      setActiveTitle(note.title);
      setActiveCategory(note.category);
      setActiveContent(note.content);
      setActiveIsPinned(Boolean(note.isPinned));
      setLastSavedTime(formatRelativeTime(note.updatedAt));
    }
  }, [selectedNoteId, notes]);

  const handleCreateNewNote = async () => {
    const newNote = await createNote({
      title: 'Untitled Note',
      content: '# New Document\n\nWrite your thoughts, strategy, customer playbooks, or specifications here...',
      category: categoryFilter !== 'all' ? categoryFilter : 'Strategy',
      tags: [],
      isPinned: false,
    });
    setSelectedNoteId(newNote.id);
    setIsEditing(true);
    showToast('success', 'Note Created', 'New document initialized.');
  };

  const handleSaveActiveNote = async () => {
    if (!selectedNoteId) return;
    await updateNote(selectedNoteId, {
      title: activeTitle || 'Untitled',
      category: activeCategory || 'General',
      content: activeContent,
      isPinned: activeIsPinned,
    });
    setLastSavedTime('just now');
    showToast('success', 'Note Saved', `Document "${activeTitle || 'Untitled'}" saved successfully.`);
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('Delete this note?')) {
      await deleteNote(id);
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
      showToast('info', 'Note Deleted', 'Document removed.');
    }
  };

  const handleTogglePin = async () => {
    if (!selectedNoteId) return;
    const nextPin = !activeIsPinned;
    setActiveIsPinned(nextPin);
    await updateNote(selectedNoteId, { isPinned: nextPin });
    showToast('info', nextPin ? 'Pinned Note' : 'Unpinned Note', nextPin ? 'Pinned to top of list.' : 'Unpinned.');
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* =========================================================================
          1. EDITORIAL PAGE HEADER (DESIGN.md Typography & 50px Pill CTA)
         ========================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Tag Chip (10px radius) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(0, 80, 255, 0.12)',
              border: '1px solid rgba(0, 80, 255, 0.3)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              width: 'fit-content',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#0050FF',
                boxShadow: '0 0 8px #0050FF',
              }}
            />
            SOVEREIGN KNOWLEDGE VAULT • LOCAL-FIRST
          </div>

          <h1
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 700,
              color: '#f8fafc',
              letterSpacing: '-0.04em',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Knowledge Base & Strategy Notes
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#94a3b8',
              margin: 0,
              maxWidth: '700px',
              lineHeight: 1.5,
            }}
          >
            Write and organize company operating playbooks, customer security FAQs, meeting memos, and product specifications with instant local markdown execution.
          </p>
        </div>

        {/* 50px Pill Action Button with Embedded Circular Dot */}
        <button
          type="button"
          onClick={handleCreateNewNote}
          style={{
            backgroundColor: '#0050FF',
            color: '#ffffff',
            border: '1px solid #1a62ff',
            borderRadius: '50px', // --radius-buttons: 50px
            padding: '12px 22px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(0, 80, 255, 0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1a62ff';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 0 26px rgba(0, 80, 255, 0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0050FF';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 80, 255, 0.35)';
          }}
        >
          <span>New Document</span>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              color: '#0050FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={14} strokeWidth={3} />
          </div>
        </button>
      </div>

      {/* =========================================================================
          2. THREE-PANE WORKSPACE (DESIGN.md Generous 28px Radii & Dark Glass)
         ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '230px 320px 1fr',
          gap: '20px',
          minHeight: '680px',
        }}
        className="notes-workspace-grid"
      >
        {/* =======================================================================
            PANE 1: CATEGORIES & FOLDERS
           ======================================================================= */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)', // --bg-card
            backdropFilter: 'blur(16px)',
            borderRadius: '28px', // --radius-cards
            padding: '20px 16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Header Tag */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              color: '#64748b',
              textTransform: 'uppercase',
              paddingLeft: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={13} color="#0050FF" />
            <span>CATEGORIES</span>
          </div>

          {/* All Documents Button */}
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            style={{
              padding: '10px 14px',
              borderRadius: '50px', // --radius-full
              backgroundColor: categoryFilter === 'all' ? 'rgba(0, 80, 255, 0.16)' : 'transparent',
              color: categoryFilter === 'all' ? '#38bdf8' : '#94a3b8',
              border: categoryFilter === 'all' ? '1px solid rgba(0, 80, 255, 0.4)' : '1px solid transparent',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (categoryFilter !== 'all') {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (categoryFilter !== 'all') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={14} />
              <span>All Documents</span>
            </div>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: categoryFilter === 'all' ? 'rgba(0, 80, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                color: categoryFilter === 'all' ? '#ffffff' : '#94a3b8',
                fontWeight: 600,
              }}
            >
              {notes.length}
            </span>
          </button>

          {/* Category List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1 }}>
            {categories.map((cat) => {
              const count = notes.filter((n) => n.category === cat).length;
              const isCatActive = categoryFilter === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '50px',
                    backgroundColor: isCatActive ? 'rgba(0, 80, 255, 0.16)' : 'transparent',
                    color: isCatActive ? '#38bdf8' : '#94a3b8',
                    border: isCatActive ? '1px solid rgba(0, 80, 255, 0.4)' : '1px solid transparent',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCatActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCatActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Folder size={14} color={isCatActive ? '#0050FF' : '#64748b'} />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                      {cat}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: isCatActive ? 'rgba(0, 80, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                      color: isCatActive ? '#ffffff' : '#94a3b8',
                      fontWeight: 600,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Storage Badge */}
          <div
            style={{
              padding: '12px',
              borderRadius: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '11px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
            <span>IndexedDB Encrypted</span>
          </div>
        </div>

        {/* =======================================================================
            PANE 2: SEARCH & NOTES LIST
           ======================================================================= */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: '28px',
            padding: '20px 16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Search Box (50px Pill) */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                fontSize: '13px',
                backgroundColor: 'rgba(11, 15, 25, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50px', // --radius-full
                color: '#f8fafc',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.6)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
          </div>

          {/* Notes Card List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              overflowY: 'auto',
              flex: 1,
              paddingRight: '4px',
            }}
          >
            {filteredNotes.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '13px',
                }}
              >
                No matching documents.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = note.id === selectedNoteId;

                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '18px', // --radius-lg
                      backgroundColor: isSelected
                        ? 'rgba(0, 80, 255, 0.12)'
                        : 'rgba(30, 41, 59, 0.4)',
                      border: isSelected
                        ? '1.5px solid rgba(0, 80, 255, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      boxShadow: isSelected ? '0 0 20px rgba(0, 80, 255, 0.2)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.7)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.4)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '14px',
                          color: isSelected ? '#38bdf8' : '#f8fafc',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                        }}
                      >
                        {note.title}
                      </div>
                      {note.isPinned && (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 80, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Pin size={11} color="#38bdf8" />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#94a3b8' }}>
                      {/* Category Tag (10px radius) */}
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? 'rgba(0, 80, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                          color: isSelected ? '#38bdf8' : '#cbd5e1',
                          fontWeight: 500,
                        }}
                      >
                        {note.category}
                      </span>
                      <span>{formatRelativeTime(note.updatedAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* =======================================================================
            PANE 3: ACTIVE NOTE WORKSPACE & MARKDOWN EDITOR
           ======================================================================= */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: '28px',
            padding: '28px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
          }}
        >
          {selectedNoteId ? (
            <>
              {/* Note Header Toolbar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                  paddingBottom: '18px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {/* Title Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '240px' }}>
                  <input
                    type="text"
                    value={activeTitle}
                    onChange={(e) => setActiveTitle(e.target.value)}
                    onBlur={handleSaveActiveNote}
                    placeholder="Untitled Note..."
                    style={{
                      fontSize: '22px',
                      fontWeight: 700,
                      color: '#f8fafc',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      letterSpacing: '-0.03em',
                    }}
                  />
                  {lastSavedTime && (
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={11} color="#10b981" />
                      Auto-saved ({lastSavedTime})
                    </span>
                  )}
                </div>

                {/* Toolbar Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Category Pill Input */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '10px', // --radius-small
                      backgroundColor: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Tag size={12} color="#94a3b8" />
                    <input
                      type="text"
                      value={activeCategory}
                      onChange={(e) => setActiveCategory(e.target.value)}
                      onBlur={handleSaveActiveNote}
                      placeholder="Category"
                      style={{
                        width: '100px',
                        background: 'transparent',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '12px',
                        fontWeight: 500,
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Pin Toggle Button (Pill 50px) */}
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '50px',
                      backgroundColor: activeIsPinned ? 'rgba(0, 80, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      border: activeIsPinned ? '1px solid #0050FF' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: activeIsPinned ? '#38bdf8' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title={activeIsPinned ? 'Unpin note' : 'Pin to top'}
                  >
                    <Pin size={13} />
                    <span>{activeIsPinned ? 'Pinned' : 'Pin'}</span>
                  </button>

                  {/* Preview / Edit Toggle Segmented Pill */}
                  <div
                    style={{
                      display: 'inline-flex',
                      borderRadius: '50px',
                      backgroundColor: 'rgba(11, 15, 25, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '3px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '50px',
                        backgroundColor: isEditing ? '#0050FF' : 'transparent',
                        color: isEditing ? '#ffffff' : '#94a3b8',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '50px',
                        backgroundColor: !isEditing ? '#0050FF' : 'transparent',
                        color: !isEditing ? '#ffffff' : '#94a3b8',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Eye size={12} />
                      <span>Preview</span>
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(selectedNoteId)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      color: '#f43f5e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="Delete Note"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f43f5e';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)';
                      e.currentTarget.style.color = '#f43f5e';
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Editor / Markdown Body */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {isEditing ? (
                  <textarea
                    value={activeContent}
                    onChange={(e) => setActiveContent(e.target.value)}
                    onBlur={handleSaveActiveNote}
                    placeholder="Write markdown content here... (supports # headings, - lists, tables, code blocks)"
                    style={{
                      flex: 1,
                      minHeight: '480px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '13.5px',
                      lineHeight: 1.65,
                      resize: 'none',
                      backgroundColor: 'rgba(11, 15, 25, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '18px',
                      padding: '20px',
                      color: '#f8fafc',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.5)')}
                  />
                ) : (
                  <div
                    style={{
                      flex: 1,
                      minHeight: '480px',
                      padding: '24px',
                      borderRadius: '18px',
                      backgroundColor: 'rgba(11, 15, 25, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      overflowY: 'auto',
                      color: '#f8fafc',
                      lineHeight: 1.65,
                    }}
                    className="markdown-rendered-view"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeContent || '*No content in document.*'}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<FileText size={28} />}
              title="No Document Selected"
              description="Select a strategy note from the list or initialize a fresh document."
              actionText="Create New Document"
              onAction={handleCreateNewNote}
            />
          )}
        </div>
      </div>

      {/* Embedded CSS for Markdown Rendering & Workspace Grid */}
      <style>{`
        @media (max-width: 1024px) {
          .notes-workspace-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .markdown-rendered-view h1 {
          font-size: 24px;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 16px;
          letter-spacing: -0.03em;
        }
        .markdown-rendered-view h2 {
          font-size: 19px;
          font-weight: 600;
          color: #38bdf8;
          margin-top: 20px;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .markdown-rendered-view h3 {
          font-size: 16px;
          font-weight: 600;
          color: #f8fafc;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .markdown-rendered-view p {
          font-size: 14px;
          color: #cbd5e1;
          margin-bottom: 12px;
          lineHeight: 1.6;
        }
        .markdown-rendered-view ul, .markdown-rendered-view ol {
          padding-left: 20px;
          margin-bottom: 14px;
          color: #cbd5e1;
        }
        .markdown-rendered-view li {
          margin-bottom: 4px;
        }
        .markdown-rendered-view code {
          background-color: rgba(255, 255, 255, 0.08);
          color: #38bdf8;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 12.5px;
        }
        .markdown-rendered-view pre {
          background-color: #030712;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 14px;
          border-radius: 12px;
          overflow-x: auto;
          margin-bottom: 14px;
        }
        .markdown-rendered-view blockquote {
          border-left: 3px solid #0050FF;
          padding-left: 14px;
          color: #94a3b8;
          margin-left: 0;
          margin-bottom: 14px;
        }
        .markdown-rendered-view table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        .markdown-rendered-view th, .markdown-rendered-view td {
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px 12px;
          font-size: 13px;
        }
        .markdown-rendered-view th {
          background-color: rgba(255, 255, 255, 0.04);
          color: #f8fafc;
        }
      `}</style>
    </div>
  );
};
