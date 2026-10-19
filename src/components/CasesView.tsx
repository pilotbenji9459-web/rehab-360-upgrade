import React, { useState, useEffect, useRef } from 'react';
import { LV, SUB, PROFILES, PROGRAMMES } from '../data/constants';
import { OffenderCase, StaffRole, ChangeHistoryEntry, AutosaveStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';
import {
  calculateAIRecommendation,
  formatPathwayName,
  getOffenderPos,
  canPerform,
  isRoleRestricted,
  getLowestDomains,
} from '../utils/aiLogic';
import {
  Save,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  History,
  Search,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';

interface CasesViewProps {
  currentRecord: OffenderCase;
  cases: OffenderCase[];
  onSelectCase: (caseId: string) => void;
  onDecide: (decision: 'approved' | 'modified' | 'overridden', pos: number, reason: string) => void;
  onUpdateCase: (updates: Partial<OffenderCase>) => Promise<void>;
  showAlert: (msg: string, title?: string) => void;
}

export const CasesView: React.FC<CasesViewProps> = ({
  currentRecord,
  cases,
  onSelectCase,
  onDecide,
  onUpdateCase,
  showAlert,
}) => {
  const { user, hasRole } = useAuth();
  const c = currentRecord;
  const a = calculateAIRecommendation(c);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterDecision, setFilterDecision] = useState<string>('all');

  // Form Fields & Autosave State
  const [formData, setFormData] = useState({
    first_name: c.first_name,
    last_name: c.last_name,
    crime_severity: c.crime_severity,
    education_level: c.education_level,
    mental_wellbeing: c.mental_wellbeing ?? 3,
    support_network: c.support_network,
    programme_engagement: c.programme_engagement,
    session_attendance: c.session_attendance,
    education_history: c.education_history,
    employment_history: c.employment_history,
    rehabilitation_history: c.rehabilitation_history,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [changeHistory, setChangeHistory] = useState<ChangeHistoryEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Placement decision dropdown state
  const [selectedLevel, setSelectedLevel] = useState<number>(Math.floor((c.pathway_position ?? a.pos) / 3));
  const [selectedSubLevel, setSelectedSubLevel] = useState<number>((c.pathway_position ?? a.pos) % 3);
  const [decisionReason, setDecisionReason] = useState<string>(c.decision_reason || '');

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync form when case changes
  useEffect(() => {
    setFormData({
      first_name: c.first_name,
      last_name: c.last_name,
      crime_severity: c.crime_severity,
      education_level: c.education_level,
      mental_wellbeing: c.mental_wellbeing ?? 3,
      support_network: c.support_network,
      programme_engagement: c.programme_engagement,
      session_attendance: c.session_attendance,
      education_history: c.education_history,
      employment_history: c.employment_history,
      rehabilitation_history: c.rehabilitation_history,
    });
    setSelectedLevel(Math.floor((c.pathway_position ?? a.pos) / 3));
    setSelectedSubLevel((c.pathway_position ?? a.pos) % 3);
    setDecisionReason(c.decision_reason || '');
    setHasUnsavedChanges(false);
    setAutosaveStatus('saved');

    // Fetch change history
    Api.getCaseById(c.id)
      .then((res) => setChangeHistory(res.change_history || []))
      .catch((err) => console.warn('Could not load history:', err));
  }, [c.id]);

  // Warn on page unload if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Debounced autosave to draft
  const triggerAutosaveDraft = (newData: typeof formData) => {
    setHasUnsavedChanges(true);
    setAutosaveStatus('unsaved');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setAutosaveStatus('saving');
      try {
        await Api.saveDraft(c.id, newData);
        setAutosaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Draft autosave failed:', err);
        setAutosaveStatus('error');
      }
    }, 2000);
  };

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    triggerAutosaveDraft(updated);
  };

  const handleExplicitSave = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setAutosaveStatus('saving');
    try {
      await onUpdateCase({
        ...formData,
        version: c.version,
      });
      setHasUnsavedChanges(false);
      setAutosaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString());
      showAlert('All edits saved to database successfully.', 'Saved');
    } catch (err: any) {
      setAutosaveStatus('error');
      showAlert(err.message || 'Save failed. Conflict or permission error.', 'Save Error');
    }
  };

  // Human placement decision handler
  const handleDecision = (type: 'approved' | 'modified' | 'overridden') => {
    const targetPos = selectedLevel * 3 + selectedSubLevel;
    const trimmedReason = decisionReason.trim();

    if (type !== 'approved') {
      const verb = type === 'modified' ? 'modifying' : 'overriding';
      if (!trimmedReason) {
        showAlert(`Enter a formal documented reason before ${verb}.`, 'Reason Required');
        return;
      }
      if (targetPos === a.pos) {
        showAlert('Choose a different level or sub-level from the AI recommendation.', 'Validation');
        return;
      }
      if (type === 'modified' && Math.floor(targetPos / 3) !== Math.floor(a.pos / 3)) {
        showAlert('Modify keeps the recommended level and changes sub-level only. Use Override to change level.', 'Validation');
        return;
      }
      if (type === 'overridden' && Math.floor(targetPos / 3) === Math.floor(a.pos / 3)) {
        showAlert('Override changes the level. Use Modify for a sub-level change.', 'Validation');
        return;
      }
      onDecide(type, targetPos, trimmedReason);
    } else {
      onDecide('approved', a.pos, '');
    }
  };

  // Filter cases
  const filteredCases = cases.filter((x) => {
    const matchesSearch =
      x.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      x.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      x.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      x.crime_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      filterSeverity === 'all' || x.crime_severity === parseInt(filterSeverity, 10);

    const matchesDecision =
      filterDecision === 'all' ||
      (filterDecision === 'pending' ? !x.decision : x.decision === filterDecision);

    return matchesSearch && matchesSeverity && matchesDecision;
  });

  const canEditWellbeing = hasRole(['Psychologist', 'Administrator']);
  const canDecidePlacement = hasRole(['Warden', 'Administrator']);
  const canEditEducation = hasRole(['Educator', 'Case Manager', 'Administrator']);

  const lowest = getLowestDomains(c, user?.role || 'Warden');
  const missingAlerts: string[] = [];
  if (c.assessment_completeness < 80) missingAlerts.push('Family and social background interview not recorded');
  if (c.assessment_completeness < 92) missingAlerts.push('Vocational interest inventory incomplete');
  if (c.assessment_completeness < 96) missingAlerts.push('Latest creative-development assessment pending');

  return (
    <div className="space-y-6">
      {/* Multi-Agency Civic Directory Banner */}
      <div className="rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl">
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
          <img
            src="/assets/images/community_transition_network.svg"
            alt="Multi-agency civic transition network and case directory"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a30] via-transparent to-transparent" />
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-900/80 border border-[#1e3a5f] text-xs font-mono text-[#5cc2bd] backdrop-blur-sm">
            CASELOAD REPOSITORY · MULTI-AGENCY INTEROPERABILITY
          </div>
        </div>
      </div>

      {/* Caseload Directory & Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2>Institutional Caseload Directory</h2>
            <p className="mute text-xs">
              Search and filter active cases. Select a record to inspect the multi-dimensional file.
            </p>
          </div>

          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              {autosaveStatus === 'saving' && (
                <span className="text-[#0079d6] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 animate-spin" /> Saving...
                </span>
              )}
              {autosaveStatus === 'unsaved' && (
                <span className="text-amber-500 font-medium">● Unsaved changes</span>
              )}
              {autosaveStatus === 'saved' && (
                <span className="text-[var(--ok)] flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved {lastSavedTime ? `at ${lastSavedTime}` : ''}
                </span>
              )}
              {autosaveStatus === 'error' && (
                <span className="text-[var(--bad)] flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Save failed
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleExplicitSave}
              disabled={autosaveStatus === 'saving'}
              className="px-3.5 py-1.5 rounded-lg bg-[#0079d6] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Record</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, name, or offence..."
              className="w-full pl-9.5 pr-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--panel)] text-white focus:outline-none focus:border-[#0284c7]"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="text-xs rounded-xl border border-[var(--line)] py-2 px-3 bg-[var(--panel)] text-white"
          >
            <option value="all">All Crime Severities</option>
            <option value="1">Severity 1 (Low)</option>
            <option value="2">Severity 2</option>
            <option value="3">Severity 3 (Medium)</option>
            <option value="4">Severity 4</option>
            <option value="5">Severity 5 (High)</option>
          </select>

          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="text-xs rounded-xl border border-[var(--line)] py-2 px-3 bg-[var(--panel)] text-white"
          >
            <option value="all">All Verification Statuses</option>
            <option value="pending">Pending Human Review</option>
            <option value="approved">Approved</option>
            <option value="modified">Modified</option>
            <option value="overridden">Overridden</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="app-table">
            <thead>
              <tr>
                <th>Record</th>
                <th>Name</th>
                <th>Offence &amp; Sentence</th>
                <th>Current Pathway</th>
                <th>Gate Benchmark</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((record) => {
                const isSelected = record.id === c.id;
                const posVal = getOffenderPos(record);
                return (
                  <tr
                    key={record.id}
                    className={`pick ${isSelected ? 'sel' : ''}`}
                    onClick={() => onSelectCase(record.id)}
                  >
                    <td className="font-semibold text-xs text-[#0079d6]">{record.id}</td>
                    <td className="font-medium text-xs">
                      {record.first_name} {record.last_name}
                      <span className="block text-[10px] text-[var(--mute)]">{record.age_band}</span>
                    </td>
                    <td className="text-xs">
                      {record.crime_type}
                      <span className="block text-[10px] text-[var(--mute)]">
                        {record.sentence_length_months} months · Severity {record.crime_severity}/5
                      </span>
                    </td>
                    <td className="text-xs font-medium">{formatPathwayName(posVal)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bar">
                          <i
                            style={{
                              width: `${Math.round(
                                (record.gate_scores.edu +
                                  record.gate_scores.beh +
                                  record.gate_scores.wb +
                                  record.gate_scores.skl) /
                                  4
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono">
                          {Math.round(
                            (record.gate_scores.edu +
                              record.gate_scores.beh +
                              record.gate_scores.wb +
                              record.gate_scores.skl) /
                              4
                          )}
                          %
                        </span>
                      </div>
                    </td>
                    <td>
                      {record.decision ? (
                        <span className="tag o capitalize">{record.decision}</span>
                      ) : (
                        <span className="tag w">Pending Review</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Offender Profile & Editable Form */}
      <div className="grid-layout">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2>{c.id} Individual File</h2>
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="sec text-xs px-2.5 py-1 flex items-center gap-1"
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit History ({changeHistory.length})</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleFieldChange('first_name', e.target.value)}
                  className="w-full py-1 px-2 rounded border border-[var(--line)] bg-[var(--panel)]"
                />
              </div>
              <div>
                <label className="font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleFieldChange('last_name', e.target.value)}
                  className="w-full py-1 px-2 rounded border border-[var(--line)] bg-[var(--panel)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium mb-1">Crime Severity (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.crime_severity}
                  onChange={(e) => handleFieldChange('crime_severity', parseInt(e.target.value, 10))}
                  className="w-full py-1 px-2 rounded border border-[var(--line)] bg-[var(--panel)]"
                />
              </div>
              <div>
                <label className="font-medium mb-1">Session Attendance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.session_attendance}
                  onChange={(e) => handleFieldChange('session_attendance', parseInt(e.target.value, 10))}
                  className="w-full py-1 px-2 rounded border border-[var(--line)] bg-[var(--panel)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium mb-1 flex items-center justify-between">
                  <span>Education Level (1-5)</span>
                  {!canEditEducation && <Lock className="w-3 h-3 text-[var(--mute)]" />}
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  disabled={!canEditEducation}
                  value={formData.education_level}
                  onChange={(e) => handleFieldChange('education_level', parseInt(e.target.value, 10))}
                  className="w-full py-1 px-2 rounded border border-[var(--line)] bg-[var(--panel)] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="font-medium mb-1 flex items-center justify-between">
                  <span>Mental Well-being (1-5)</span>
                  {!canEditWellbeing && <Lock className="w-3 h-3 text-[var(--mute)]" />}
                </label>
                {c.mental_wellbeing_restricted ? (
                  <div className="py-1 px-2 rounded bg-[var(--bg)] border border-[var(--line)] text-[var(--mute)] italic">
                    Restricted (Clinical Psych Only)
                  </div>
                ) : (
                  <input
                    type="number"
                    min="1"
                    max="5"
                    disabled={!canEditWellbeing}
                    value={formData.mental_wellbeing}
                    onChange={(e) => handleFieldChange('mental_wellbeing', parseInt(e.target.value, 10))}
                    className="w-full py-1 px-2 rounded border border-[var(--line)] bg-[var(--panel)] disabled:opacity-50"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="font-medium mb-1">Employment History</label>
              <textarea
                rows={2}
                value={formData.employment_history}
                onChange={(e) => handleFieldChange('employment_history', e.target.value)}
                className="w-full p-2 rounded border border-[var(--line)] bg-[var(--panel)]"
              />
            </div>

            <div>
              <label className="font-medium mb-1">Education &amp; Training History</label>
              <textarea
                rows={2}
                value={formData.education_history}
                onChange={(e) => handleFieldChange('education_history', e.target.value)}
                className="w-full p-2 rounded border border-[var(--line)] bg-[var(--panel)]"
              />
            </div>
          </div>
        </div>

        {/* Explainable AI Recommendation Card */}
        <div className="card">
          <h2>AI Placement Engine: {formatPathwayName(a.pos)}</h2>
          <div className="row mb-3">
            <span className="tag font-semibold">Confidence {a.conf}%</span>
            <span className="tag o font-semibold">Protective Index {a.P}/100</span>
            <span className={`tag font-semibold ${a.Rk >= 80 ? 'b' : 'w'}`}>
              Risk Load {a.Rk}/100
            </span>
            <span className="tag font-semibold">Placement Score {a.s}</span>
          </div>

          <p className="mute text-xs mb-4">
            Algorithmic scoring: 60% protective factors (education, well-being, support, engagement) + 40% (100 − risk load).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <h3 className="text-xs font-bold text-[var(--bad)] uppercase tracking-wider mb-2">
                Risk Factors
              </h3>
              <ul className="app-list space-y-1">
                {a.f.length ? (
                  a.f.map((f, i) => <li key={i}>{f[0]}</li>)
                ) : (
                  <li className="mute">None above risk threshold</li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[var(--ok)] uppercase tracking-wider mb-2">
                Protective Factors
              </h3>
              <ul className="app-list space-y-1">
                {a.p.length ? (
                  a.p.map((p, i) => <li key={i}>{p}</li>)
                ) : (
                  <li className="mute">None above threshold</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Human Verification Card (Warden & Administrator) */}
      <div className="card">
        {canDecidePlacement ? (
          <div>
            <h3>Human Verification &amp; Pathway Authorization</h3>
            <p className="mute text-xs mb-3">
              No AI recommendation takes effect in custody without explicit verification. Any modification or override requires a documented rationale.
            </p>

            <div className="row mb-3">
              <label>
                Target Level
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(Number(e.target.value))}
                  className="rounded border border-[var(--line)] py-1 px-2.5 bg-[var(--panel)] text-xs"
                >
                  {LV.map((l, i) => (
                    <option key={i} value={i}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Sub-level
                <select
                  value={selectedSubLevel}
                  onChange={(e) => setSelectedSubLevel(Number(e.target.value))}
                  className="rounded border border-[var(--line)] py-1 px-2.5 bg-[var(--panel)] text-xs"
                >
                  {SUB.map((l, i) => (
                    <option key={i} value={i}>
                      Sub-level {l}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mb-3">
              Formal Decision Rationale (Required for Modify or Override)
              <textarea
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                rows={2}
                placeholder="Document institutional or behavioural reasons for overriding AI suggestions..."
                className="w-full text-xs rounded border border-[var(--line)] p-2 bg-[var(--panel)]"
              />
            </label>

            <div className="row gap-2.5">
              <button
                type="button"
                onClick={() => handleDecision('approved')}
                className="px-4 py-2 bg-[#0079d6] text-white text-xs font-semibold rounded-lg"
              >
                Approve AI Pathway ({formatPathwayName(a.pos)})
              </button>
              <button
                type="button"
                onClick={() => handleDecision('modified')}
                className="sec px-4 py-2 text-xs font-semibold rounded-lg"
              >
                Modify Sub-level
              </button>
              <button
                type="button"
                onClick={() => handleDecision('overridden')}
                className="sec px-4 py-2 text-xs font-semibold rounded-lg"
              >
                Override Level
              </button>
            </div>
          </div>
        ) : (
          <div className="note-box text-xs">
            Read-only Placement View: Pathway verification and level overrides are reserved for the Facility Warden and Executive Administrators.
          </div>
        )}

        {c.decision_reason && (
          <div className="mt-3 pt-3 border-t border-[var(--line)] text-xs">
            <span className="font-semibold text-[var(--mute)]">Last Verified Rationale: </span>
            <span>{c.decision_reason}</span>
          </div>
        )}
      </div>

      {/* Missing Alerts & Pathway Options */}
      <div className="grid-layout">
        <div className="card">
          <h2>Assessment Completeness Alerts</h2>
          {missingAlerts.length ? (
            <>
              <ul className="app-list text-xs space-y-1.5">
                {missingAlerts.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
              <p className="mute text-[11px] mt-2">
                Confidence stays penalized until clinical &amp; background inventories are finalized.
              </p>
            </>
          ) : (
            <p className="text-xs text-[var(--ok)] font-medium">
              Assessment 100% complete. All baseline assessments recorded.
            </p>
          )}
        </div>

        <div className="card">
          <h2>AI Pathway Programme Combinations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <h3 className="text-xs font-semibold text-[#0079d6]">Priority-First</h3>
              <ul className="app-list text-[11px]">
                <li>{PROGRAMMES[lowest[0]?.[0]] || 'Targeted Intervention'}</li>
                <li>{PROGRAMMES[lowest[1]?.[0]] || 'Skills Group'}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#0079d6]">Balanced Mix</h3>
              <ul className="app-list text-[11px]">
                <li>{PROGRAMMES[lowest[0]?.[0]] || 'Core Needs'}</li>
                <li>{PROGRAMMES[lowest[2]?.[0]] || 'Vocational'}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#0079d6]">Broad Support</h3>
              <ul className="app-list text-[11px]">
                <li>{PROGRAMMES[lowest[1]?.[0]] || 'Personal Dev'}</li>
                <li>{PROGRAMMES[lowest[3]?.[0]] || 'Community Prep'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-[var(--panel)] border border-[var(--line)] p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="font-serif">Field-Level Change History: {c.id}</h3>
                <p className="mute text-xs">Full chronological audit of authorized modifications.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="sec text-xs px-2.5 py-1"
              >
                Close
              </button>
            </div>

            <div className="scroll-container flex-1 overflow-y-auto py-3">
              {changeHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--mute)]">
                  No previous modifications recorded for this file yet.
                </div>
              ) : (
                <table className="app-table text-xs">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Officer</th>
                      <th>Field</th>
                      <th>Previous Value</th>
                      <th>New Value</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changeHistory.map((entry) => (
                      <tr key={entry.id}>
                        <td className="whitespace-nowrap text-[var(--mute)]">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td className="font-medium">
                          {entry.changed_by_name} ({entry.changed_by_role})
                        </td>
                        <td className="font-mono text-[11px] text-[#0079d6]">{entry.field_name}</td>
                        <td className="text-[var(--mute)] line-through max-w-xs truncate">
                          {entry.previous_value}
                        </td>
                        <td className="font-semibold text-[var(--ink)] max-w-xs truncate">
                          {entry.new_value}
                        </td>
                        <td className="capitalize text-[10px] tag">{entry.change_source.replace('_', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
