import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Paperclip,
  Upload,
  FileText,
  FileCode,
  FileCheck,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  CheckCircle2,
  FolderOpen,
  Image,
} from 'lucide-react';
import { db } from '../../db';
import { SpotlightCard } from '../../components/common/SpotlightCard';
import { MetricCard } from '../../components/common/MetricCard';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import {
  getAllUploadedFiles,
  createUploadedFile,
  deleteUploadedFile,
} from '../../db/services/managementService';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';
import type { UploadedFile, UploadCategory } from '../../types';

export const UploadsPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fCategory, setFCategory] = useState<UploadCategory>('contract');
  const [fDescription, setFDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  // Live Query
  const files = useLiveQuery(async () => await getAllUploadedFiles(), []) || [];

  // Metrics
  const totalStorageBytes = files.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const contractsCount = files.filter((f) => f.category === 'contract' || f.category === 'nda').length;
  const receiptsCount = files.filter((f) => f.category === 'receipt' || f.category === 'invoice').length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsUploadModalOpen(true);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await createUploadedFile(selectedFile, fCategory, fDescription);
      showToast('success', 'Document Uploaded', `Document "${selectedFile.name}" stored securely.`);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setFDescription('');
    } catch (err: any) {
      showToast('error', 'Upload Failed', err?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (file: UploadedFile) => {
    const a = document.createElement('a');
    a.href = file.dataBase64;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Permanently delete document "${name}" from local storage?`)) {
      await deleteUploadedFile(id);
      showToast('info', 'Document Removed', `File "${name}" removed from vault.`);
    }
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || f.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Editorial Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '10px', // DESIGN.md --radius-small: 10px
              backgroundColor: 'rgba(0, 80, 255, 0.1)',
              border: '1px solid rgba(0, 80, 255, 0.25)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 8px #38bdf8',
              }}
            />
            MANAGEMENT • CORPORATE VAULT & COMPLIANCE LEDGER
          </div>
          <h1
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 800,
              color: '#f8fafc',
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Uploads & Corporate Vault
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '640px' }}>
            Secure local-first document repository for founder contracts, MSAs, receipts, tax returns, and pitch decks.
          </p>
        </div>

        {/* Primary CTA Button with Action Indicator Dot */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
            padding: '10px 22px',
            backgroundColor: '#0050FF',
            color: '#ffffff',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a66ff')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0050FF')}
        >
          <Upload size={16} />
          <span>Upload Document</span>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              opacity: 0.9,
            }}
          />
        </button>
      </div>

      {/* Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          title="Stored Documents"
          value={`${files.length} Files`}
          subtitle="IndexedDB Local Vault"
          icon={<FolderOpen size={18} />}
        />

        <MetricCard
          title="Total Storage Footprint"
          value={formatBytes(totalStorageBytes)}
          subtitle="Zero cloud bandwidth"
          icon={<ShieldCheck size={18} />}
        />

        <MetricCard
          title="Contracts & NDAs"
          value={`${contractsCount} Agreements`}
          subtitle="Client & vendor legal"
          icon={<FileCheck size={18} />}
        />

        <MetricCard
          title="Receipts & Invoices"
          value={`${receiptsCount} Records`}
          subtitle="Accounting attachments"
          icon={<FileText size={18} />}
        />
      </div>

      {/* Search & Category Filter */}
      <SpotlightCard
        style={{
          padding: '16px 20px',
          borderRadius: '24px', // DESIGN.md --radius-cards: 24px
          backgroundColor: '#0b0f19',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search documents by name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                borderRadius: '50px', // DESIGN.md 50px pill
                padding: '9px 16px 9px 40px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                borderRadius: '50px', // DESIGN.md 50px pill
                padding: '8px 18px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '12.5px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Categories</option>
              <option value="contract">Contracts</option>
              <option value="nda">NDAs</option>
              <option value="receipt">Receipts</option>
              <option value="invoice">Invoices</option>
              <option value="pitch_deck">Pitch Decks</option>
              <option value="legal">Corporate / Legal</option>
              <option value="tax">Tax Returns</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </SpotlightCard>

      {/* Files List / Table */}
      {filteredFiles.length === 0 ? (
        <EmptyState
          title="No documents uploaded yet"
          description="Upload company files like your Certificate of Incorporation, customer contracts, or pitch decks. Files are stored locally in your browser."
          actionText="Upload First File"
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <SpotlightCard
          style={{
            padding: 0,
            borderRadius: '24px', // DESIGN.md --radius-cards: 24px
            backgroundColor: '#0b0f19',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Category</th>
                  <th>File Type</th>
                  <th>Size</th>
                  <th>Upload Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '12px', // DESIGN.md 12px soft rounded container (replaces 8px)
                            background: 'linear-gradient(135deg, rgba(0, 80, 255, 0.25) 0%, rgba(56, 189, 248, 0.15) 100%)',
                            border: '1px solid rgba(0, 80, 255, 0.35)',
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {file.mimeType.startsWith('image/') ? <Image size={16} /> : <FileText size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>{file.name}</div>
                          {file.description && (
                            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px', fontStyle: 'italic' }}>
                              {file.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          padding: '3px 9px',
                          borderRadius: '10px', // DESIGN.md 10px tag chip (replaces 4px)
                          backgroundColor: 'rgba(0, 80, 255, 0.1)',
                          border: '1px solid rgba(0, 80, 255, 0.25)',
                          color: '#38bdf8',
                          textTransform: 'capitalize',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                        }}
                      >
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: '#38bdf8',
                            boxShadow: '0 0 6px #38bdf8',
                          }}
                        />
                        {file.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          color: '#94a3b8',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          fontWeight: 600,
                        }}
                      >
                        {file.fileType}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                        {formatBytes(file.sizeBytes)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                        {formatDate(file.createdAt)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50px', // DESIGN.md 50px pill button
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.color = '#94a3b8';
                          }}
                          title="Preview Document"
                        >
                          <Eye size={12.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50px', // DESIGN.md 50px pill button
                            backgroundColor: 'rgba(0, 80, 255, 0.1)',
                            border: '1px solid rgba(0, 80, 255, 0.25)',
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 80, 255, 0.2)';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 80, 255, 0.1)';
                            e.currentTarget.style.color = '#38bdf8';
                          }}
                          title="Download Document"
                        >
                          <Download size={12.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(file.id, file.name)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50px', // DESIGN.md 50px pill button
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.color = '#fca5a5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                            e.currentTarget.style.color = '#f87171';
                          }}
                          title="Delete Document"
                        >
                          <Trash2 size={12.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SpotlightCard>
      )}

      {/* Upload Details Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedFile(null);
        }}
        title="Upload Document"
        subtitle={`Selected: ${selectedFile?.name} (${selectedFile ? formatBytes(selectedFile.size) : ''})`}
        maxWidth="480px"
      >
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Document Category *
            </label>
            <select
              value={fCategory}
              onChange={(e) => setFCategory(e.target.value as UploadCategory)}
              className="input-field"
              style={{
                borderRadius: '12px',
                padding: '10px 14px',
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '13.5px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <option value="contract">Contract / MSA</option>
              <option value="nda">Non-Disclosure Agreement (NDA)</option>
              <option value="receipt">Expense Receipt</option>
              <option value="invoice">Customer / Vendor Invoice</option>
              <option value="pitch_deck">Pitch Deck / Presentation</option>
              <option value="legal">Corporate / Legal Entity</option>
              <option value="tax">Tax Returns / Forms</option>
              <option value="other">Other Document</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Description / Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Key notes, agreement dates, signatories..."
              value={fDescription}
              onChange={(e) => setFDescription(e.target.value)}
              className="input-field"
              style={{
                borderRadius: '12px',
                padding: '10px 14px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '13.5px',
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => {
                setIsUploadModalOpen(false);
                setSelectedFile(null);
              }}
              style={{
                borderRadius: '50px', // DESIGN.md 50px pill button
                padding: '9px 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              style={{
                borderRadius: '50px', // DESIGN.md 50px pill button
                padding: '9px 22px',
                backgroundColor: '#0050FF',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isUploading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
                opacity: isUploading ? 0.7 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => !isUploading && (e.currentTarget.style.backgroundColor = '#1a66ff')}
              onMouseLeave={(e) => !isUploading && (e.currentTarget.style.backgroundColor = '#0050FF')}
            >
              <span>{isUploading ? 'Encrypting & Saving...' : 'Save to Vault'}</span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  opacity: 0.9,
                }}
              />
            </button>
          </div>
        </form>
      </Modal>

      {/* File Preview Modal */}
      <Modal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name || 'Document Preview'}
        subtitle={`Category: ${previewFile?.category.toUpperCase()} • Size: ${previewFile ? formatBytes(previewFile.sizeBytes) : ''}`}
        maxWidth="680px"
      >
        {previewFile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {previewFile.mimeType.startsWith('image/') ? (
              <div
                style={{
                  textAlign: 'center',
                  backgroundColor: '#000000',
                  padding: '16px',
                  borderRadius: '16px', // Eliminates sharp radius
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <img
                  src={previewFile.dataBase64}
                  alt={previewFile.name}
                  style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px' }}
                />
              </div>
            ) : (
              <div
                style={{
                  padding: '28px 24px',
                  borderRadius: '16px', // Eliminates sharp radius
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 80, 255, 0.15)',
                    border: '1px solid rgba(0, 80, 255, 0.3)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <FileText size={32} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {previewFile.name}
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', maxWidth: '420px', margin: '6px auto 20px' }}>
                  {previewFile.description || 'This document is safely stored locally in your browser IndexedDB.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleDownload(previewFile)}
                  style={{
                    borderRadius: '50px', // DESIGN.md 50px pill button
                    padding: '10px 22px',
                    backgroundColor: '#0050FF',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
                    margin: '0 auto',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a66ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0050FF')}
                >
                  <Download size={15} />
                  <span>Download Document</span>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      opacity: 0.9,
                    }}
                  />
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
