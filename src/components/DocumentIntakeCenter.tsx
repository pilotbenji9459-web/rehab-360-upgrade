import React, { useEffect, useRef, useState } from 'react';
import { Api } from '../services/api';
import { OffenderCase, VerificationResult, ExtractedField, UploadedDocument } from '../types';
import {
  UploadCloud, FileText, FileCheck, CheckCircle2,
  AlertTriangle, Check, X, Sparkles, ArrowRight, ShieldCheck,
  Trash2, Loader2, ClipboardCheck,
} from 'lucide-react';

interface DocumentIntakeCenterProps {
  cases: OffenderCase[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  onRefreshCase: () => void;
  showAlert: (msg: string, title?: string) => void;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.docx', '.xlsx', '.xls', '.csv', '.pdf', '.txt'];

export const DocumentIntakeCenter: React.FC<DocumentIntakeCenterProps> = ({
  cases, selectedCaseId, onSelectCase, onRefreshCase, showAlert,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [targetCaseId, setTargetCaseId] = useState(selectedCaseId || cases[0]?.id || '');
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

  useEffect(() => {
    if (selectedCaseId) setTargetCaseId(selectedCaseId);
    else if (!targetCaseId && cases.length) setTargetCaseId(cases[0].id);
  }, [selectedCaseId, cases, targetCaseId]);

  const clearResults = () => {
    setUploadedDoc(null);
    setVerificationResult(null);
    setReviewFields([]);
    setSheets([]);
    setTablePreview([]);
    setCommitSuccess(false);
  };

  const chooseFile = (file?: File) => {
    if (!file) return;
    const extension = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      showAlert('Choose a DOCX, XLSX, XLS, CSV, PDF, or TXT file. Legacy .doc files are not supported.', 'Unsupported file');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showAlert('The selected file is larger than 15 MB. Choose a smaller file.', 'File too large');
      return;
    }
    setSelectedFile(file);
    clearResults();
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      showAlert('Choose a document first, then start the analysis.', 'No document selected');
      return;
    }
    if (!targetCaseId) {
      showAlert('Create or select a case record before uploading a document.', 'No case selected');
      return;
    }

    setIsUploading(true);
    clearResults();
    try {
      const result = await Api.uploadDocument(targetCaseId, selectedFile);
      setUploadedDoc(result.document);
      setVerificationResult(result.verification);
      setReviewFields(result.verification?.fields || []);
      setSheets(result.sheets || []);
      setTablePreview(result.tablePreview || []);
      if (!result.verification?.rawTextPreview?.trim()) {
        showAlert('The file was received, but no readable text was returned. Try a text-based document rather than a scanned PDF.', 'No readable text');
      } else if (!(result.verification.fields || []).length) {
        showAlert('The document was read successfully, but no supported case fields were confidently identified. Check the extracted text preview below.', 'Review needed');
      }
    } catch (error: any) {
      showAlert(error?.message || 'The upload could not be processed. Check the server and try again.', 'Document intake failed');
    } finally {
      setIsUploading(false);
    }
  };

  const updateField = (index: number, updates: Partial<ExtractedField>) => {
    setReviewFields(previous => previous.map((field, i) => i === index ? { ...field, ...updates } : field));
  };

  const handleCommitVerified = async () => {
    if (!uploadedDoc) return;
    const accepted = reviewFields
      .filter(field => field.humanStatus === 'accepted')
      .map(field => ({ fieldName: field.fieldName, finalValue: field.extractedValue }));

    if (!accepted.length) {
      showAlert('Accept or correct at least one field before applying changes.', 'Nothing to apply');
      return;
    }

    setIsCommitting(true);
    try {
      await Api.commitVerifiedFields(uploadedDoc.id, accepted);
      setCommitSuccess(true);
      onRefreshCase();
      showAlert(`Applied ${accepted.length} staff-approved field(s) to case ${targetCaseId}.`, 'Case record updated');
    } catch (error: any) {
      showAlert(error?.message || 'The approved fields could not be saved.', 'Save failed');
    } finally {
      setIsCommitting(false);
    }
  };

  const acceptedCount = reviewFields.filter(field => field.humanStatus === 'accepted').length;
  const rejectedCount = reviewFields.filter(field => field.humanStatus === 'rejected').length;
  const formatValue = (value: any) => Array.isArray(value) ? value.join(', ') : String(value ?? 'Not recorded');
  const formatSize = (bytes: number) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="space-y-6 min-w-0 pb-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-[#07182d] via-[#0b2948] to-[#123b5b] p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure document workflow
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Document Intake Centre</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Bring case documents into one review space. Extracted information stays pending until an authorised staff member checks and approves it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-200">
            {['DOCX', 'XLSX / CSV', 'PDF', 'TXT'].map(type => (
              <span key={type} className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-semibold tracking-wide">{type}</span>
            ))}
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-2">15 MB max</span>
          </div>
        </div>
        <div className="relative z-10 mt-7 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { n: '01', title: 'Upload', desc: 'Select source file' },
            { n: '02', title: 'Inspect', desc: 'Review extracted data' },
            { n: '03', title: 'Approve', desc: 'Apply verified fields' },
          ].map((step, index) => (
            <div key={step.n} className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-200/30 bg-cyan-200/10 text-xs font-bold text-cyan-200">{step.n}</div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white sm:text-sm">{step.title}</p>
                <p className="hidden text-[11px] text-slate-400 sm:block">{step.desc}</p>
              </div>
              {index < 2 && <ArrowRight className="ml-auto hidden h-4 w-4 shrink-0 text-slate-500 sm:block" />}
            </div>
          ))}
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <section className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500"><UploadCloud className="h-5 w-5" /></div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Upload source document</h2>
              <p className="mt-0.5 text-xs text-[var(--mute)]">Choose the case this document belongs to.</p>
            </div>
          </div>

          <label htmlFor="intake-case-select" className="mb-2 block text-xs font-semibold text-[var(--ink)]">Target case record</label>
          <select
            id="intake-case-select"
            value={targetCaseId}
            onChange={event => { setTargetCaseId(event.target.value); onSelectCase(event.target.value); clearResults(); }}
            disabled={!cases.length || isUploading}
            className="mb-5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          >
            {cases.length ? cases.map(item => (
              <option key={item.id} value={item.id}>{item.id} — {item.first_name} {item.last_name}</option>
            )) : <option value="">No case records available</option>}
          </select>

          <input
            ref={inputRef}
            type="file"
            accept=".docx,.xlsx,.xls,.csv,.pdf,.txt"
            className="hidden"
            onChange={event => { chooseFile(event.target.files?.[0]); event.currentTarget.value = ''; }}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inputRef.current?.click(); } }}
            onDragOver={event => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={event => { event.preventDefault(); setIsDragging(false); }}
            onDrop={event => { event.preventDefault(); setIsDragging(false); chooseFile(event.dataTransfer.files?.[0]); }}
            className={`group cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:p-8 ${isDragging ? 'border-sky-500 bg-sky-500/10' : 'border-[var(--line)] bg-[var(--bg)] hover:border-sky-500/60 hover:bg-sky-500/5'}`}
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 transition group-hover:scale-105">
              {selectedFile ? <FileCheck className="h-7 w-7" /> : <UploadCloud className="h-7 w-7" />}
            </div>
            {selectedFile ? (
              <>
                <p className="break-all text-sm font-bold text-[var(--ink)]">{selectedFile.name}</p>
                <p className="mt-1 text-xs text-[var(--mute)]">{formatSize(selectedFile.size)} · Ready to process</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-[var(--ink)]">Drop your document here</p>
                <p className="mt-1 text-xs text-[var(--mute)]">or click to browse your device</p>
                <p className="mt-4 text-[11px] text-[var(--mute)]">DOCX, XLSX, XLS, CSV, PDF or TXT · Up to 15 MB</p>
              </>
            )}
          </div>

          {selectedFile && (
            <button type="button" onClick={() => { setSelectedFile(null); clearResults(); }} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--mute)] hover:text-rose-500">
              <Trash2 className="h-3.5 w-3.5" /> Remove selected file
            </button>
          )}

          <button
            type="button"
            disabled={!selectedFile || !targetCaseId || isUploading || isCommitting}
            onClick={handleUploadAndAnalyze}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-900/15 transition hover:from-sky-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading and extracting…</> : <><Sparkles className="h-4 w-4" /> Start extraction &amp; verification</>}
          </button>
          <p className="mt-3 text-center text-[11px] leading-5 text-[var(--mute)]">Nothing is added to the case record until staff explicitly approve fields in the review step.</p>
        </section>

        <section className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Extraction results</h2>
              <p className="mt-0.5 text-xs text-[var(--mute)]">A readable preview of what the parser found.</p>
            </div>
            {verificationResult && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600">Processed</span>}
          </div>

          {verificationResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[var(--bg)] p-3"><p className="text-xl font-bold text-[var(--ink)]">{reviewFields.length}</p><p className="text-[10px] text-[var(--mute)]">Candidate fields</p></div>
                <div className="rounded-xl bg-[var(--bg)] p-3"><p className="text-xl font-bold text-emerald-600">{acceptedCount}</p><p className="text-[10px] text-[var(--mute)]">Accepted</p></div>
                <div className="rounded-xl bg-[var(--bg)] p-3"><p className="text-xl font-bold text-rose-500">{rejectedCount}</p><p className="text-[10px] text-[var(--mute)]">Rejected</p></div>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
                <p className="mb-1 flex items-center gap-2 text-xs font-bold text-[var(--ink)]"><ClipboardCheck className="h-4 w-4 text-sky-500" /> Processing summary</p>
                <p className="text-xs leading-5 text-[var(--mute)]">{verificationResult.summary}</p>
              </div>
              {sheets.length > 0 && <div><p className="mb-2 text-xs font-bold text-[var(--ink)]">Worksheets detected</p><div className="flex flex-wrap gap-2">{sheets.map(sheet => <span key={sheet} className="rounded-lg bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-600">{sheet}</span>)}</div></div>}
              {tablePreview.length > 0 && (
                <div><p className="mb-2 text-xs font-bold text-[var(--ink)]">Spreadsheet preview</p><div className="max-h-40 overflow-auto rounded-xl border border-[var(--line)]"><table className="w-full text-left text-xs"><tbody>{tablePreview.slice(0, 5).map((row, rowIndex) => <tr key={rowIndex} className="border-b border-[var(--line)] last:border-0">{Object.values(row).map((value: any, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-2 text-[var(--mute)]">{String(value ?? '')}</td>)}</tr>)}</tbody></table></div></div>
              )}
              {verificationResult.warnings?.length > 0 && <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3"><p className="mb-2 flex items-center gap-2 text-xs font-bold text-amber-600"><AlertTriangle className="h-4 w-4" /> Items to check</p><ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-[var(--mute)]">{verificationResult.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}
              {verificationResult.rawTextPreview && <details className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3"><summary className="cursor-pointer text-xs font-bold text-[var(--ink)]">Show extracted text preview</summary><pre className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-[var(--mute)]">{verificationResult.rawTextPreview}</pre></details>}
              {!reviewFields.length && <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4"><p className="text-sm font-semibold text-[var(--ink)]">The document was read, but no supported case fields were identified.</p><p className="mt-1 text-xs leading-5 text-[var(--mute)]">Check the extracted text above. The current automatic matcher recognises a limited set of case fields; this does not mean the file upload failed.</p></div>}
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg)]/60 p-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-500/10 text-[var(--mute)]"><FileText className="h-7 w-7" /></div>
              <p className="text-sm font-semibold text-[var(--ink)]">Your document preview will appear here</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--mute)]">Select a case and upload a supported file to see extracted text, worksheet details, and verification results.</p>
            </div>
          )}
        </section>
      </div>

      {verificationResult && reviewFields.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500"><ClipboardCheck className="h-5 w-5" /></div><h2 className="text-base font-bold text-[var(--ink)]">Staff verification queue</h2></div>
              <p className="mt-2 text-xs leading-5 text-[var(--mute)]">Check each value and its source. Editing a value automatically marks it accepted; approval is still a staff decision.</p>
            </div>
            <button type="button" disabled={isCommitting || commitSuccess || acceptedCount === 0} onClick={handleCommitVerified} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45">
              {isCommitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {commitSuccess ? 'Applied to case' : isCommitting ? 'Saving approved fields…' : `Apply ${acceptedCount} approved field(s)`}
            </button>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {reviewFields.map((field, index) => {
              const accepted = field.humanStatus === 'accepted';
              const rejected = field.humanStatus === 'rejected';
              return (
                <article key={`${field.fieldName}-${index}`} className="grid min-w-0 gap-4 p-5 lg:grid-cols-[minmax(140px,0.7fr)_minmax(180px,1fr)_minmax(150px,0.8fr)_auto] lg:items-start">
                  <div className="min-w-0"><p className="text-sm font-bold text-[var(--ink)]">{field.fieldLabel}</p><p className="mt-1 break-all font-mono text-[10px] text-[var(--mute)]">{field.fieldName}</p>{field.isConflict && <span className="mt-2 inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-600">Conflict found</span>}</div>
                  <div className="min-w-0"><label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--mute)]">Extracted value</label><input type="text" value={formatValue(field.extractedValue)} onChange={event => updateField(index, { extractedValue: event.target.value, humanStatus: 'accepted' })} className="w-full min-w-0 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15" /><p className="mt-1.5 text-[10px] text-[var(--mute)]">Current record: {formatValue(field.currentValue)}</p></div>
                  <div className="min-w-0"><p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--mute)]">Source &amp; confidence</p><p className="text-xs leading-5 text-[var(--mute)]">{field.sourceCitation || 'No source citation supplied'}</p><div className="mt-2 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(0, Math.min(100, field.confidenceScore || 0))}%` }} /></div><span className="text-[10px] font-bold text-[var(--mute)]">{field.confidenceScore || 0}%</span></div></div>
                  <div className="flex items-center gap-2 lg:pt-5"><button type="button" onClick={() => updateField(index, { humanStatus: 'accepted' })} aria-label={`Accept ${field.fieldLabel}`} className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${accepted ? 'bg-emerald-600 text-white' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'}`}><Check className="h-4 w-4" />Accept</button><button type="button" onClick={() => updateField(index, { humanStatus: 'rejected' })} aria-label={`Reject ${field.fieldLabel}`} className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${rejected ? 'bg-rose-600 text-white' : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'}`}><X className="h-4 w-4" />Reject</button></div>
                </article>
              );
            })}
          </div>
          {commitSuccess && <div className="flex items-center gap-2 border-t border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-xs font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Approved values have been saved to the case record.</div>}
        </section>
      )}
    </div>
  );
};
