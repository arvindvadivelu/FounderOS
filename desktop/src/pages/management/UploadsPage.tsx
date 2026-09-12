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
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import {
  getAllUploadedFiles,
  createUploadedFile,
  deleteUploadedFile,
} from '../../db/services/managementService';
import { formatDate } from '../../utils/formatters';
import type { UploadedFile, UploadCategory } from '../../types';

export const UploadsPage: React.FC = () => {
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
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setFDescription('');
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
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

      {/* Header Banner */}
      <SpotlightCard
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(0, 80, 255, 0.15) 0%, rgba(15, 23, 42, 0.88) 100%)',
          borderColor: 'rgba(0, 80, 255, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-accent)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              MANAGEMENT / DOCUMENT VAULT
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Uploads & Corporate Vault
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '600px' }}>
            Secure local-first document repository for founder contracts, MSAs, receipts, tax returns, and pitch decks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '13.5px' }}
        >
          <Upload size={16} /> Upload Document
        </button>
      </SpotlightCard>

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
      <SpotlightCard style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            <input
              type="text"
              placeholder="Search documents by name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', fontSize: '12.5px' }}
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
        <SpotlightCard style={{ padding: 0, overflow: 'hidden' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--primary-blue-surface)',
                            color: 'var(--brand-accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {file.mimeType.startsWith('image/') ? <Image size={16} /> : <FileText size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{file.name}</div>
                          {file.description && (
                            <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                              {file.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11.5px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-faint)',
                          color: 'var(--text-muted)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {file.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                        {file.fileType}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatBytes(file.sizeBytes)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        {formatDate(file.createdAt)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="Preview"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="Download"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(file.id, file.name)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--accent-rose)' }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
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
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Document Category *
            </label>
            <select
              value={fCategory}
              onChange={(e) => setFCategory(e.target.value as UploadCategory)}
              className="input-field"
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
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Description / Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Key notes, agreement dates, signatories..."
              value={fDescription}
              onChange={(e) => setFDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setIsUploadModalOpen(false);
                setSelectedFile(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={isUploading} className="btn-primary">
              {isUploading ? 'Encrypting & Saving...' : 'Save to Vault'}
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
              <div style={{ textAlign: 'center', backgroundColor: '#000000', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <img
                  src={previewFile.dataBase64}
                  alt={previewFile.name}
                  style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <FileText size={48} color="var(--brand-accent)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {previewFile.name}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '400px', margin: '4px auto 16px' }}>
                  {previewFile.description || 'This document is safely stored locally in your browser IndexedDB.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleDownload(previewFile)}
                  className="btn-primary"
                  style={{ margin: '0 auto' }}
                >
                  <Download size={15} /> Download Document
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
