import React, { useState } from 'react';
import { Api } from '../services/api';
import { OffenderCase } from '../types';
import { UserPlus, X, AlertCircle } from 'lucide-react';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (newCase: OffenderCase) => void;
  showAlert: (message: string, title?: string) => void;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  isOpen,
  onClose,
  onCaseCreated,
  showAlert,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('1992-05-14');
  const [ageBand, setAgeBand] = useState('25–34');
  const [crimeType, setCrimeType] = useState('Non-violent property offences');
  const [crimeSeverity, setCrimeSeverity] = useState(2);
  const [sentenceLength, setSentenceLength] = useState(24);
  const [educationLevel, setEducationLevel] = useState(3);
  const [supportNetwork, setSupportNetwork] = useState(3);
  const [programmeEngagement, setProgrammeEngagement] = useState(3);
  const [educationHistory, setEducationHistory] = useState('Secondary education; Level 1 literacy.');
  const [employmentHistory, setEmploymentHistory] = useState('Consistent warehouse operative experience.');
  const [rehabHistory, setRehabHistory] = useState('First custodial period.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !crimeType.trim()) {
      setError('Please fill all mandatory case profile fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await Api.createCase({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dob,
        age_band: ageBand,
        crime_type: crimeType.trim(),
        crime_severity: Number(crimeSeverity),
        sentence_length_months: Number(sentenceLength),
        education_level: Number(educationLevel),
        support_network: Number(supportNetwork),
        programme_engagement: Number(programmeEngagement),
        education_history: educationHistory,
        employment_history: employmentHistory,
        rehabilitation_history: rehabHistory,
      });

      onCaseCreated(res.case);
      showAlert(`Case profile ${res.case.id} created successfully.`, 'Profile Registered');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create case record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0c1c36] border border-slate-700 text-slate-100 shadow-2xl p-6 sm:p-8 my-8">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0284c7] via-[#5cc2bd] to-[#38bdf8]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#5cc2bd] flex items-center justify-center text-white shadow-md">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-white">Register Case Record</h2>
            <p className="text-xs text-slate-400">Initialize official rehabilitation profile for this institution</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Thomas"
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Sterling"
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Age Band</label>
              <select
                value={ageBand}
                onChange={(e) => setAgeBand(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                <option value="18–24">18–24</option>
                <option value="25–34">25–34</option>
                <option value="35–44">35–44</option>
                <option value="45–54">45–54</option>
                <option value="55+">55+</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Offence Description *</label>
              <input
                type="text"
                required
                value={crimeType}
                onChange={(e) => setCrimeType(e.target.value)}
                placeholder="e.g. Dangerous driving and property damage"
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Crime Severity (1=Lowest, 5=Highest)</label>
              <select
                value={crimeSeverity}
                onChange={(e) => setCrimeSeverity(Number(e.target.value))}
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                <option value="1">1 - Minor infraction</option>
                <option value="2">2 - Low severity</option>
                <option value="3">3 - Moderate severity</option>
                <option value="4">4 - High severity</option>
                <option value="5">5 - Critical violence/aggravated</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Sentence Length (Months)</label>
              <input
                type="number"
                min="1"
                max="360"
                value={sentenceLength}
                onChange={(e) => setSentenceLength(Number(e.target.value))}
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Education Level (1–5)</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(Number(e.target.value))}
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                <option value="1">1 - Minimal / non-reader</option>
                <option value="2">2 - Basic primary literacy</option>
                <option value="3">3 - Secondary schooling</option>
                <option value="4">4 - Vocational trade / Level 2</option>
                <option value="5">5 - Higher education / degree</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Education Background</label>
              <input
                type="text"
                value={educationHistory}
                onChange={(e) => setEducationHistory(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Employment Background</label>
              <input
                type="text"
                value={employmentHistory}
                onChange={(e) => setEmploymentHistory(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0274b0] hover:to-[#025a8b] text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Registering...' : 'Register Official Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
