import React, { useState } from 'react';
import { PROGRAMMES } from '../data/constants';
import { OffenderCase } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getOffenderPos,
  formatPathwayName,
  getLowestDomains,
  getNextReviewDate,
  canPerform,
} from '../utils/aiLogic';

interface RehabPlanViewProps {
  currentRecord: OffenderCase;
  onAddRemark: (remark: string) => void;
  showAlert: (msg: string, title?: string) => void;
}

export const RehabPlanView: React.FC<RehabPlanViewProps> = ({
  currentRecord,
  onAddRemark,
  showAlert,
}) => {
  const { user } = useAuth();
  const c = currentRecord;
  const p = getOffenderPos(c);
  const [remarkInput, setRemarkInput] = useState('');

  if (p == null) {
    return (
      <div className="card">
        <div className="note-box">
          Verify the placement first. The rehabilitation plan is built from the verified level.
        </div>
      </div>
    );
  }

  const userRole = user?.role || 'Warden';
  const lowest = getLowestDomains(c, userRole);
  const nextDate = getNextReviewDate();
  const remarks = c.rehabilitation_remarks || [];
  const canDecide = canPerform(userRole, 'decide') || userRole === 'Case Manager';

  const handleSaveRemark = () => {
    const trimmed = remarkInput.trim();
    if (!trimmed) {
      showAlert('Type a remark first.', 'Validation');
      return;
    }
    onAddRemark(trimmed);
    setRemarkInput('');
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2>
          Rehabilitation plan: {c.id} · {formatPathwayName(p)}
        </h2>

        <div className="grid-layout">
          <div>
            <h3>Programme modules and goals</h3>
            <ul className="app-list text-sm">
              {lowest.slice(0, 3).map((x, i) => (
                <li key={i}>
                  {PROGRAMMES[x[0]] ?? x[0]}. Goal: lift {x[0].toLowerCase()} from {x[1]}% to{' '}
                  {Math.min(100, x[1] + 15)}% by the next review
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Support needs</h3>
            <ul className="app-list text-sm">
              <li>
                {lowest[0][1] < 50 ? 'Weekly' : 'Fortnightly'} key-worker check-in
              </li>
              {c.session_attendance < 70 && <li>Attendance support: review barriers</li>}
              {c.education_level <= 2 && <li>Learning support assistant</li>}
              {c.support_network <= 2 && <li>Family contact facilitation</li>}
            </ul>

            <h3 className="mt-3">Timeline</h3>
            <p className="text-sm">
              Next review date: <b>{nextDate}</b>
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Professional remarks and conditions</h3>
        <ul className="app-list text-sm mb-4">
          {remarks.length ? (
            remarks.map((r, i) => <li key={i}>{r}</li>)
          ) : (
            <li className="mute">No remarks yet</li>
          )}
        </ul>

        {canDecide ? (
          <div>
            <textarea
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              rows={2}
              placeholder="Add an authorized professional remark or behavioral condition..."
              className="w-full text-sm rounded border border-[var(--line)] p-2 mb-2 bg-[var(--panel)]"
            />
            <p>
              <button type="button" onClick={handleSaveRemark}>
                Save remark
              </button>
            </p>
          </div>
        ) : (
          <p className="mute text-xs">Authorized case officers and wardens add remarks and conditions.</p>
        )}
      </div>
    </div>
  );
};
