import { useEffect, useState } from 'react';
import { User, Shield, Bell, Moon, Sun, Lock, Loader2 } from 'lucide-react';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import { authService, userService } from '@/services';
import { useAuthStore, useThemeStore } from '@/store';

function errorMessage(error: unknown) {
  if (isAxiosError<Record<string, unknown>>(error)) {
    const data = error.response?.data;
    if (typeof data?.detail === 'string') return data.detail;
    if (typeof data?.error === 'string') return data.error;
    const firstFieldError = Object.values(data ?? {}).find(value => Array.isArray(value) && typeof value[0] === 'string');
    if (Array.isArray(firstFieldError)) return firstFieldError[0];
  }
  return 'The requested change could not be saved.';
}

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [avatar, setAvatar] = useState<File>();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; url: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingMfa, setSavingMfa] = useState(false);

  useEffect(() => {
    setFirstName(user?.first_name ?? '');
    setLastName(user?.last_name ?? '');
  }, [user?.first_name, user?.last_name]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (avatar && avatar.size > 2 * 1024 * 1024) {
      toast.error('Profile photos must be 2 MB or smaller.');
      return;
    }
    setSavingProfile(true);
    try {
      const response = await userService.updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        ...(avatar ? { avatar } : {}),
      });
      if (user) setUser({ ...user, ...response.data, full_name: `${firstName.trim()} ${lastName.trim()}`.trim() });
      setAvatar(undefined);
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      toast.success('Password changed.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  const beginMfaSetup = async () => {
    setSavingMfa(true);
    try {
      const { data } = await authService.setupMFA();
      setMfaSetup(data);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingMfa(false);
    }
  };

  const verifyMfa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingMfa(true);
    try {
      await authService.verifyMFA(mfaCode);
      if (user) setUser({ ...user, profile: { ...user.profile, mfa_enabled: true } });
      setMfaCode('');
      setMfaSetup(null);
      toast.success('Two-factor authentication enabled.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingMfa(false);
    }
  };

  const scrollTo = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1000px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <User size={22} className="text-brand-400" /> Account Settings
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your profile, security, and preferences</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <nav aria-label="Settings sections" className="space-y-1">
          <button onClick={() => scrollTo('profile-settings')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-card border border-brand-500/30 text-white font-medium text-sm">
            <User size={16} className="text-brand-400" /> Profile
          </button>
          <button onClick={() => scrollTo('security-settings')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-dark-card text-slate-400 hover:text-white font-medium text-sm transition-colors">
            <Shield size={16} className="text-slate-500" /> Security
          </button>
          <button onClick={() => toast('Notification delivery preferences are not available yet.')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-dark-card text-slate-400 hover:text-white font-medium text-sm transition-colors">
            <Bell size={16} className="text-slate-500" /> Notifications
          </button>
          <button onClick={() => scrollTo('appearance-settings')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-dark-card text-slate-400 hover:text-white font-medium text-sm transition-colors">
            <Sun size={16} className="text-slate-500" /> Appearance
          </button>
        </nav>

        <div className="md:col-span-2 space-y-6">
          <section id="profile-settings" className="card p-6 scroll-mt-6">
            <h2 className="text-white font-semibold mb-5">Profile Information</h2>
            <form onSubmit={saveProfile}>
              <div className="flex items-center gap-5 mb-8">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-brand flex items-center justify-center text-3xl font-bold text-white shadow-glow">
                    {firstName[0] ?? 'U'}
                  </div>
                )}
                <div>
                  <label className="btn-secondary btn-sm mb-2 inline-block cursor-pointer">
                    Upload Photo
                    <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={event => setAvatar(event.target.files?.[0])} />
                  </label>
                  <p className="text-xs text-slate-500">{avatar?.name ?? 'JPG or PNG, max 2 MB'}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium text-slate-300 mb-1.5">First Name</label>
                  <input id="first-name" value={firstName} onChange={event => setFirstName(event.target.value)} className="input w-full" required />
                </div>
                <div>
                  <label htmlFor="last-name" className="block text-sm font-medium text-slate-300 mb-1.5">Last Name</label>
                  <input id="last-name" value={lastName} onChange={event => setLastName(event.target.value)} className="input w-full" required />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                  <input id="email" type="email" value={user?.email ?? ''} className="input w-full" disabled />
                  <p className="text-xs text-slate-500 mt-1.5">Contact an administrator to change your email address.</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-dark-border">
                <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  {savingProfile && <Loader2 size={14} className="animate-spin" />} Save Changes
                </button>
              </div>
            </form>
          </section>

          <section id="security-settings" className="card p-6 scroll-mt-6">
            <h2 className="text-white font-semibold mb-5">Security</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <h3 className="text-sm font-medium text-slate-200">Change password</h3>
              <input type="password" value={oldPassword} onChange={event => setOldPassword(event.target.value)} autoComplete="current-password" placeholder="Current password" className="input w-full" required />
              <input type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" placeholder="New password" className="input w-full" minLength={8} required />
              <button type="submit" disabled={savingPassword} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
                {savingPassword && <Loader2 size={14} className="animate-spin" />} Change Password
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-dark-border">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Lock size={18} className="mt-1 text-emerald-400" />
                  <div>
                    <p className="text-white font-medium text-sm">Two-Factor Authentication (2FA)</p>
                    <p className="text-slate-400 text-xs mt-0.5">{user?.profile.mfa_enabled ? 'MFA is enabled for your account.' : 'Use an authenticator app to secure sign-in.'}</p>
                  </div>
                </div>
                {!user?.profile.mfa_enabled && !mfaSetup && (
                  <button onClick={() => void beginMfaSetup()} disabled={savingMfa} className="btn-secondary btn-sm disabled:opacity-50">
                    {savingMfa ? 'Preparing...' : 'Enable'}
                  </button>
                )}
              </div>
              {mfaSetup && !user?.profile.mfa_enabled && (
                <form onSubmit={verifyMfa} className="mt-4 space-y-3">
                  <p className="text-sm text-slate-300">Add this setup key to your authenticator app, then enter its current code.</p>
                  <code className="block break-all rounded-lg bg-dark-bg p-3 text-sm text-brand-300">{mfaSetup.secret}</code>
                  <a href={mfaSetup.url} className="text-xs text-brand-400 underline">Open authenticator setup link</a>
                  <input value={mfaCode} onChange={event => setMfaCode(event.target.value)} inputMode="numeric" maxLength={6} pattern="[0-9]{6}" placeholder="6-digit code" className="input w-full" required />
                  <button type="submit" disabled={savingMfa} className="btn-primary btn-sm disabled:opacity-50">
                    {savingMfa ? 'Verifying...' : 'Verify and Enable'}
                  </button>
                </form>
              )}
            </div>
          </section>

          <section id="appearance-settings" className="card p-6 scroll-mt-6">
            <h2 className="text-white font-semibold mb-5">Appearance</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['dark', 'light'] as const).map(value => {
                const Icon = value === 'dark' ? Moon : Sun;
                return (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      theme === value ? 'border-brand-500 bg-brand-500/10' : 'border-dark-border bg-dark-card hover:border-slate-600'
                    }`}
                  >
                    <Icon size={20} className={theme === value ? 'text-brand-400' : 'text-slate-400'} />
                    <span className={`text-sm font-medium capitalize ${theme === value ? 'text-brand-400' : 'text-slate-400'}`}>{value}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
