import React, { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { AuditEvent } from '../types';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Filter, RefreshCw, Lock } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');

  const isAuthorized = hasRole(['Administrator', 'Warden']);

  const fetchAuditEvents = async () => {
    setIsLoading(true);
    try {
      const res = await Api.getAuditEvents();
      setEvents(res.events || []);
    } catch (err: any) {
      console.error('Failed to load audit events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchAuditEvents();
    } else {
      setIsLoading(false);
    }
  }, [isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="card text-center py-12">
        <Lock className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="font-serif text-lg">System Audit Log Restricted</h2>
        <p className="mute text-xs">Access to the immutable audit trail is restricted to Facility Administrators and Wardens.</p>
      </div>
    );
  }

  const filtered = events.filter((e) => {
    if (filterAction === 'all') return true;
    return e.action.includes(filterAction);
  });

  return (
    <div className="card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2>Institutional Security &amp; Data Audit Trail</h2>
          <p className="mute text-xs">
            Append-only server-side record of authentication events, case updates, document AI ingestions, and permissions checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs rounded border border-[var(--line)] py-1.5 px-2 bg-[var(--panel)]"
          >
            <option value="all">All Audit Actions</option>
            <option value="LOGIN">Authentication Events</option>
            <option value="CASE">Case Record Updates</option>
            <option value="DECISION">Placement Decisions</option>
            <option value="DOCUMENT">Document Ingestion &amp; AI</option>
            <option value="CLINICAL">Clinical Notes</option>
            <option value="PERMISSION">Security &amp; Denials</option>
          </select>

          <button
            type="button"
            onClick={fetchAuditEvents}
            className="sec text-xs px-2.5 py-1.5 flex items-center gap-1 rounded cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="scroll-container">
        <table className="app-table text-xs">
          <thead>
            <tr>
              <th className="whitespace-nowrap">Timestamp (UTC)</th>
              <th>Staff Actor</th>
              <th>Action</th>
              <th>Resource ID</th>
              <th>Change Details</th>
              <th>IP Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap text-[var(--mute)]">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="font-medium">
                    {entry.actor_name}
                    <span className="block text-[10px] text-[var(--mute)]">{entry.actor_role}</span>
                  </td>
                  <td>
                    <span
                      className={`tag text-[10px] uppercase font-mono ${
                        entry.status === 'denied' ? 'b' : 'o'
                      }`}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-[#0079d6]">{entry.resource_id}</td>
                  <td className="text-xs leading-relaxed max-w-sm">{entry.details}</td>
                  <td className="font-mono text-[10px] text-[var(--mute)]">{entry.ip_address}</td>
                  <td>
                    <span
                      className={`tag ${entry.status === 'success' ? 'o' : 'b'} text-[10px] uppercase font-semibold`}
                    >
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="mute text-center py-6">
                  {isLoading ? 'Loading audit records...' : 'No matching audit events logged.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
