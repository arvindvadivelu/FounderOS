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
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { EmptyState } from '../components/common/EmptyState';
import { createNote, updateNote, deleteNote } from '../db/services/goalNoteService';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { Note } from '../types';

export const NotesPage: React.FC = () => {
  const { showToast } = useToast();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(true);

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
    }
  }, [selectedNoteId, notes]);

  const handleCreateNewNote = async () => {
    const newNote = await createNote({
      title: 'Untitled Note',
      content: '# New Document\n\nWrite your thoughts, strategy, or specifications here...',
      category: categoryFilter !== 'all' ? categoryFilter : 'Strategy',
      tags: [],
      isPinned: false,
    });
    setSelectedNoteId(newNote.id);
    setIsEditing(true);
  };

  const handleSaveActiveNote = async () => {
    if (!selectedNoteId) return;
    await updateNote(selectedNoteId, {
      title: activeTitle || 'Untitled',
      category: activeCategory || 'General',
      content: activeContent,
      isPinned: activeIsPinned,
    });
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
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
            Knowledge Base & Strategy Notes
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Write and organize company operating playbooks, customer security FAQs, and product specs.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNewNote}
          className="btn-primary"
        >
          <Plus size={15} /> New Note
        </button>
      </div>

      {/* 3-Pane Notes Workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 300px 1fr',
          gap: '16px',
          minHeight: '620px',
        }}
        className="notes-workspace-grid"
      >
        {/* Left Pane: Categories */}
        <SpotlightCard style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Categories
          </div>

          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: categoryFilter === 'all' ? 'var(--primary-blue-surface)' : 'transparent',
              color: categoryFilter === 'all' ? 'var(--brand-accent)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: 'none',
              textAlign: 'left',
            }}
          >
            <span>All Documents</span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{notes.length}</span>
          </button>

          {categories.map((cat) => {
            const count = notes.filter((n) => n.category === cat).length;
            const isCatActive = categoryFilter === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCatActive ? 'var(--primary-blue-surface)' : 'transparent',
                  color: isCatActive ? 'var(--brand-accent)' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: 'none',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Folder size={14} />
                  <span>{cat}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{count}</span>
              </button>
            );
          })}
        </SpotlightCard>

        {/* Middle Pane: Notes List */}
        <SpotlightCard style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="input-field"
              style={{ paddingLeft: '32px', fontSize: '12px', padding: '6px 10px 6px 32px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {filteredNotes.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12.5px' }}>
                No notes found.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = note.id === selectedNoteId;

                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--primary-blue-surface)' : 'var(--bg-surface-elevated)',
                      border: isSelected ? '1px solid var(--border-active)' : '1px solid var(--border-faint)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '13px',
                          color: isSelected ? 'var(--brand-accent)' : 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '200px',
                        }}
                      >
                        {note.title}
                      </div>
                      {note.isPinned && <Pin size={12} color="var(--brand-accent)" />}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
                      <span>{note.category}</span>
                      <span>{formatRelativeTime(note.updatedAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SpotlightCard>

        {/* Right Pane: Active Note Editor & Markdown Viewer */}
        <SpotlightCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedNoteId ? (
            <>
              {/* Note Header Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '220px' }}>
                  <input
                    type="text"
                    value={activeTitle}
                    onChange={(e) => setActiveTitle(e.target.value)}
                    onBlur={handleSaveActiveNote}
                    placeholder="Note Title"
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    onBlur={handleSaveActiveNote}
                    placeholder="Category"
                    className="input-field"
                    style={{ width: '110px', padding: '4px 8px', fontSize: '11.5px' }}
                  />

                  <button
                    type="button"
                    onClick={handleTogglePin}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: activeIsPinned ? 'var(--primary-blue-surface)' : 'var(--bg-surface-elevated)',
                      color: activeIsPinned ? 'var(--brand-accent)' : 'var(--text-dim)',
                      fontSize: '12px',
                    }}
                    title={activeIsPinned ? 'Unpin' : 'Pin to top'}
                  >
                    <Pin size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
                    <span>{isEditing ? 'Preview' : 'Edit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteNote(selectedNoteId)}
                    style={{ padding: '6px', color: 'var(--text-dim)' }}
                    title="Delete Note"
                  >
                    <Trash2 size={15} />
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
                    placeholder="Write markdown content here..."
                    className="input-field"
                    style={{
                      flex: 1,
                      minHeight: '440px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      resize: 'none',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      flex: 1,
                      minHeight: '440px',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      overflowY: 'auto',
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeContent || '*Empty note*'}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<FileText size={24} />}
              title="No note selected"
              description="Select a note from the left list or create a new strategy document."
              actionText="Create New Note"
              onAction={handleCreateNewNote}
            />
          )}
        </SpotlightCard>
      </div>
    </div>
  );
};
