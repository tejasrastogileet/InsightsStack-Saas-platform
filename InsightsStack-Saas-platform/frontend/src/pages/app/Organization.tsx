import { useCallback, useEffect, useState } from 'react';
import { Building2, UserPlus, Mail, Crown, Shield, Eye, Trash2, Loader2 } from 'lucide-react';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import { orgService } from '@/services';
import { useWorkspaceStore } from '@/store';

interface Member {
  id: number;
  user: string;
  user_name: string;
  user_email: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  joined_at: string;
  is_active: boolean;
}

const roleStyle: Record<string, string> = {
  admin: 'badge-primary',
  manager: 'badge-violet',
  analyst: 'badge-success',
  viewer: 'badge-muted',
};

const roleIcon: Record<string, typeof Crown> = {
  admin: Crown,
  manager: Shield,
  analyst: Building2,
  viewer: Eye,
};

function errorMessage(error: unknown) {
  if (isAxiosError<Record<string, unknown>>(error)) {
    const data = error.response?.data;
    if (typeof data?.detail === 'string') return data.detail;
    const firstError = Object.values(data ?? {}).find(value => Array.isArray(value) && typeof value[0] === 'string');
    if (Array.isArray(firstError)) return firstError[0];
  }
  return 'The organization change could not be completed.';
}

export default function Organization() {
  const organization = useWorkspaceStore(state => state.currentOrg);
  const setCurrentOrg = useWorkspaceStore(state => state.setCurrentOrg);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Member['role']>('analyst');
  const [tab, setTab] = useState<'members' | 'settings'>('members');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState(organization?.name ?? '');
  const [website, setWebsite] = useState(organization?.website ?? '');
  const [industry, setIndustry] = useState(organization?.industry ?? '');
  const [description, setDescription] = useState(organization?.description ?? '');

  useEffect(() => {
    setName(organization?.name ?? '');
    setWebsite(organization?.website ?? '');
    setIndustry(organization?.industry ?? '');
    setDescription(organization?.description ?? '');
  }, [organization]);

  const loadMembers = useCallback(async () => {
    if (!organization?.id) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await orgService.getMembers(organization.id);
      setMembers(data);
    } catch (loadError) {
      const message = errorMessage(loadError);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const addMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization?.id || !inviteEmail.trim()) return;
    setSaving(true);
    try {
      await orgService.inviteMember(organization.id, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
      await loadMembers();
      toast.success('Organization member added.');
    } catch (inviteError) {
      toast.error(errorMessage(inviteError));
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (member: Member, role: Member['role']) => {
    if (!organization?.id || role === member.role) return;
    try {
      await orgService.updateMember(organization.id, String(member.id), role);
      setMembers(current => current.map(item => item.id === member.id ? { ...item, role } : item));
      toast.success('Member role updated.');
    } catch (updateError) {
      toast.error(errorMessage(updateError));
    }
  };

  const removeMember = async (member: Member) => {
    if (!organization?.id || !window.confirm(`Remove ${member.user_email} from this organization?`)) return;
    try {
      await orgService.removeMember(organization.id, String(member.id));
      setMembers(current => current.filter(item => item.id !== member.id));
      toast.success('Organization member removed.');
    } catch (removeError) {
      toast.error(errorMessage(removeError));
    }
  };

  const saveOrganization = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization?.id) return;
    setSaving(true);
    try {
      const { data } = await orgService.update(organization.id, {
        name: name.trim(),
        website: website.trim(),
        industry: industry.trim(),
        description: description.trim(),
      });
      setCurrentOrg(data);
      toast.success('Organization settings saved.');
    } catch (saveError) {
      toast.error(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-[1000px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 size={22} className="text-brand-400" /> Organization
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">{organization?.name ?? 'Choose a workspace to manage organization settings.'}</p>
      </div>

      {!organization ? (
        <div role="alert" className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-200">
          There is no active organization for the selected workspace.
        </div>
      ) : (
        <>
          <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1 w-fit">
            {(['members', 'settings'] as const).map(value => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${tab === value ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {value}
              </button>
            ))}
          </div>

          {tab === 'members' ? (
            <div className="space-y-4">
              <form onSubmit={addMember} className="card p-4 flex flex-wrap items-center gap-3">
                <Mail size={16} className="text-slate-500 flex-shrink-0" />
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={event => setInviteEmail(event.target.value)}
                  placeholder="Add an existing account by email..."
                  className="min-w-48 flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none"
                />
                <select value={inviteRole} onChange={event => setInviteRole(event.target.value as Member['role'])} className="bg-dark-muted border border-dark-border text-slate-300 text-xs rounded-lg px-2 py-1.5 outline-none">
                  <option value="analyst">Analyst</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" disabled={saving} className="btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Add Member
                </button>
                <p className="w-full pl-7 text-xs text-slate-500">This adds an account that already exists; invitation emails are not configured.</p>
              </form>

              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
                  <h2 className="font-semibold text-white">Team Members</h2>
                  <span className="badge-muted">{members.length} members</span>
                </div>
                {loading ? (
                  <div className="flex justify-center p-10"><Loader2 className="animate-spin text-brand-400" /></div>
                ) : error ? (
                  <p role="alert" className="p-5 text-sm text-red-300">{error}</p>
                ) : members.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-500">No members are available to display.</p>
                ) : (
                  <div className="divide-y divide-dark-border">
                    {members.map(member => {
                      const RoleIcon = roleIcon[member.role] ?? Eye;
                      return (
                        <div key={member.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-dark-card/50 transition-colors group">
                          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold flex-shrink-0">
                            {member.user_name?.[0] ?? member.user_email[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium">{member.user_name || member.user_email}</p>
                            <p className="text-xs text-slate-500">{member.user_email}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="hidden md:flex items-center gap-1.5">
                              <RoleIcon size={12} className="text-slate-500" />
                              <select
                                aria-label={`Role for ${member.user_email}`}
                                value={member.role}
                                onChange={event => void updateRole(member, event.target.value as Member['role'])}
                                className={`badge text-[10px] ${roleStyle[member.role]} bg-transparent`}
                              >
                                {(['admin', 'manager', 'analyst', 'viewer'] as const).map(role => <option key={role} value={role}>{role}</option>)}
                              </select>
                            </div>
                            <span className={`badge text-[10px] ${member.is_active ? 'badge-success' : 'badge-warning'}`}>
                              {member.is_active ? 'active' : 'inactive'}
                            </span>
                            <span className="text-xs text-slate-600 hidden lg:block">Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                            <button
                              aria-label={`Remove ${member.user_email}`}
                              onClick={() => void removeMember(member)}
                              className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={saveOrganization} className="card p-6 space-y-6">
              <h2 className="text-white font-semibold">Organization Settings</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="organization-name" className="block text-sm font-medium text-slate-300 mb-1.5">Organization Name</label>
                  <input id="organization-name" value={name} onChange={event => setName(event.target.value)} className="input w-full" required />
                </div>
                <div>
                  <label htmlFor="organization-website" className="block text-sm font-medium text-slate-300 mb-1.5">Website</label>
                  <input id="organization-website" type="url" value={website} onChange={event => setWebsite(event.target.value)} className="input w-full" />
                </div>
                <div>
                  <label htmlFor="organization-industry" className="block text-sm font-medium text-slate-300 mb-1.5">Industry</label>
                  <input id="organization-industry" value={industry} onChange={event => setIndustry(event.target.value)} className="input w-full" />
                </div>
                <div>
                  <label htmlFor="organization-description" className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                  <textarea id="organization-description" value={description} onChange={event => setDescription(event.target.value)} rows={3} className="input w-full resize-none" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />} Save Changes
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
