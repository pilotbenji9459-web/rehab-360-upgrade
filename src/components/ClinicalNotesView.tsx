import React, { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { ClinicalNote, OffenderCase } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  FileHeart,
  PlusCircle,
  ShieldAlert,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ClinicalNotesViewProps {
  currentRecord: OffenderCase;
  showAlert: (msg: string, title?: string) => void;
}

export const ClinicalNotesView: React.FC<ClinicalNotesViewProps> = ({
  currentRecord,
  showAlert,
}) => {
  const { user, hasRole } = useAuth();
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New Note Form State
  const [title, setTitle] = useState('');
  const [noteType, setNoteType] = useState<
    'psychological_evaluation' | 'wellbeing_check' | 'risk_assessment' | 'crisis_intervention'
  >('psychological_evaluation');
  const [content, setContent] = useState('');
  const [recommendationInput, setRecommendationInput] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthorized = hasRole(['Psychologist', 'Administrator']);

  useEffect(() => {
    if (!isAuthorized) {
      setIsLoading(false);
      return;
    }

    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        const res = await Api.getClinicalNotes(currentRecord.id);
        setNotes(res.notes || []);
      } catch (err: any) {
        console.error('Failed to load clinical notes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [currentRecord.id, isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="card">
        <div className="p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-rose-500 font-serif mb-2">
            Clinical Psychology Records Restricted
          </h2>
          <p className="mute text-xs leading-relaxed mb-4">
            In accordance with medical confidentiality regulations and least-privilege RBAC standards, clinical psychometric evaluations, crisis interventions, and diagnostic session notes are restricted exclusively to accredited Psychologists and Facility Administrators.
          </p>
          <span className="tag b text-xs">Access Denied for {user?.role || 'Current Role'}</span>
        </div>
      </div>
    );
  }

  const handleAddRecommendation = () => {
    const trimmed = recommendationInput.trim();
    if (trimmed) {
      setRecommendations([...recommendations, trimmed]);
      setRecommendationInput('');
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showAlert('Please enter both note title and clinical content.', 'Validation');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await Api.addClinicalNote(currentRecord.id, {
        title,
        note_type: noteType,
        confidentiality: 'restricted_clinical',
        content,
        recommendations,
      });

      setNotes([res.note, ...notes]);
      setShowAddForm(false);
      setTitle('');
      setContent('');
      setRecommendations([]);
      showAlert('Clinical evaluation note recorded successfully.', 'Note Saved');
    } catch (err: any) {
      showAlert(err.message || 'Failed to save clinical note.', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <FileHeart className="w-5 h-5" />
            </div>
            <div>
              <h2>Clinical Psychological Evaluations: {currentRecord.id}</h2>
              <p className="mute text-xs">
                Encrypted institutional repository for clinical observations, psychometrics, and mental health referrals.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-lg bg-[#0079d6] hover:bg-[#006bbd] text-white text-xs font-semibold shadow transition-all flex items-center gap-1.5 cursor-pointer w-fit"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showAddForm ? 'Cancel Entry' : 'Record Clinical Note'}</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateNote} className="card border-t-3 border-purple-500 space-y-4">
          <h3 className="font-serif">New Clinical Evaluation Entry</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1">Evaluation Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cognitive Reframing Progress Assessment"
                className="w-full text-xs rounded border border-[var(--line)] py-1.5 px-2.5 bg-[var(--panel)]"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1">Clinical Note Type</label>
              <select
                value={noteType}
                onChange={(e: any) => setNoteType(e.target.value)}
                className="w-full text-xs rounded border border-[var(--line)] py-1.5 px-2.5 bg-[var(--panel)]"
              >
                <option value="psychological_evaluation">Psychological Evaluation</option>
                <option value="wellbeing_check">Well-being &amp; Mood Check</option>
                <option value="risk_assessment">Behavioral Risk Assessment</option>
                <option value="crisis_intervention">Crisis Intervention &amp; De-escalation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1">Clinical Assessment &amp; Psychometrics</label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Record diagnostic observations, behavioral affect, response to interventions, and psychometric screening indicators..."
              className="w-full text-xs rounded border border-[var(--line)] p-2.5 bg-[var(--panel)]"
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1">Clinical Recommendations for Case Team</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={recommendationInput}
                onChange={(e) => setRecommendationInput(e.target.value)}
                placeholder="e.g. Weekly 1-on-1 supportive counseling; adjust group workshop intensity"
                className="flex-1 text-xs rounded border border-[var(--line)] py-1.5 px-2.5 bg-[var(--panel)]"
              />
              <button
                type="button"
                onClick={handleAddRecommendation}
                className="sec text-xs px-3 py-1.5"
              >
                Add Bullet
              </button>
            </div>
            {recommendations.length > 0 && (
              <ul className="list-disc pl-5 text-xs text-[var(--ink)] space-y-1">
                {recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="sec text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Authorize & Commit Clinical Note'}
            </button>
          </div>
        </form>
      )}

      {/* Notes Timeline */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="card text-center py-10 text-xs text-[var(--mute)]">
            No clinical psychological notes recorded for this individual yet.
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="card border-l-4 border-purple-500">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="tag text-xs font-semibold">{note.title}</span>
                  <span className="tag w text-[10px] uppercase font-mono tracking-wider">
                    {note.note_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--mute)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                  <span>·</span>
                  <User className="w-3.5 h-3.5" />
                  <span>{note.author_name} ({note.author_role})</span>
                </div>
              </div>

              <p className="text-xs text-[var(--ink)] whitespace-pre-wrap leading-relaxed mb-3">
                {note.content}
              </p>

              {note.recommendations && note.recommendations.length > 0 && (
                <div className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--line)]">
                  <span className="text-[11px] font-semibold text-[var(--mute)] block mb-1">
                    Clinical Directives:
                  </span>
                  <ul className="list-disc pl-4 text-xs text-[var(--ink)] space-y-1">
                    {note.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
