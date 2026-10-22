import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, Mail, Save, ShieldCheck, User as UserIcon, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  editor: 'Editor',
  viewer: 'Viewer',
};

const roleDescriptions: Record<string, string> = {
  admin: 'Full access to content, publishing, settings, and team management.',
  editor: 'Can create and publish content, products, and site settings.',
  viewer: 'Read-only dashboard access with personal profile controls.',
};

export const Profile: React.FC = () => {
  const { user, isAdmin, updateProfile, changePassword } = useAuth();
  const { cmsMode } = useTheme();
  const isLight = cmsMode === 'light';

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setSavingProfile(true);
    const result = await updateProfile(profileName, profileEmail);
    setSavingProfile(false);
    if (!result.success) {
      setProfileError(result.error || 'Profile update failed.');
      return;
    }
    setProfileSuccess('Profile updated successfully.');
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setSavingPassword(false);
    if (!result.success) {
      setPasswordError(result.error || 'Password change failed.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess('Password changed successfully.');
  };

  const cardClass = `rounded-2xl border p-5 sm:p-6 shadow-xs ${
    isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
  }`;
  const labelClass = `block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`;
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#35123F] ${
    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D101D] border-slate-700 text-white'
  }`;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className={`border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>My Profile</h2>
        <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Manage your personal account details, password, and view your access level.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cardClass}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#35123F] to-[#171B2C] border border-[#D5A13C]/40 flex items-center justify-center text-lg font-bold text-[#D5A13C]">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {user?.name || 'Administrator'}
              </p>
              <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {user?.email}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D5A13C]" />
              <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                Role: <strong className="uppercase">{roleLabels[user?.role || 'viewer']}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[#35123F]" />
              <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                Member since{' '}
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'unknown'}
              </span>
            </div>
          </div>

          <p className={`mt-5 text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {roleDescriptions[user?.role || 'viewer']}
          </p>

          {isAdmin && (
            <Link
              to="/admin/users"
              className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#35123F] hover:bg-[#24102D] text-white text-xs font-bold transition-colors"
            >
              <Users className="w-4 h-4" />
              Manage team access
            </Link>
          )}
        </div>

        <div className={`${cardClass} lg:col-span-2`}>
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-4 h-4 text-[#35123F]" />
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Personal Information
            </h3>
          </div>

          {profileError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}
          {profileSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(event) => setProfileEmail(event.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#35123F] hover:bg-[#24102D] text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-[#D5A13C]" />
          <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Change Password
          </h3>
        </div>

        {passwordError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}
        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={inputClass}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
          </div>
          <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Use at least 8 characters. You will stay signed in after changing your password.
          </p>
          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#171B2C] hover:bg-[#232A44] text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
