import { useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import type { CharterMilestone, User, WorkspaceSnapshot } from '../types/models';
import { calculateCharterFinancials, formatINR } from '../utils/domain';

interface CharterPageProps {
  projectId: string;
  user: User;
  workspace: WorkspaceSnapshot;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export function CharterPage({
  projectId,
  user,
  workspace,
  onRefresh,
  onNavigate,
}: CharterPageProps) {
  const project = workspace.projects.find((p) => p.id === projectId);
  const existing = workspace.charters.find((c) => c.projectId === projectId);

  const [scopeSummary, setScopeSummary] = useState(
    existing?.scopeSummary || (project ? `Structured short-term project for ${project.title}.` : '')
  );
  const [inScopeText, setInScopeText] = useState(
    existing?.inScope.join('\n') ||
      'Analyze business-provided records\nDeliver actionable workbook and summary slides'
  );
  const [outOfScopeText, setOutOfScopeText] = useState(
    existing?.outOfScope.join('\n') || 'Ongoing full-time operations\nRegulated statutory filings'
  );
  const [deliverablesText, setDeliverablesText] = useState(
    existing?.deliverables.join('\n') || 'Excel Analysis Workbook (.xlsx)\nExecutive Summary Deck (.pdf)'
  );
  const [milestones, setMilestones] = useState<CharterMilestone[]>(
    existing?.milestones || [
      { id: 'm1', title: 'Kickoff & data handover', dueDate: '2026-11-22', completed: false },
      { id: 'm2', title: 'Mid-point draft review', dueDate: '2026-11-29', completed: false },
      { id: 'm3', title: 'Final deliverable handover', dueDate: '2026-12-05', completed: false },
    ]
  );
  const [totalFeeInr, setTotalFeeInr] = useState<number>(
    existing?.totalFeeInr || project?.budgetMax || 5000
  );
  const [commissionPct, setCommissionPct] = useState<number>(existing?.commissionPct ?? 20);
  const [businessResp, setBusinessResp] = useState(
    existing?.businessResponsibilities ||
      'Provide required sample data/anonymized sheets on time and review mid-point draft.'
  );
  const [studentResp, setStudentResp] = useState(
    existing?.studentResponsibilities ||
      'Deliver practical, verified work within agreed milestones and uphold strict data confidentiality.'
  );
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!project) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-base font-bold text-slate-900">Project not found</p>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg"
        >
          Go Home
        </button>
      </div>
    );
  }

  const financials = calculateCharterFinancials(totalFeeInr, commissionPct);

  function addMilestone() {
    setMilestones((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, title: '', dueDate: '', completed: false },
    ]);
  }

  function removeMilestone(id: string) {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSaveCharter(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await api.saveCharter(project!.id, {
        scopeSummary,
        inScope: inScopeText.split('\n').map((s) => s.trim()).filter(Boolean),
        outOfScope: outOfScopeText.split('\n').map((s) => s.trim()).filter(Boolean),
        deliverables: deliverablesText.split('\n').map((s) => s.trim()).filter(Boolean),
        milestones: milestones.filter((m) => m.title.trim()),
        totalFeeInr: financials.totalFeeInr,
        commissionPct: financials.commissionPct,
        businessResponsibilities: businessResp,
        studentResponsibilities: studentResp,
      });
      await onRefresh();
      setMessage('Project Charter saved and shared for Business approval.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save charter.');
    } finally {
      setSaving(false);
    }
  }

  async function handleApproveCharter() {
    setApproving(true);
    setError('');
    try {
      await api.approveCharter(project!.id);
      await onRefresh();
      setMessage('Charter approved! Project is now In Progress.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to approve charter.');
    } finally {
      setApproving(false);
    }
  }

  const isAdmin = user.role === 'admin';
  const canBusinessApprove =
    (user.role === 'business' || isAdmin) && existing && !existing.approvedByBusiness;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate(`/projects/${project.id}`)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F2D52]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Project</span>
        </button>

        {existing?.approvedByBusiness && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>Approved by Business</span>
          </span>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-medium text-slate-500">
            Project Charter · {project.businessName}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{project.title}</h1>
        </div>

        {message && (
          <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Financial Breakdown Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div>
            <p className="text-xs text-slate-500">Total Project Fee</p>
            <p className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">
              {formatINR(financials.totalFeeInr)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">
              Platform Commission ({financials.commissionPct}%)
            </p>
            <p className="text-xl font-bold font-mono text-[#0F2D52] tabular-nums mt-0.5">
              {formatINR(financials.commissionAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Student Team Payout</p>
            <p className="text-xl font-bold font-mono text-teal-700 tabular-nums mt-0.5">
              {formatINR(financials.studentPayoutInr)}
            </p>
          </div>
        </div>

        {isAdmin ? (
          <form onSubmit={handleSaveCharter} className="space-y-5">
            <div>
              <label htmlFor="ch-scope" className="block text-xs font-semibold text-slate-700 mb-1">
                Scope Summary
              </label>
              <textarea
                id="ch-scope"
                rows={2}
                required
                value={scopeSummary}
                onChange={(e) => setScopeSummary(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ch-in" className="block text-xs font-semibold text-slate-700 mb-1">
                  In-Scope (one bullet per line)
                </label>
                <textarea
                  id="ch-in"
                  rows={4}
                  value={inScopeText}
                  onChange={(e) => setInScopeText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="ch-out" className="block text-xs font-semibold text-slate-700 mb-1">
                  Out-of-Scope (one bullet per line)
                </label>
                <textarea
                  id="ch-out"
                  rows={4}
                  value={outOfScopeText}
                  onChange={(e) => setOutOfScopeText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ch-del" className="block text-xs font-semibold text-slate-700 mb-1">
                List of Deliverables (one per line)
              </label>
              <textarea
                id="ch-del"
                rows={3}
                required
                value={deliverablesText}
                onChange={(e) => setDeliverablesText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Milestones &amp; Due Dates</span>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F2D52]"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add Milestone</span>
                </button>
              </div>
              <div className="space-y-2">
                {milestones.map((m, idx) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <input
                      placeholder={`Milestone ${idx + 1}`}
                      value={m.title}
                      onChange={(e) =>
                        setMilestones((prev) =>
                          prev.map((item) =>
                            item.id === m.id ? { ...item, title: e.target.value } : item
                          )
                        )
                      }
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <input
                      type="date"
                      value={m.dueDate}
                      onChange={(e) =>
                        setMilestones((prev) =>
                          prev.map((item) =>
                            item.id === m.id ? { ...item, dueDate: e.target.value } : item
                          )
                        )
                      }
                      className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeMilestone(m.id)}
                      className="p-2 text-slate-400 hover:text-red-600"
                      aria-label="Remove milestone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ch-fee" className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Project Fee (INR)
                </label>
                <input
                  id="ch-fee"
                  type="number"
                  min={500}
                  step={500}
                  value={totalFeeInr}
                  onChange={(e) => setTotalFeeInr(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="ch-comm" className="block text-xs font-semibold text-slate-700 mb-1">
                  IndustryBridge Commission (%)
                </label>
                <input
                  id="ch-comm"
                  type="number"
                  min={0}
                  max={100}
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ch-bresp" className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Responsibilities
                </label>
                <textarea
                  id="ch-bresp"
                  rows={2}
                  value={businessResp}
                  onChange={(e) => setBusinessResp(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="ch-sresp" className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Team Responsibilities
                </label>
                <textarea
                  id="ch-sresp"
                  rows={2}
                  value={studentResp}
                  onChange={(e) => setStudentResp(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73]"
              >
                {saving ? 'Saving Charter...' : 'Save Charter'}
              </button>
              {canBusinessApprove && (
                <button
                  type="button"
                  disabled={approving}
                  onClick={handleApproveCharter}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800"
                >
                  {approving ? 'Approving...' : 'Approve Charter'}
                </button>
              )}
            </div>
          </form>
        ) : existing ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Scope Summary</h2>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">{existing.scopeSummary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">In Scope</h3>
                <ul className="mt-2 space-y-1.5 list-disc list-inside text-sm text-slate-700">
                  {existing.inScope.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Out of Scope</h3>
                <ul className="mt-2 space-y-1.5 list-disc list-inside text-sm text-slate-600">
                  {existing.outOfScope.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Deliverables</h3>
              <ul className="mt-2 space-y-1.5 list-disc list-inside text-sm text-slate-700">
                {existing.deliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Milestones</h3>
              <div className="mt-2 border border-slate-200 rounded-lg divide-y divide-slate-100">
                {existing.milestones.map((m) => (
                  <div key={m.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                    <span className="text-slate-800">{m.title}</span>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">{m.dueDate}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-200 text-sm">
              <div>
                <h3 className="font-bold text-slate-900">Business Responsibilities</h3>
                <p className="text-slate-700 mt-1">{existing.businessResponsibilities}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Student Team Responsibilities</h3>
                <p className="text-slate-700 mt-1">{existing.studentResponsibilities}</p>
              </div>
            </div>

            {canBusinessApprove && (
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-600">
                  Work begins immediately once you approve this written scope and fee structure.
                </p>
                <button
                  type="button"
                  disabled={approving}
                  onClick={handleApproveCharter}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 shrink-0"
                >
                  {approving ? 'Approving...' : 'Approve Charter'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            The IndustryBridge coordinator has not published the charter yet.
          </p>
        )}
      </div>
    </div>
  );
}
