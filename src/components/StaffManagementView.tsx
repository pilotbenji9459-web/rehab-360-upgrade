import React, { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { StaffRole } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Lock,
  Badge,
  Building,
} from 'lucide-react';

interface StaffManagementViewProps {
  showAlert: (msg: string, title?: string) => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ showAlert }) => {
  const { user, hasRole } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showProvisionForm, setShowProvisionForm] = useState<boolean>(false);

  // Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('Case Manager');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [tempPassword, setTempPassword] = useState('RehabPath360!');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await Api.getStaffList();
      setStaffList(res.staff || []);
    } catch (err: any) {
      console.error('Failed to fetch staff list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasRole(['Administrator', 'Warden'])) {
      fetchStaff();
    }
  }, []);

  if (!hasRole(['Administrator', 'Warden'])) {
    return (
      <div className="card text-center py-12">
        <ShieldCheck className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="font-serif text-lg">Staff Administration Restricted</h2>
        <p className="mute text-xs">Access limited to Executive Administrators and Wardens.</p>
      </div>
    );
  }

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !badgeNumber) {
      showAlert('All staff fields are required.', 'Validation');
      return;
    }

    setIsSubmitting(true);
    try {
      await Api.provisionStaff({
        full_name: fullName,
        email,
        role,
        badge_number: badgeNumber,
        department: department || 'Operations',
        temporary_password: tempPassword,
      });

      showAlert(`Staff account created for ${fullName} (${role}). Temporary credentials active.`, 'Account Provisioned');
      setShowProvisionForm(false);
      setFullName('');
      setEmail('');
      setBadgeNumber('');
      setDepartment('');
      fetchStaff();
    } catch (err: any) {
      showAlert(err.message || 'Failed to provision staff account.', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0079d6]/10 text-[#0079d6] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2>Institutional Staff Accounts &amp; RBAC Directory</h2>
              <p className="mute text-xs">
                Manage credentialed staff members, institutional roles, and access boundaries.
              </p>
            </div>
          </div>

          {hasRole(['Administrator']) && (
            <button
              type="button"
              onClick={() => setShowProvisionForm(!showProvisionForm)}
              className="px-4 py-2 rounded-lg bg-[#0079d6] hover:bg-[#006bbd] text-white text-xs font-semibold shadow transition-all flex items-center gap-1.5 cursor-pointer w-fit"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showProvisionForm ? 'Cancel' : 'Provision Staff Account'}</span>
            </button>
          )}
        </div>
      </div>

      {showProvisionForm && (
        <form onSubmit={handleProvision} className="card border-t-3 border-[#0079d6] space-y-4">
          <h3 className="font-serif">Provision New Institutional Account</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Officer Sarah Jenkins"
                className="w-full text-xs rounded border border-[var(--line)] py-1.5 px-2.5 bg-[var(--panel)]"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1">Institutional Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="s.jenkins@rehabpath.gov"
                className="w-full text-xs rounded border border-[var(--line)] py-1.5 px-2.5 bg-[var(--panel)]"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1">Assigned Staff Role</label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full text-xs rounded border border-[var(--line)] py-1.5 px-2.5 bg-[var(--panel)]"
              >
                <option value="Administrator">Administrator</option>
                <option value="Warden">Warden</option>
                <option value="Psychologist">Psychologist</option>
                <option value="Case Manager">Case Manager</option>
                <option value="Educator">Educator</option>
                <option value="Community Rehabilitation Officer">Community Rehabilitation Officer</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1">Badge / Officer ID</label>
              <input
                type="text"
                required
                value={badgeNumber}
                onChange={(e) => setBadgeNumber(e.target.value)}
                placeholder="e.g. CSM-24"
                className="w-full text-xs rounded border border-[var(--line)] py-1.5 px-2.5 bg-[var(--panel)]"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Inmate Development & Case Management"
                className="w-full text-xs rounded border border-[var(--line)] py-1.5 px-2.5 bg-[var(--panel)]"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1">Initial Temporary Password</label>
              <input
                type="text"
                required
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="w-full text-xs rounded border border-[var(--line)] py-1.5 px-2.5 bg-[var(--panel)]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowProvisionForm(false)}
              className="sec text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#0079d6] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Provisioning...' : 'Create Account'}
            </button>
          </div>
        </form>
      )}

      {/* Staff Table */}
      <div className="card">
        <h3>Active Staff Accounts ({staffList.length})</h3>
        <div className="scroll-container mt-3">
          <table className="app-table">
            <thead>
              <tr>
                <th>Officer</th>
                <th>Role</th>
                <th>Badge #</th>
                <th>Department</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-xs text-[var(--ink)]">{s.full_name}</td>
                  <td>
                    <span className="tag o text-[11px] font-semibold">{s.role}</span>
                  </td>
                  <td className="font-mono text-xs">{s.badge_number}</td>
                  <td className="text-xs text-[var(--mute)]">{s.department}</td>
                  <td className="text-xs">{s.email}</td>
                  <td>
                    <span className="tag o text-[10px] uppercase font-semibold">Active</span>
                  </td>
                  <td className="text-xs text-[var(--mute)]">
                    {s.last_login_at ? new Date(s.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
