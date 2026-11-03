import React, { useState } from 'react';
import { Api } from '../services/api';
import { OffenderCase, VerificationResult, ExtractedField, UploadedDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Eye,
  Check,
  X,
  Edit2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface DocumentIntakeCenterProps {
  cases: OffenderCase[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  onRefreshCase: () => void;
  showAlert: (msg: string, title?: string) => void;
}

export const DocumentIntakeCenter: React.FC<DocumentIntakeCenterProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onRefreshCase,
  showAlert,
}) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetCaseId, setTargetCaseId] = useState<string>(selectedCaseId);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [tablePreview, setTablePreview] = useState<any[]>([]);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitSuccess, setCommitSuccess] = useState<boolean>(false);

  // Editable candidate fields for human review
  const [reviewFields, setReviewFields] = useState<ExtractedField[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setVerificationResult(null);
      setUploadedDoc(null);
      setCommitSuccess(false);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      showAlert('Please choose a file to upload.', 'Missing File');
      return;
    }
    if (!targetCaseId) {
      showAlert('Please specify target case record.', 'Missing Case');
      return;
    }

    setIsUploading(true);
    try {
      const res = await Api.uploadDocument(targetCaseId, selectedFile);
      setUploadedDoc(res.document);
      setVerificationResult(res.verification);
      setReviewFields(res.verification.fields || []);
      setSheets(res.sheets || []);
      setTablePreview(res.tablePreview || []);
      showAlert(
        `File ${selectedFile.name} parsed successfully. ${res.verification.fields.length} candidate fields extracted for staff review.`,
        'Document Processed'
      );
    } catch (err: any) {
      showAlert(err.message || 'Failed to process document.', 'Upload Error');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleFieldStatus = (index: number, newStatus: 'accepted' | 'rejected') => {
    setReviewFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, humanStatus: newStatus } : f))
    );
  };

  const handleCorrectValue = (index: number, val: string) => {
    setReviewFields((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, humanStatus: 'accepted', extractedValue: val } : f
      )
    );
  };

  const handleCommitVerified = async () => {
    if (!uploadedDoc) return;

    const accepted = reviewFields
      .filter((f) => f.humanStatus === 'accepted')
      .map((f) => ({
        fieldName: f.fieldName,
        finalValue: f.extractedValue,
      }));

    if (accepted.length === 0) {
      showAlert(
        'No fields were marked as "Accepted". Please accept or correct at least one field to commit.',
        'Review Incomplete'
      );
      return;
    }

    setIsCommitting(true);
    try {
      const res = await Api.commitVerifiedFields(uploadedDoc.id, accepted);
      setCommitSuccess(true);
      onRefreshCase();
      showAlert(
        `Successfully committed ${accepted.length} verified fields to case ${targetCaseId}. Database updated and logged to audit trail.`,
        'Changes Applied'
      );
    } catch (err: any) {
      showAlert(err.message || 'Failed to commit verified fields.', 'Commit Error');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intake & Document Verification Visual Banner */}
      <div className="rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl">
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-950">
          <img
            src="/assets/images/document_intake_telemetry.svg"
            alt="Multi-format document ingestion, neural text extraction, and human verification pipeline"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a30] via-transparent to-transparent" />
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/50 text-xs font-mono text-[#38bdf8] backdrop-blur-sm">
            MULTI-SOURCE PARSER · WORD, EXCEL &amp; PDF REPOSITORIES
          </div>
        </div>
      </div>

      {/* Header card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#0079d6]/10 text-[#0079d6] flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2>{"Document Intake"}</h2>
            <p className="mute text-xs">
              Upload Microsoft Word (.docx), Excel spreadsheets (.xlsx, .csv), or PDF reports. AI extracts candidate values and highlights discrepancies for human verification.
            </p>
          </div>
        </div>
      </div>

      {/* Target Case & File Selector */}
      <div className="grid-layout">
        <div className="card">
          <h3>1. {"Document Intake"}</h3>
          <p className="mute text-xs mb-4">
            Candidate fields will be compared against this authorized record to spot discrepancies.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1">Target Case Record</label>
              <select
                value={targetCaseId}
                onChange={(e) => {
                  setTargetCaseId(e.target.value);
                  onSelectCase(e.target.value);
                }}
                className="w-full text-sm rounded border border-[var(--line)] py-1.5 px-2 bg-[var(--panel)]"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.first_name} {c.last_name} ({c.crime_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="border-2 border-dashed border-[var(--line)] rounded-xl p-6 text-center hover:border-[#0079d6] transition-colors bg-[var(--bg)]/50">
              <input
                type="file"
                id="docUploadInput"
                accept=".docx,.xlsx,.xls,.csv,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="docUploadInput" className="cursor-pointer block">
                <FileSpreadsheet className="w-10 h-10 text-[var(--mute)] mx-auto mb-2" />
                <span className="text-xs font-semibold text-[#0079d6] block mb-1">
                  {selectedFile ? selectedFile.name : 'Click to select Word, Excel, or PDF document'}
                </span>
                <span className="text-[11px] text-[var(--mute)] block">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : 'Supported: .docx, .xlsx, .csv, .pdf (Max 15MB)'}
                </span>
              </label>
            </div>

            <button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={handleUploadAndAnalyze}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0079d6] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isUploading ? 'Extracting & Verifying with AI...' : 'Parse & Run AI Verification'}</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet / Document Preview */}
        <div className="card">
          <h3>2. Source Document Extraction Preview</h3>
          <p className="mute text-xs mb-3">
            Preview of parsed text content and spreadsheet tables.
          </p>

          {sheets.length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-semibold block mb-1">Detected Worksheets:</span>
              <div className="flex gap-2 flex-wrap">
                {sheets.map((sheet, i) => (
                  <span key={i} className="tag">
                    {sheet}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tablePreview.length > 0 && (
            <div className="mb-3 scroll-container border border-[var(--line)] rounded p-2 text-xs">
              <span className="font-semibold block mb-1 text-[var(--mute)]">Tabular Preview (First 5 Rows):</span>
              <table className="app-table">
                <tbody>
                  {tablePreview.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {Object.values(row).map((val: any, cIdx) => (
                        <td key={cIdx}>{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {verificationResult ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--line)]">
                <span className="text-xs font-semibold text-[var(--ink)] block mb-1">AI Audit Summary:</span>
                <p className="text-xs text-[var(--ink)] leading-relaxed">{verificationResult.summary}</p>
              </div>

              {verificationResult.warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
                  <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Detected Inconsistencies &amp; Warnings:
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-amber-800 dark:text-amber-300">
                    {verificationResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center border border-dashed border-[var(--line)] rounded-xl text-center p-4">
              <FileText className="w-8 h-8 text-[var(--mute)] mb-2" />
              <p className="text-xs text-[var(--mute)]">
                Upload a document to view parsed text, tabular schemas, and discrepancy detection.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Human-in-the-Loop Review Screen */}
      {verificationResult && reviewFields.length > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3>3. Human-in-the-Loop Field Verification</h3>
              <p className="mute text-xs">
                Review candidate data extracted by AI. Check citations and resolve discrepancies before committing to the official record.
              </p>
            </div>

            <button
              type="button"
              disabled={isCommitting || commitSuccess}
              onClick={handleCommitVerified}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {commitSuccess
                  ? 'Changes Committed to Record'
                  : isCommitting
                  ? 'Saving to Database...'
                  : 'Apply Accepted Fields to Record'}
              </span>
            </button>
          </div>

          <div className="scroll-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Target Field</th>
                  <th>Extracted Value</th>
                  <th>Current Value</th>
                  <th>Discrepancy / Conflict</th>
                  <th>Type &amp; Citation</th>
                  <th>Confidence</th>
                  <th className="text-center">Staff Decision</th>
                </tr>
              </thead>
              <tbody>
                {reviewFields.map((field, idx) => {
                  const isAccepted = field.humanStatus === 'accepted';
                  const isRejected = field.humanStatus === 'rejected';

                  return (
                    <tr key={idx} className={field.isConflict ? 'bg-amber-500/5' : ''}>
                      <td className="font-semibold text-xs text-[var(--ink)]">
                        {field.fieldLabel}
                        <span className="block font-mono text-[10px] text-[var(--mute)]">
                          {field.fieldName}
                        </span>
                      </td>

                      <td>
                        <input
                          type="text"
                          value={String(field.extractedValue)}
                          onChange={(e) => handleCorrectValue(idx, e.target.value)}
                          className="w-full text-xs font-semibold rounded border border-[var(--line)] py-1 px-2 bg-[var(--panel)] text-[var(--ink)]"
                        />
                      </td>

                      <td className="text-xs text-[var(--mute)]">
                        {Array.isArray(field.currentValue)
                          ? field.currentValue.join(', ') || 'None'
                          : String(field.currentValue ?? 'N/A')}
                      </td>

                      <td>
                        {field.isConflict ? (
                          <span className="tag w text-[11px] block max-w-xs">
                            {field.conflictDescription || 'Conflict detected'}
                          </span>
                        ) : (
                          <span className="tag o text-[11px]">Consistent</span>
                        )}
                      </td>

                      <td className="text-xs max-w-xs">
                        <span className="tag mb-1 block w-fit text-[10px]">
                          {field.isFactOrInterpretation}
                        </span>
                        <span className="text-[11px] text-[var(--mute)] block leading-snug">
                          {field.sourceCitation}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bar">
                            <i style={{ width: `${field.confidenceScore}%` }} />
                          </div>
                          <span className="text-xs font-semibold">{field.confidenceScore}%</span>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleFieldStatus(idx, 'accepted')}
                            className={`p-1.5 rounded text-xs font-semibold cursor-pointer ${
                              isAccepted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[var(--line)] text-[var(--ink)] hover:bg-emerald-500 hover:text-white'
                            }`}
                            title="Accept candidate field"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleFieldStatus(idx, 'rejected')}
                            className={`p-1.5 rounded text-xs font-semibold cursor-pointer ${
                              isRejected
                                ? 'bg-rose-600 text-white'
                                : 'bg-[var(--line)] text-[var(--ink)] hover:bg-rose-500 hover:text-white'
                            }`}
                            title="Reject candidate field"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
