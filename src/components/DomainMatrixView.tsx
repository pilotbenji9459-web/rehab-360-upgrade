import React from 'react';
import { TH } from '../data/constants';
import { OffenderCase } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getDomainMatrix,
  getLowestDomains,
  isRoleRestricted,
} from '../utils/aiLogic';

interface DomainMatrixViewProps {
  currentRecord: OffenderCase;
}

export const DomainMatrixView: React.FC<DomainMatrixViewProps> = ({ currentRecord }) => {
  const { user } = useAuth();
  const c = currentRecord;
  const userRole = user?.role || 'Warden';
  const matrixData = getDomainMatrix(c);
  const lowest = getLowestDomains(c, userRole);
  const priorities = lowest.slice(0, 3).map((x) => x[0]);
  const isRestricted = isRoleRestricted(userRole);

  return (
    <div className="card">
      <h2>{c.id}: {"Progression"} </h2>
      <table className="app-table">
        <tbody>
          {matrixData.map(([domainName, val, isClinical], i) => {
            const restricted = isClinical && isRestricted;
            return (
              <tr key={i}>
                <td className="w-1/3 font-medium">{domainName}</td>
                {restricted ? (
                  <td colSpan={2} className="mute italic text-xs">
                    Restricted (Clinical Psych Only)
                  </td>
                ) : (
                  <>
                    <td style={{ width: '45%' }}>
                      <div className="bar">
                        <i
                          style={{
                            width: `${val}%`,
                            background:
                              val >= TH
                                ? 'var(--ok)'
                                : val >= 50
                                ? 'var(--acc)'
                                : 'var(--bad)',
                          }}
                        />
                      </div>
                    </td>
                    <td className="w-16 font-semibold">{val}%</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="note-box mt-4 text-xs">
        <b>Priority for next review cycle:</b> {priorities.join(' + ')}
      </div>
      <p className="mute text-xs mt-2">
        Percentages are operational indicators tracking progress toward gate advancement.
      </p>
    </div>
  );
};
