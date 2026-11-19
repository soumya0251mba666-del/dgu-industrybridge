import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, Plus, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import type {
  AvailabilityStatus,
  SkillProficiency,
  StudentSkill,
  User,
  WorkspaceSnapshot,
} from '../types/models';
import { formatINR, STANDARD_SKILLS } from '../utils/domain';
import { ProjectStepper, StatusBadge } from './StatusBadge';

interface StudentDashboardProps {
  user: User;
  workspace: WorkspaceSnapshot;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export function StudentDashboard({
  user,
  workspace,
  onRefresh,
  onNavigate,
}: StudentDashboardProps) {
  const myProfile = workspace.students.find((s) => s.userId === user.id);

  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(myProfile?.name || user.name);
  const [enrollmentNumber, setEnrollmentNumber] = useState(myProfile?.enrollmentNumber || '');
  const [programBatch, setProgramBatch] = useState(myProfile?.programBatch || 'MBA · Batch 2025–27');
  const [phone, setPhone] = useState(myProfile?.phone || '');
  const [skills, setSkills] = useState<StudentSkill[]>(myProfile?.skills || []);
  const [newSkillName, setNewSkillName] = useState<string>(STANDARD_SKILLS[0]);
  const [newSkillProf, setNewSkillProf] = useState<SkillProficiency>('Intermediate');
  const [pastProjects, setPastProjects] = useState(myProfile?.pastProjects || '');
  const [portfolioUrl, setPortfolioUrl] = useState(myProfile?.portfolioUrl || '');
  const [weeklyHours, setWeeklyHours] = useState(myProfile?.weeklyHours || 12);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(
    myProfile?.availabilityStatus || 'Available'
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');

  const myProjects = workspace.projects;
  const chartersByProject = new Map(workspace.charters.map((c) => [c.projectId, c]));

  const pendingInvitations = myProfile
    ? myProjects.filter((p) => p.studentResponses[myProfile.id] === 'Pending')
    : [];

  function addSkill() {
    if (!newSkillName.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      setSkills((prev) =>
        prev.map((s) =>
          s.name.toLowerCase() === newSkillName.trim().toLowerCase()
            ? { ...s, proficiency: newSkillProf }
            : s
        )
      );
      return;
    }
    setSkills((prev) => [...prev, { name: newSkillName.trim(), proficiency: newSkillProf }]);
  }

  function removeSkill(skillName: string) {
    setSkills((prev) => prev.filter((s) => s.name !== skillName));
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaveMessage('');
    setSaving(true);
    try {
      await api.updateMyStudentProfile({
        name,
        enrollmentNumber,
        programBatch,
        phone,
        skills,
        pastProjects,
        portfolioUrl,
        weeklyHours: Number(weeklyHours),
        availabilityStatus,
      });
      await onRefresh();
      setEditingProfile(false);
      setSaveMessage('Profile updated and visible to IndustryBridge coordinator.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRespond(projectId: string, response: 'Accepted' | 'Declined') {
    await api.respondAssignment(projectId, response);
    await onRefresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Workspace</h1>
          <p className="text-sm text-slate-600 mt-1">
            Keep your DGU skill profile current, respond to matched project invitations, and submit deliverables.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingProfile(!editingProfile)}
          className="px-4 py-2 text-sm font-semibold text-[#0F2D52] bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
        >
          {editingProfile ? 'Cancel Edit' : 'Edit Skill Profile'}
        </button>
      </div>

      {saveMessage && (
        <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs font-medium text-teal-800">
          {saveMessage}
        </div>
      )}

      {/* Pending Invitations Alert */}
      {pendingInvitations.length > 0 && myProfile && (
        <section className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#0F2D52]">
            Project Invitations Awaiting Response ({pendingInvitations.length})
          </h2>
          <div className="space-y-3">
            {pendingInvitations.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="text-xs text-slate-500">
                    {p.businessName} · {p.location} · {p.timeline}
                    {p.teamLeadId === myProfile.id ? ' · Nominated as Team Lead' : ''}
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{p.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRespond(p.id, 'Accepted')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Accept</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespond(p.id, 'Declined')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Student Skill & Profile Card / Editor */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        {editingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Update DGU Student Profile</h2>
            {error && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="sp-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  id="sp-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="sp-enr" className="block text-xs font-semibold text-slate-700 mb-1">
                  DGU Enrollment Number
                </label>
                <input
                  id="sp-enr"
                  required
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="sp-batch" className="block text-xs font-semibold text-slate-700 mb-1">
                  Program &amp; Batch
                </label>
                <input
                  id="sp-batch"
                  required
                  value={programBatch}
                  onChange={(e) => setProgramBatch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="sp-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  id="sp-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="sp-hours" className="block text-xs font-semibold text-slate-700 mb-1">
                  Weekly Availability (Hours)
                </label>
                <input
                  id="sp-hours"
                  type="number"
                  min={1}
                  max={40}
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="sp-avail" className="block text-xs font-semibold text-slate-700 mb-1">
                  Availability Status
                </label>
                <select
                  id="sp-avail"
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                </select>
              </div>
            </div>

            {/* Skills Editor */}
            <div className="border-t border-slate-200 pt-4">
              <span className="block text-xs font-semibold text-slate-700 mb-2">
                Skills &amp; Proficiency
              </span>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((sk) => (
                  <div
                    key={sk.name}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs"
                  >
                    <span className="font-semibold text-slate-900">{sk.name}</span>
                    <span className="text-slate-500">· {sk.proficiency}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(sk.name)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label={`Remove ${sk.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Choose skill"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  {STANDARD_SKILLS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Choose skill proficiency"
                  value={newSkillProf}
                  onChange={(e) => setNewSkillProf(e.target.value as SkillProficiency)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <button
                  type="button"
                  onClick={addSkill}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#0F2D52] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add Skill</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sp-past" className="block text-xs font-semibold text-slate-700 mb-1">
                  Past Projects / Internships
                </label>
                <textarea
                  id="sp-past"
                  rows={2}
                  value={pastProjects}
                  onChange={(e) => setPastProjects(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="sp-link" className="block text-xs font-semibold text-slate-700 mb-1">
                  Portfolio / LinkedIn Link
                </label>
                <input
                  id="sp-link"
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73]"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : myProfile ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{myProfile.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {myProfile.enrollmentNumber} · {myProfile.programBatch} · {myProfile.email}
                </p>
              </div>
              <div className="text-xs font-semibold text-slate-700 tabular-nums">
                Status:{' '}
                <span
                  className={
                    myProfile.availabilityStatus === 'Available'
                      ? 'text-teal-700'
                      : 'text-amber-700'
                  }
                >
                  {myProfile.availabilityStatus}
                </span>{' '}
                · {myProfile.weeklyHours} hrs/week
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
              {myProfile.skills.map((s) => (
                <span key={s.name}>
                  <strong className="font-semibold text-slate-900">{s.name}</strong> ({s.proficiency})
                </span>
              ))}
            </div>

            {myProfile.pastProjects && (
              <p className="text-sm text-slate-600">{myProfile.pastProjects}</p>
            )}
          </div>
        ) : null}
      </section>

      {/* Assigned Projects */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          Assigned Projects ({myProjects.length})
        </h2>

        {myProjects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-sm font-semibold text-slate-900">No projects assigned yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Keep your skill tags and availability up to date. You will receive an in-app notification when matched.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myProjects.map((p) => {
              const charter = chartersByProject.get(p.id);
              const myResp = myProfile ? p.studentResponses[myProfile.id] : undefined;
              const isLead = myProfile?.id === p.teamLeadId;

              return (
                <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                        <span>{p.businessName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{isLead ? 'Team Lead' : 'Team Member'}</span>
                        {myResp && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Invite: {myResp}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{p.title}</h3>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  <ProjectStepper status={p.status} />

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div>
                      {charter ? (
                        <span className="font-mono tabular-nums">
                          Team Payout: {formatINR(charter.studentPayoutInr)} (Charter{' '}
                          {charter.approvedByBusiness ? 'Approved' : 'Pending Business Approval'})
                        </span>
                      ) : (
                        <span>Charter pending coordinator setup</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate(`/projects/${p.id}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#0F2D52] text-white hover:bg-[#173f73]"
                    >
                      <span>Open Workspace &amp; Deliverables</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
