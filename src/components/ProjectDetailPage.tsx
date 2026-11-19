import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileCheck2,
  IndianRupee,
  MessageSquareHeart,
  Send,
  Upload,
} from 'lucide-react';
import { api } from '../lib/api';
import type {
  AvailabilityStatus,
  DeliverableFileType,
  ProjectStatus,
  SkillProficiency,
  User,
  WorkspaceSnapshot,
} from '../types/models';
import {
  filterStudents,
  formatINR,
  generateWhatsAppMessage,
  PROJECT_STATUSES,
  rankStudentsBySkillOverlap,
  STANDARD_SKILLS,
  type WhatsAppTemplateType,
} from '../utils/domain';
import { ProjectStepper, StatusBadge } from './StatusBadge';

interface ProjectDetailPageProps {
  projectId: string;
  user: User;
  workspace: WorkspaceSnapshot;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export function ProjectDetailPage({
  projectId,
  user,
  workspace,
  onRefresh,
  onNavigate,
}: ProjectDetailPageProps) {
  const project = workspace.projects.find((p) => p.id === projectId);
  const charter = workspace.charters.find((c) => c.projectId === projectId);
  const deliverables = workspace.deliverables.filter((d) => d.projectId === projectId);
  const feedback = workspace.feedbacks.find((f) => f.projectId === projectId);
  const messages = workspace.messages.filter((m) => m.projectId === projectId);

  // Manual Matching state (Admin only)
  const [selectedIds, setSelectedIds] = useState<string[]>(project?.assignedStudentIds || []);
  const [teamLeadId, setTeamLeadId] = useState<string>(project?.teamLeadId || '');
  const [matchSkillFilter, setMatchSkillFilter] = useState('All');
  const [matchProfFilter, setMatchProfFilter] = useState<SkillProficiency | 'All'>('All');
  const [matchAvailFilter, setMatchAvailFilter] = useState<AvailabilityStatus | 'All'>('All');
  const [assigning, setAssigning] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [matchSuccess, setMatchSuccess] = useState('');

  // Deliverable submission state (Student)
  const [delivTitle, setDelivTitle] = useState('');
  const [delivNotes, setDelivNotes] = useState('');
  const [delivType, setDelivType] = useState<DeliverableFileType>('PDF');
  const [delivUrl, setDelivUrl] = useState('');
  const [delivFileName, setDelivFileName] = useState('');
  const [delivFileDataUrl, setDelivFileDataUrl] = useState('');
  const [uploadingDeliv, setUploadingDeliv] = useState(false);
  const [delivError, setDelivError] = useState('');

  // Business deliverable review comments
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  // Payment recording (Admin)
  const [paymentRef, setPaymentRef] = useState(project?.paymentRef || '');
  const [paidAmount, setPaidAmount] = useState<number>(
    project?.paidAmount || charter?.totalFeeInr || project?.budgetMax || 5000
  );
  const [savingPayment, setSavingPayment] = useState(false);

  // Messaging thread
  const [messageBody, setMessageBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Copy WhatsApp message
  const [waType, setWaType] = useState<WhatsAppTemplateType>('team_assigned');
  const [copiedWa, setCopiedWa] = useState(false);

  if (!project) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-base font-bold text-slate-900">Project not found</p>
        <p className="text-sm text-slate-600 mt-1">
          You may not have access to this project or it was removed.
        </p>
        <button
          type="button"
          onClick={() =>
            onNavigate(
              user.role === 'admin'
                ? '/admin'
                : user.role === 'business'
                ? '/business'
                : '/student'
            )
          }
          className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg"
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  const backRoute =
    user.role === 'admin' ? '/admin' : user.role === 'business' ? '/business' : '/student';

  const myStudentProfile =
    user.role === 'student'
      ? workspace.students.find((s) => s.userId === user.id)
      : undefined;

  const assignedStudents = workspace.students.filter((s) =>
    project.assignedStudentIds.includes(s.id)
  );

  // Admin manual matching list
  const filteredPool = filterStudents(workspace.students, {
    skill: matchSkillFilter,
    proficiency: matchProfFilter,
    availability: matchAvailFilter,
  });
  const rankedStudents = rankStudentsBySkillOverlap(project.requiredSkills, filteredPool);

  function toggleStudentSelection(stuId: string) {
    setMatchError('');
    setSelectedIds((prev) => {
      if (prev.includes(stuId)) {
        const next = prev.filter((id) => id !== stuId);
        if (teamLeadId === stuId) setTeamLeadId(next[0] || '');
        return next;
      }
      if (prev.length >= 4) {
        setMatchError('Maximum 4 students allowed per project team.');
        return prev;
      }
      const next = [...prev, stuId];
      if (!teamLeadId) setTeamLeadId(stuId);
      return next;
    });
  }

  async function handleAssignTeam() {
    setMatchError('');
    setMatchSuccess('');
    if (selectedIds.length < 1 || selectedIds.length > 4) {
      setMatchError('Select 1 to 4 students first.');
      return;
    }
    const lead = teamLeadId && selectedIds.includes(teamLeadId) ? teamLeadId : selectedIds[0];
    setAssigning(true);
    try {
      await api.assignTeam(project!.id, selectedIds, lead);
      await onRefresh();
      setMatchSuccess('Team assigned and notified.');
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : 'Unable to assign team.');
    } finally {
      setAssigning(false);
    }
  }

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setDelivError('File size must be under 4 MB (or paste a Drive/OneDrive link).');
      return;
    }
    setDelivError('');
    setDelivFileName(file.name);
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.pdf')) setDelivType('PDF');
    else if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv'))
      setDelivType('Excel');
    else if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) setDelivType('PPT');

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDelivFileDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmitDeliverable(e: FormEvent) {
    e.preventDefault();
    setDelivError('');
    setUploadingDeliv(true);
    try {
      await api.submitDeliverable(project!.id, {
        title: delivTitle,
        notes: delivNotes,
        fileType: delivType,
        fileName: delivFileName || undefined,
        fileDataUrl: delivFileDataUrl || undefined,
        externalUrl: delivUrl || undefined,
      });
      setDelivTitle('');
      setDelivNotes('');
      setDelivUrl('');
      setDelivFileName('');
      setDelivFileDataUrl('');
      await onRefresh();
    } catch (err) {
      setDelivError(err instanceof Error ? err.message : 'Failed to upload deliverable.');
    } finally {
      setUploadingDeliv(false);
    }
  }

  async function handleReviewDeliverable(
    deliverableId: string,
    status: 'Approved' | 'Revision Requested'
  ) {
    await api.reviewDeliverable(deliverableId, status, reviewComments[deliverableId] || '');
    await onRefresh();
  }

  async function handleStatusChange(nextStatus: ProjectStatus) {
    await api.updateProjectStatus(project!.id, nextStatus);
    await onRefresh();
  }

  async function handleMarkPaid(e: FormEvent) {
    e.preventDefault();
    if (!paymentRef.trim()) return;
    setSavingPayment(true);
    try {
      await api.updateProjectStatus(project!.id, 'Paid', paymentRef.trim(), Number(paidAmount));
      await onRefresh();
    } finally {
      setSavingPayment(false);
    }
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!messageBody.trim()) return;
    setSendingMsg(true);
    try {
      await api.postMessage(project!.id, messageBody.trim());
      setMessageBody('');
      await onRefresh();
    } finally {
      setSendingMsg(false);
    }
  }

  const waMessage = generateWhatsAppMessage(waType, {
    recipientName:
      waType === 'team_assigned'
        ? assignedStudents[0]?.name || 'Team'
        : project.contactName,
    businessName: project.businessName,
    projectTitle: project.title,
    extra:
      waType === 'charter_approval' && charter
        ? `Fee: ${formatINR(charter.totalFeeInr)}`
        : waType === 'payment_recorded' && project.paymentRef
        ? project.paymentRef
        : undefined,
  });

  async function copyWhatsApp() {
    try {
      await navigator.clipboard.writeText(waMessage);
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    } catch {
      // Fallback ignored
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate(backRoute)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F2D52]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Workspace</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {(user.role === 'admin' || charter) && (
            <button
              type="button"
              onClick={() => onNavigate(`/projects/${project.id}/charter`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            >
              <FileCheck2 className="w-4 h-4 text-[#0F2D52]" aria-hidden="true" />
              <span>
                {charter
                  ? charter.approvedByBusiness
                    ? 'View Approved Charter'
                    : user.role === 'business'
                    ? 'Review & Approve Charter'
                    : 'Edit Project Charter'
                  : 'Create Project Charter'}
              </span>
            </button>
          )}
          {(user.role === 'business' || feedback) &&
            ['Delivered', 'Feedback Collected', 'Paid', 'Closed'].includes(project.status) && (
              <button
                type="button"
                onClick={() => onNavigate(`/projects/${project.id}/feedback`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800"
              >
                <MessageSquareHeart className="w-4 h-4" aria-hidden="true" />
                <span>{feedback ? 'View Feedback' : 'Submit Feedback'}</span>
              </button>
            )}
        </div>
      </div>

      {/* Top Project Header + 9-step Stepper */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {project.businessName} · {project.location} · {project.industry}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{project.title}</h1>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <ProjectStepper status={project.status} />

        {user.role === 'admin' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="admin-status-select" className="text-xs font-semibold text-slate-700">
                Pipeline Stage:
              </label>
              <select
                id="admin-status-select"
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                className="px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white"
              >
                {PROJECT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            {project.paymentRef && (
              <p className="text-xs font-mono text-emerald-800 font-semibold tabular-nums">
                Paid {formatINR(project.paidAmount || 0)} · Ref: {project.paymentRef}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Split Grid: Project Details (+ Manual Matcher for Admin beside it!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Project Brief & Team */}
        <div className={`${user.role === 'admin' ? 'lg:col-span-6' : 'lg:col-span-7'} space-y-6`}>
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Project Brief</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{project.description}</p>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block">Category</span>
                <span className="font-semibold text-slate-900">{project.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Preferred Timeline</span>
                <span className="font-semibold text-slate-900">{project.timeline}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Budget Range</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatINR(project.budgetMin)} – {formatINR(project.budgetMax)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Data Availability</span>
                <span className="font-semibold text-slate-900">{project.dataAvailability}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Expected Outcome</span>
                <p className="text-slate-800 mt-0.5">{project.expectedOutcome}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">Required Skills</span>
                <p className="text-slate-800 mt-0.5">{project.requiredSkills.join(' · ')}</p>
              </div>
              {project.confidentialityNotes && (
                <div>
                  <span className="text-slate-500 font-semibold block">Confidentiality Notes</span>
                  <p className="text-slate-800 mt-0.5">{project.confidentialityNotes}</p>
                </div>
              )}
              <div>
                <span className="text-slate-500 font-semibold block">Business Contact</span>
                <p className="text-slate-800 mt-0.5">
                  {project.contactName} · {project.phone} · {project.email}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Team Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              Assigned Student Team ({assignedStudents.length})
            </h2>
            {assignedStudents.length === 0 ? (
              <p className="text-sm text-slate-500">
                No students assigned yet. Coordinator reviews and selects 1–4 students manually.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignedStudents.map((stu) => {
                  const isLead = project.teamLeadId === stu.id;
                  const resp = project.studentResponses[stu.id] || 'Pending';
                  const isMe = myStudentProfile?.id === stu.id;
                  return (
                    <div key={stu.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {stu.name} {isLead ? '(Team Lead)' : ''}
                        </p>
                        <p className="text-xs text-slate-500">
                          {stu.programBatch} · {stu.skills.map((s) => s.name).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600">{resp}</span>
                        {isMe && resp === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => api.respondAssignment(project.id, 'Accepted').then(onRefresh)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-700 rounded"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => api.respondAssignment(project.id, 'Declined').then(onRefresh)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-300 rounded"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Feature C Manual Project Matching (Admin) OR Charter + Payment Summary */}
        <div className={`${user.role === 'admin' ? 'lg:col-span-6' : 'lg:col-span-5'} space-y-6`}>
          {user.role === 'admin' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Manual Project Matching
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ranked by tag-overlap count. Select 1–4 students and designate a Team Lead.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-[#0F2D52] tabular-nums">
                  {selectedIds.length}/4 selected
                </span>
              </div>

              {/* Filter Bar */}
              <div className="grid grid-cols-3 gap-2">
                <select
                  aria-label="Filter candidates by skill"
                  value={matchSkillFilter}
                  onChange={(e) => setMatchSkillFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="All">All Skills</option>
                  {STANDARD_SKILLS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter candidates by proficiency"
                  value={matchProfFilter}
                  onChange={(e) => setMatchProfFilter(e.target.value as SkillProficiency | 'All')}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="All">Any Level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <select
                  aria-label="Filter candidates by availability"
                  value={matchAvailFilter}
                  onChange={(e) => setMatchAvailFilter(e.target.value as AvailabilityStatus | 'All')}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="All">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                </select>
              </div>

              {matchError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                  {matchError}
                </p>
              )}
              {matchSuccess && (
                <p className="text-xs text-teal-800 bg-teal-50 border border-teal-200 rounded-lg p-2.5">
                  {matchSuccess}
                </p>
              )}

              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {rankedStudents.map(({ student, overlapCount, matchedSkills }) => {
                  const checked = selectedIds.includes(student.id);
                  const isLead = teamLeadId === student.id;
                  return (
                    <div
                      key={student.id}
                      className={`p-3.5 space-y-2 ${checked ? 'bg-blue-50/50' : 'bg-white'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudentSelection(student.id)}
                            className="mt-1 rounded border-slate-300 text-[#0F2D52]"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500">
                              {student.enrollmentNumber} · {student.availabilityStatus} ·{' '}
                              {student.weeklyHours}h/wk
                            </p>
                          </div>
                        </label>
                        <span className="text-xs font-mono font-semibold text-teal-700 tabular-nums shrink-0">
                          {overlapCount}/{project.requiredSkills.length} match
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 pl-6">
                        Skills:{' '}
                        {student.skills
                          .map((s) => `${s.name} (${s.proficiency})`)
                          .join(' · ')}
                        {matchedSkills.length > 0 && (
                          <span className="block text-teal-700 font-medium mt-0.5">
                            Matches: {matchedSkills.join(', ')}
                          </span>
                        )}
                      </p>

                      {checked && (
                        <div className="pl-6">
                          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F2D52] cursor-pointer">
                            <input
                              type="radio"
                              name="team-lead"
                              checked={isLead}
                              onChange={() => setTeamLeadId(student.id)}
                            />
                            <span>Designate as Team Lead</span>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAssignTeam}
                disabled={assigning}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73] disabled:opacity-50"
              >
                {assigning ? 'Assigning Team...' : 'Assign Team'}
              </button>
            </div>
          )}

          {/* Admin WhatsApp Copy Helper + Manual Payment Recorder */}
          {user.role === 'admin' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    Copy WhatsApp Message
                  </h2>
                  <select
                    aria-label="WhatsApp template"
                    value={waType}
                    onChange={(e) => setWaType(e.target.value as WhatsAppTemplateType)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="team_assigned">Team Assigned</option>
                    <option value="charter_approval">Charter Approval</option>
                    <option value="deliverable_ready">Deliverable Ready</option>
                    <option value="payment_recorded">Payment Recorded</option>
                  </select>
                </div>
                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
                  {waMessage}
                </p>
                <button
                  type="button"
                  onClick={copyWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
                >
                  {copiedWa ? (
                    <>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copied WhatsApp Message</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy WhatsApp message</span>
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={handleMarkPaid} className="pt-4 border-t border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>Record Manual Payment</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    required
                    placeholder="UPI / Bank Ref No."
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                  <input
                    type="number"
                    min={100}
                    required
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
                >
                  {savingPayment ? 'Recording...' : 'Mark as Paid'}
                </button>
              </form>
            </div>
          )}

          {/* Charter Summary Card for Business/Student */}
          {user.role !== 'admin' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h2 className="text-base font-bold text-slate-900">Project Charter</h2>
              {charter ? (
                <>
                  <p className="text-sm text-slate-700">{charter.scopeSummary}</p>
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
                    <div>
                      <span className="text-slate-500 block">Total Project Fee</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {formatINR(charter.totalFeeInr)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Student Payout (80%)</span>
                      <span className="font-mono font-bold text-teal-700 tabular-nums">
                        {formatINR(charter.studentPayoutInr)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/projects/${project.id}/charter`)}
                    className="w-full py-2 px-4 text-xs font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73]"
                  >
                    {charter.approvedByBusiness ? 'View Full Charter' : 'Review & Approve Charter'}
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  The coordinator will prepare the written scope, milestones, and fee charter after team matching.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deliverables & Messaging Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deliverables */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900">
            Deliverables ({deliverables.length})
          </h2>

          {(user.role === 'student' || user.role === 'admin') && (
            <form
              onSubmit={handleSubmitDeliverable}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
            >
              <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#0F2D52]" aria-hidden="true" />
                <span>Submit Deliverable (PDF / Excel / PPT or Link)</span>
              </p>
              {delivError && <p className="text-xs text-red-700">{delivError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  required
                  placeholder="Deliverable Title"
                  value={delivTitle}
                  onChange={(e) => setDelivTitle(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <select
                  aria-label="Deliverable file type"
                  value={delivType}
                  onChange={(e) => setDelivType(e.target.value as DeliverableFileType)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="PDF">PDF</option>
                  <option value="Excel">Excel</option>
                  <option value="PPT">PPT</option>
                  <option value="Link">External Link</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="url"
                  placeholder="Paste Google Drive / Sheet / Power BI URL"
                  value={delivUrl}
                  onChange={(e) => setDelivUrl(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <label className="flex items-center justify-between px-3 py-2 text-xs border border-dashed border-slate-300 rounded-lg bg-white cursor-pointer hover:bg-slate-50">
                  <span className="truncate text-slate-600">
                    {delivFileName || 'Or attach PDF/Excel/PPT file'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.xls,.xlsx,.csv,.ppt,.pptx"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </label>
              </div>
              <textarea
                rows={2}
                placeholder="Summary notes on findings or instructions..."
                value={delivNotes}
                onChange={(e) => setDelivNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              />
              <button
                type="submit"
                disabled={uploadingDeliv}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73]"
              >
                {uploadingDeliv ? 'Submitting...' : 'Submit Deliverable'}
              </button>
            </form>
          )}

          {deliverables.length === 0 ? (
            <p className="text-sm text-slate-500">No deliverables uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {deliverables.map((d) => (
                <div key={d.id} className="border border-slate-200 rounded-lg p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{d.title}</p>
                      <p className="text-xs text-slate-500">
                        {d.fileType} · Submitted by {d.submittedByName} · {d.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {d.fileDataUrl && (
                        <a
                          href={d.fileDataUrl}
                          download={d.fileName || 'deliverable'}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0F2D52] border border-slate-300 rounded hover:bg-slate-50"
                        >
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Download</span>
                        </a>
                      )}
                      {d.externalUrl && (
                        <a
                          href={d.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0F2D52] border border-slate-300 rounded hover:bg-slate-50"
                        >
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Open Link</span>
                        </a>
                      )}
                    </div>
                  </div>
                  {d.notes && <p className="text-xs text-slate-700">{d.notes}</p>}
                  {d.reviewComment && (
                    <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded">
                      <strong>Review note:</strong> {d.reviewComment}
                    </p>
                  )}

                  {(user.role === 'business' || user.role === 'admin') &&
                    d.status === 'Pending Review' && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <input
                          placeholder="Optional approval note or revision instructions..."
                          value={reviewComments[d.id] || ''}
                          onChange={(e) =>
                            setReviewComments({ ...reviewComments, [d.id]: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReviewDeliverable(d.id, 'Approved')}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800"
                          >
                            Approve Deliverable
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewDeliverable(d.id, 'Revision Requested')}
                            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100"
                          >
                            Request Revisions
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Comment Thread */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              Project Thread (Business · Admin · Team)
            </h2>
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {messages.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No messages yet. Coordinate data handover or milestone check-ins here.
                </p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-800">
                        {m.senderName} ({m.senderRole})
                      </span>
                      <span className="font-mono tabular-nums">
                        {new Date(m.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{m.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-slate-100">
            <input
              aria-label="Write a project message"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              disabled={sendingMsg || !messageBody.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73] disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
