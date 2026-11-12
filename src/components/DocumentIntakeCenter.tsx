import React, { useEffect, useRef, useState } from 'react';
import { Api } from '../services/api';
import { OffenderCase, VerificationResult, ExtractedField, UploadedDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud, FileText, FileCheck, CheckCircle2,
  AlertTriangle, Check, X, Sparkles, ArrowRight, ShieldCheck,
  Trash2, Loader2, ClipboardCheck, Lock, History, Search, Eye,
} from 'lucide-react';

interface DocumentIntakeCenterProps {
  cases: OffenderCase[];
  selectedCaseId?: string;
  onSelectCase?: (caseId: string) => void;
  onRefreshCase?: () => void;
  showAlert: (msg: string, title?: string) => void;
  mode?: 'facility' | 'person';
}

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.docx', '.xlsx', '.xls', '.csv', '.pdf', '.txt'];

export const DocumentIntakeCenter: React.FC<DocumentIntakeCenterProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onRefreshCase,
  showAlert,
  mode = 'facility',
}) => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // Target case for person mode or facility manual assignment
  const [targetCaseId, setTargetCaseId] = useState<string>(
    mode === 'person' && selectedCaseId ? selectedCaseId : selectedCaseId || ''
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [reviewFields, setReviewFields] = useState<ExtractedField[]>([]);
  const [sheets, setSheets] = useState<string[]>([]);
  const [tablePreview, setTablePreview] = useState<any[]>([]);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);

  // Auto-detection state from facility upload
  const [detectedCaseId, setDetectedCaseId] = useState<string | null>(null);
  const [detectionReason, setDetectionReason] = useState<string | null>(null);

  // Document history state
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [docFilter, setDocFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  // Load document history
  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const filterCase = mode === 'person' ? selectedCaseId : undefined;
      const res = await Api.getDocuments(filterCase);
      setDocuments(res.documents || []);
    } catch (err: any) {
      console.warn('Could not load document history:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (mode === 'person' && selectedCaseId) {
      setTargetCaseId(selectedCaseId);
    }
    fetchDocuments();
  }, [mode, selectedCaseId]);

  const clearResults = () => {
    setUploadedDoc(null);
    setVerificationResult(null);
    setReviewFields([]);
    setSheets([]);
    setTablePreview([]);
    setDetectedCaseId(null);
    setDetectionReason(null);
    setCommitSuccess(false);
  };

  const chooseFile = (file?: File) => {
    if (!file) return;
    const extension = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      showAlert(
        'Supported formats: Word (.docx), Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf), and Text (.txt). Legacy binary .doc is not supported.',
        'Unsupported File Format'
      );
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showAlert('The selected document exceeds the 15 MB limit.', 'File Too Large');
      return;
    }
    setSelectedFile(file);
    clearResults();
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      showAlert('Choose a document file first, then proceed with analysis.', 'No Document Selected');
      return;
    }

    if (mode === 'person' && !targetCaseId) {
      showAlert('Select a valid case record in Person Workspace before uploading.', 'No Target Case');
      return;
    }

    setIsUploading(true);
    clearResults();

    try {
      const uploadCaseParam = mode === 'person' ? targetCaseId : targetCaseId || undefined;
      const result = await Api.uploadDocument(uploadCaseParam, selectedFile);

      setUploadedDoc(result.document);
      setVerificationResult(result.verification);
      setReviewFields(result.verification?.fields || []);
      setSheets(result.sheets || []);
      setTablePreview(result.tablePreview || []);
      setDetectedCaseId(result.detected_case_id || null);
      setDetectionReason(result.detection_reason || null);

      if (result.detected_case_id && !targetCaseId) {
        setTargetCaseId(result.detected_case_id);
      }

      await fetchDocuments();

      if (!result.verification?.rawTextPreview?.trim()) {
        showAlert(
          'Document uploaded, but no extractable text was found. If this is a scanned PDF, OCR is required.',
          'No Readable Text'
        );
      } else if (!result.verification.fields?.length) {
        if (!result.document.case_id || result.document.case_id === 'unassigned') {
          showAlert(
            'Document uploaded to Facility Centre. Please assign it to a case record to run comparative verification.',
            'Facility Intake Stored'
          );
        } else {
          showAlert(
            'Document read successfully, but no matching case fields were identified in text.',
            'Review Document Text'
          );
        }
      } else {
        showAlert(
          `Extracted ${result.verification.fields.length} candidate field(s). Review each value before human authorization.`,
          'Evidence Extracted'
        );
      }
    } catch (error: any) {
      showAlert(error?.message || 'Document intake failed.', 'Upload Error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAssignToCase = async (caseIdToAssign: string) => {
    if (!uploadedDoc) return;
    try {
      setIsUploading(true);
      const res = await Api.assignDocument(uploadedDoc.id, caseIdToAssign);
      setUploadedDoc(res.document);
      setVerificationResult(res.verification);
      setReviewFields(res.verification.fields || []);
      setTargetCaseId(caseIdToAssign);
      await fetchDocuments();
      showAlert(`Document assigned to case ${caseIdToAssign}. Comparative verification generated.`, 'Assigned');
    } catch (err: any) {
      showAlert(err.message || 'Assignment failed.', 'Error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRejectDocument = async (docId: string) => {
    try {
      await Api.rejectDocument(docId, 'Human reviewer declined candidate evidence.');
      await fetchDocuments();
      if (uploadedDoc?.id === docId) {
        setUploadedDoc(prev => (prev ? { ...prev, status: 'rejected' } : null));
      }
      showAlert('Document marked as rejected in official record and audit trail.', 'Intake Rejected');
    } catch (err: any) {
      showAlert(err.message || 'Rejection failed.', 'Error');
    }
  };

  const updateField = (index: number, updates: Partial<ExtractedField>) => {
    setReviewFields(prev => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const handleCommitVerified = async () => {
    if (!uploadedDoc) return;

    const accepted = reviewFields
      .filter(f => f.humanStatus === 'accepted')
      .map(f => ({
        fieldName: f.fieldName,
        finalValue: f.correctedValue !== undefined ? f.correctedValue : f.extractedValue,
      }));

    if (!accepted.length) {
      showAlert('Please explicitly approve at least one field before committing.', 'No Approved Fields');
      return;
    }

    setIsCommitting(true);
    try {
      await Api.commitVerifiedFields(uploadedDoc.id, accepted);
      setCommitSuccess(true);
      if (onRefreshCase) onRefreshCase();
      await fetchDocuments();
      showAlert(
        `Committed ${accepted.length} verified value(s) to case ${uploadedDoc.case_id}. Audit record updated.`,
        'Case Record Updated'
      );
    } catch (error: any) {
      showAlert(error?.message || 'Commit failed.', 'Permission Denied');
    } finally {
      setIsCommitting(false);
    }
  };

  const currentPersonCase = cases.find(c => c.id === targetCaseId);

  const filteredDocs = documents.filter(doc => {
    if (docFilter === 'all') return true;
    if (docFilter === 'pending') return doc.status === 'pending_review';
    if (docFilter === 'verified') return doc.status === 'verified_applied';
    if (docFilter === 'rejected') return doc.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-[#0b1a30] via-[#0d223d] to-[#0b1a30] border border-[#1e3a5f] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${mode === 'person' ? 'bg-[#38bdf8]' : 'bg-[#5cc2bd]'}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${mode === 'person' ? 'text-[#38bdf8]' : 'text-[#5cc2bd]'}`}>
                {mode === 'person' ? 'Person-Level Case Document Intake' : 'Facility Document Intake Centre'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white m-0">
              {mode === 'person' && currentPersonCase
                ? `Evidence Intake: ${currentPersonCase.first_name} ${currentPersonCase.last_name} (${currentPersonCase.id})`
                : 'Facility Intake & Evidence Extraction'}
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              {mode === 'person'
                ? 'Ingest parole reports, educational transcripts, attendance sheets, and certificates directly into this person\'s case file.'
                : 'Facility-wide document repository. Ingest multi-source records, automatically detect prisoner identity, and verify evidence before saving.'}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            {mode === 'person' && currentPersonCase ? (
              <div className="px-4 py-2 rounded-xl bg-sky-950/60 border border-sky-500/40 text-xs font-mono text-sky-200 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Locked to Target: <strong>{currentPersonCase.id}</strong></span>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-[#071325]/90 border border-[#1e3a5f] text-xs font-mono text-slate-300">
                Facility Scope: <strong className="text-[#5cc2bd]">All Active Cases</strong>
              </div>
            )}
            <span className="text-xs text-slate-400 font-mono">
              Accepted: .docx, .xlsx, .xls, .csv, .pdf, .txt (max 15MB)
            </span>
          </div>
        </div>
      </div>

      {/* Target Case Context / Selection Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white m-0 flex items-center gap-2">
              <ClipboardCheck className="w-4.5 h-4.5 text-[#38bdf8]" />
              Target Case Assignment
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'person'
                ? 'Documents uploaded in Person Workspace are automatically bound to this case file.'
                : 'Select an intended case record or allow automatic reference extraction to identify the case.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {mode === 'person' && currentPersonCase ? (
              <div className="py-2 px-4 rounded-xl bg-[#0f2744] border border-[#1e3a5f] text-sm font-semibold text-white">
                {currentPersonCase.id} · {currentPersonCase.first_name} {currentPersonCase.last_name}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-300">Assign To Case:</label>
                <select
                  value={targetCaseId}
                  onChange={(e) => setTargetCaseId(e.target.value)}
                  className="text-xs py-2 px-3 rounded-xl border border-[#1e3a5f] bg-[#0f2744] text-white font-medium"
                >
                  <option value="">-- Auto-Detect From Document Text --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} · {c.first_name} {c.last_name} ({c.crime_type})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {detectedCaseId && detectionReason && (
          <div className="mt-4 p-3 rounded-xl bg-sky-950/40 border border-sky-500/40 flex items-center gap-3 text-xs text-sky-200">
            <Sparkles className="w-4 h-4 text-[#38bdf8] shrink-0" />
            <div>
              <strong>Case Identified Automatically:</strong> {detectionReason} (Target: {detectedCaseId})
            </div>
          </div>
        )}
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="card">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) chooseFile(e.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#0284c7] bg-[#0284c7]/10'
              : 'border-[#1e3a5f] hover:border-[#0284c7]/60 hover:bg-[#0f2744]/40 bg-[#071325]'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".docx,.xlsx,.xls,.csv,.pdf,.txt"
            onChange={(e) => {
              if (e.target.files?.[0]) chooseFile(e.target.files[0]);
            }}
          />

          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#0b1a30] border border-[#1e3a5f] flex items-center justify-center text-[#38bdf8] shadow-lg">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-base font-semibold text-white m-0">
                {selectedFile ? selectedFile.name : 'Click to select or drag and drop document'}
              </p>
              <p className="text-xs text-slate-400 mt-1 m-0">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB · Ready to analyze`
                  : 'Word (.docx), Excel (.xlsx, .xls), CSV, or text-based PDF'}
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadAndAnalyze();
                  }}
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl bg-[#0079d6] hover:bg-[#0284c7] text-white text-xs font-semibold shadow-lg shadow-[#0079d6]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isUploading ? 'Extracting & Verifying...' : 'Process Document & Extract Evidence'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    clearResults();
                  }}
                  className="sec text-xs px-3.5 py-2.5 rounded-xl cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification & Diff Review Section */}
      {verificationResult && uploadedDoc && (
        <div className="card space-y-5 border-t-3 border-[#0284c7]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e3a5f]">
            <div>
              <div className="flex items-center gap-2">
                <span className="tag text-xs font-bold uppercase tracking-wider">
                  Mandatory Human Review
                </span>
                <span className="text-xs font-mono text-slate-400">Doc ID: {uploadedDoc.id}</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1 m-0">
                Extracted Evidence Comparison ({uploadedDoc.original_name})
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Target Record: <strong>{uploadedDoc.case_id}</strong> · Reviewer:{' '}
                <strong>{user?.full_name} ({user?.role})</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRejectDocument(uploadedDoc.id)}
                className="sec border-rose-500/40 text-rose-300 hover:bg-rose-950/30 text-xs px-3.5 py-2 rounded-xl cursor-pointer"
              >
                Reject Document
              </button>
            </div>
          </div>

          {/* Unassigned case helper if in facility mode */}
          {uploadedDoc.case_id === 'unassigned' && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  This document is not yet linked to a prisoner profile. Select a target case to compare values and commit evidence.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={targetCaseId}
                  onChange={(e) => setTargetCaseId(e.target.value)}
                  className="py-1 px-2.5 rounded-lg bg-[#0b1a30] text-white border border-[#1e3a5f] text-xs"
                >
                  <option value="">Choose Case...</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} · {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!targetCaseId}
                  onClick={() => handleAssignToCase(targetCaseId)}
                  className="px-3 py-1 bg-[#0284c7] text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40"
                >
                  Assign &amp; Compare
                </button>
              </div>
            </div>
          )}

          {/* Extracted Fields Table */}
          {reviewFields.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-[#1e3a5f]">
              <table className="app-table w-full text-left">
                <thead>
                  <tr className="bg-[#0f2744] text-slate-300 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Target Field</th>
                    <th className="py-3 px-4 font-semibold">Current Case Value</th>
                    <th className="py-3 px-4 font-semibold">Extracted Evidence</th>
                    <th className="py-3 px-4 font-semibold">Source Context</th>
                    <th className="py-3 px-4 font-semibold text-right">Human Authorization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3a5f] text-xs">
                  {reviewFields.map((field, index) => {
                    const isAccepted = field.humanStatus === 'accepted';
                    const isRejected = field.humanStatus === 'rejected';

                    return (
                      <tr key={index} className="hover:bg-[#0f2744]/40">
                        <td className="py-3 px-4 font-semibold text-white">
                          {field.fieldLabel}
                          <span className="block font-mono text-[10px] text-slate-400">{field.fieldName}</span>
                        </td>

                        <td className="py-3 px-4 text-slate-300 font-mono">
                          {Array.isArray(field.currentValue)
                            ? field.currentValue.join(', ') || 'None recorded'
                            : field.currentValue != null
                            ? String(field.currentValue)
                            : 'N/A'}
                        </td>

                        <td className="py-3 px-4 text-white font-mono font-bold">
                          {Array.isArray(field.extractedValue)
                            ? field.extractedValue.join(', ')
                            : String(field.extractedValue)}
                          {field.isConflict && (
                            <span className="block text-[10px] text-amber-300 font-sans font-normal mt-0.5">
                              {field.conflictDescription || 'Differs from existing value'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-400 italic max-w-xs truncate" title={field.sourceCitation}>
                          {field.sourceCitation}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateField(index, { humanStatus: 'accepted' })}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isAccepted
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-[#0f2744] hover:bg-emerald-950/60 text-slate-300 border border-[#1e3a5f]'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 inline mr-1" />
                              Approve
                            </button>

                            <button
                              type="button"
                              onClick={() => updateField(index, { humanStatus: 'rejected' })}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isRejected
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-[#0f2744] hover:bg-rose-950/60 text-slate-300 border border-[#1e3a5f]'
                              }`}
                            >
                              <X className="w-3.5 h-3.5 inline mr-1" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#071325] text-xs text-slate-400 text-center">
              No matching structured fields found for automatic extraction in this document.
            </div>
          )}

          {/* Verification Commit Controls */}
          {reviewFields.length > 0 && uploadedDoc.case_id !== 'unassigned' && (
            <div className="pt-3 border-t border-[#1e3a5f] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Approvals: <strong className="text-emerald-400">{reviewFields.filter(f => f.humanStatus === 'accepted').length}</strong> of {reviewFields.length} field(s) accepted.
              </div>

              <button
                type="button"
                onClick={handleCommitVerified}
                disabled={isCommitting || !reviewFields.some(f => f.humanStatus === 'accepted')}
                className="px-6 py-2.5 rounded-xl bg-[#0079d6] hover:bg-[#0284c7] text-white text-xs font-semibold shadow-lg shadow-[#0079d6]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isCommitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Commit Verified Evidence to Case Record</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Document History Table */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white m-0 flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-[#5cc2bd]" />
              {mode === 'person' ? 'Case Document Audit History' : 'Facility Ingested Documents'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Persistent repository of all uploaded intake records, source files, and verification statuses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'pending', 'verified', 'rejected'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setDocFilter(tab)}
                className={`text-xs px-2.5 py-1 rounded-lg capitalize cursor-pointer font-medium ${
                  docFilter === tab
                    ? 'bg-[#0284c7] text-white'
                    : 'bg-[#0f2744] text-slate-300 hover:text-white border border-[#1e3a5f]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {isLoadingDocs ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#38bdf8]" />
            Loading intake documents...
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-[#1e3a5f]">
            <table className="app-table w-full text-left">
              <thead>
                <tr className="bg-[#0f2744] text-slate-300 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Document</th>
                  <th className="py-3 px-4 font-semibold">Assigned Case</th>
                  <th className="py-3 px-4 font-semibold">Uploader</th>
                  <th className="py-3 px-4 font-semibold">Uploaded Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3a5f] text-xs">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#0f2744]/40">
                    <td className="py-3 px-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#38bdf8] shrink-0" />
                        <span className="truncate max-w-xs" title={doc.original_name}>
                          {doc.original_name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {doc.case_id !== 'unassigned' ? (
                        <span className="text-[#38bdf8] font-semibold">{doc.case_id}</span>
                      ) : (
                        <span className="text-amber-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {doc.uploaded_by_name}
                      <span className="block text-[10px] text-slate-400">{doc.uploaded_by_role}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(doc.created_at).toLocaleDateString()} {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {doc.status === 'verified_applied' ? (
                        <span className="tag o text-xs font-semibold">Verified &amp; Applied</span>
                      ) : doc.status === 'rejected' ? (
                        <span className="tag b text-xs font-semibold">Rejected</span>
                      ) : (
                        <span className="tag w text-xs font-semibold">Pending Review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No uploaded documents found matching this view.
          </div>
        )}
      </div>
    </div>
  );
};
