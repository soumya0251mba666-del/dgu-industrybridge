import { useState, type FormEvent } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { api } from '../lib/api';
import type {
  AvailabilityStatus,
  LeadSource,
  LeadStage,
  ProjectStatus,
  SkillProficiency,
  WorkspaceSnapshot,
} from '../types/models';
import {
  calculateFinancialSnapshot,
  calculateValidationMetrics,
  filterStudents,
  formatINR,
  LEAD_SOURCES,
  PROJECT_STATUSES,
  STANDARD_SKILLS,
} from '../utils/domain';
import { StatusBadge } from './StatusBadge';

interface AdminDashboardProps {
  workspace: WorkspaceSnapshot;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
}

type AdminTab = 'analytics' | 'projects' | 'students' | 'interviews' | 'leads';

export function AdminDashboard({
  workspace,
  onRefresh,
  onNavigate,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>('analytics');

  // Project filter
  const [projectStatusFilter, setProjectStatusFilter] = useState<ProjectStatus | 'All'>('All');

  // Student Talent filter state (Feature B)
  const [stuSearch, setStuSearch] = useState('');
  const [stuSkill, setStuSkill] = useState('All');
  const [stuProf, setStuProf] = useState<SkillProficiency | 'All'>('All');
  const [stuAvail, setStuAvail] = useState<AvailabilityStatus | 'All'>('All');

  // Editable Financial Snapshot assumptions
  const [assumptions, setAssumptions] = useState(workspace.financialAssumptions);
  const [savingFin, setSavingFin] = useState(false);

  // Add Lead form
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState({
    businessName: '',
    contactName: '',
    phone: '',
    source: 'Direct outreach' as LeadSource,
    stage: 'Contacted' as LeadStage,
    notes: '',
  });

  // Add Customer Discovery Interview form
  const [showIntForm, setShowIntForm] = useState(false);
  const [intForm, setIntForm] = useState({
    businessName: '',
    date: new Date().toISOString().slice(0, 10),
    problemType: '',
    currentWorkaround: '',
    frequency: 'Monthly',
    willingnessToPay: 'Yes' as 'Yes' | 'Maybe' | 'No',
    priceRangeMentioned: '',
    trustConcerns: '',
  });

  const metrics = calculateValidationMetrics({
    businessesCount: workspace.businesses.length,
    projects: workspace.projects,
    charters: workspace.charters,
    feedbacks: workspace.feedbacks,
    leads: workspace.leads,
    interviews: workspace.interviews,
  });

  const financialSnap = calculateFinancialSnapshot(assumptions);

  const filteredProjects =
    projectStatusFilter === 'All'
      ? workspace.projects
      : workspace.projects.filter((p) => p.status === projectStatusFilter);

  const filteredStudents = filterStudents(workspace.students, {
    searchQuery: stuSearch,
    skill: stuSkill,
    proficiency: stuProf,
    availability: stuAvail,
  });

  async function saveAssumptions(e: FormEvent) {
    e.preventDefault();
    setSavingFin(true);
    try {
      await api.updateFinancialAssumptions(assumptions);
      await onRefresh();
    } finally {
      setSavingFin(false);
    }
  }

  async function handleAddLead(e: FormEvent) {
    e.preventDefault();
    await api.createLead(leadForm);
    setLeadForm({
      businessName: '',
      contactName: '',
      phone: '',
      source: 'Direct outreach',
      stage: 'Contacted',
      notes: '',
    });
    setShowLeadForm(false);
    await onRefresh();
  }

  async function handleUpdateLeadStage(id: string, stage: LeadStage) {
    await api.updateLead(id, { stage });
    await onRefresh();
  }

  async function handleAddInterview(e: FormEvent) {
    e.preventDefault();
    await api.createInterview(intForm);
    setIntForm({
      businessName: '',
      date: new Date().toISOString().slice(0, 10),
      problemType: '',
      currentWorkaround: '',
      frequency: 'Monthly',
      willingnessToPay: 'Yes',
      priceRangeMentioned: '',
      trustConcerns: '',
    });
    setShowIntForm(false);
    await onRefresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Admin Command Center
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manual matching, 30-day validation experiment metrics, unit economics, and customer discovery log.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-200/70 rounded-lg w-fit" role="tablist">
        {[
          { id: 'analytics', label: '30-Day Analytics & Financials' },
          { id: 'projects', label: `Projects & Matching (${workspace.projects.length})` },
          { id: 'students', label: `Student Talent (${workspace.students.length})` },
          { id: 'interviews', label: `Discovery Log (${workspace.interviews.length})` },
          { id: 'leads', label: `Leads & Bookings (${workspace.leads.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id as AdminTab)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              tab === t.id
                ? 'bg-white text-[#0F2D52] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ANALYTICS & FINANCIAL SNAPSHOT */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* 30-Day Experiment KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-500">Businesses Registered / Leads</p>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {metrics.businessesRegistered} / {metrics.totalLeads}
              </p>
              <p className="text-xs text-slate-500 mt-1 tabular-nums">
                {metrics.qualifiedLeads} qualified · {metrics.proposalsSent} proposals
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-500">Paid Pilots Secured (Target: 2)</p>
              <p className="text-2xl font-bold font-mono text-teal-700 mt-1 tabular-nums">
                {metrics.paidPilotsSecured} / 2
              </p>
              <p className="text-xs text-slate-500 mt-1 tabular-nums">
                {metrics.pilotsCompleted} pilot{metrics.pilotsCompleted === 1 ? '' : 's'} delivered
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-500">Total Value &amp; Commission</p>
              <p className="text-2xl font-bold font-mono text-[#0F2D52] mt-1 tabular-nums">
                {formatINR(metrics.totalProjectValue)}
              </p>
              <p className="text-xs text-slate-500 mt-1 tabular-nums">
                Comm: {formatINR(metrics.commissionEarned)} · Payouts: {formatINR(metrics.studentPayouts)}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-500">Feedback &amp; NPS</p>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {metrics.avgUsefulness !== null ? `${metrics.avgUsefulness}/5` : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1 tabular-nums">
                On-time: {metrics.onTimePct !== null ? `${metrics.onTimePct}%` : '—'} · Repeat:{' '}
                {metrics.repeatInterestPct !== null ? `${metrics.repeatInterestPct}%` : '—'} · NPS:{' '}
                {metrics.avgNps !== null ? metrics.avgNps : '—'}
              </p>
            </div>
          </div>

          {/* Charts Row: Funnel + Lead Source Tracking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-base font-bold text-slate-900">
                Project Conversion Funnel
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted → Matched → Charter Approved → Delivered → Paid
              </p>
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.funnel} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Projects"
                      fill="#0F2D52"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-base font-bold text-slate-900">
                Lead Source Performance
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Outreach channels vs paid pilot conversions
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 font-semibold">Channel</th>
                      <th className="py-2 font-semibold text-right">Leads</th>
                      <th className="py-2 font-semibold text-right">Qualified</th>
                      <th className="py-2 font-semibold text-right">Paid Pilots</th>
                      <th className="py-2 font-semibold text-right">Conv %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums font-mono">
                    {metrics.leadSourceBreakdown.map((row) => (
                      <tr key={row.source}>
                        <td className="py-2.5 font-sans font-medium text-slate-800">{row.source}</td>
                        <td className="py-2.5 text-right text-slate-700">{row.leads}</td>
                        <td className="py-2.5 text-right text-slate-700">{row.qualified}</td>
                        <td className="py-2.5 text-right font-semibold text-teal-700">
                          {row.conversions}
                        </td>
                        <td className="py-2.5 text-right text-slate-700">{row.conversionRatePct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Financial Snapshot (Editable Assumptions) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Financial Snapshot &amp; Break-Even Calculator
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Edit unit-economics assumptions from your Venture Plan to test monthly break-even.
                </p>
              </div>
            </div>

            <form onSubmit={saveAssumptions} className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fin-avg" className="block text-xs font-semibold text-slate-700 mb-1">
                    Avg Project Value (INR)
                  </label>
                  <input
                    id="fin-avg"
                    type="number"
                    min={0}
                    step={500}
                    value={assumptions.avgProjectValue}
                    onChange={(e) =>
                      setAssumptions({ ...assumptions, avgProjectValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="fin-comm" className="block text-xs font-semibold text-slate-700 mb-1">
                    Commission (%)
                  </label>
                  <input
                    id="fin-comm"
                    type="number"
                    min={0}
                    max={100}
                    value={assumptions.commissionPct}
                    onChange={(e) =>
                      setAssumptions({ ...assumptions, commissionPct: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="fin-var" className="block text-xs font-semibold text-slate-700 mb-1">
                    Variable Cost / Project (INR)
                  </label>
                  <input
                    id="fin-var"
                    type="number"
                    min={0}
                    step={50}
                    value={assumptions.variableCostPerProject}
                    onChange={(e) =>
                      setAssumptions({
                        ...assumptions,
                        variableCostPerProject: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="fin-fix" className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Fixed Cost (INR)
                  </label>
                  <input
                    id="fin-fix"
                    type="number"
                    min={0}
                    step={500}
                    value={assumptions.monthlyFixedCost}
                    onChange={(e) =>
                      setAssumptions({ ...assumptions, monthlyFixedCost: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
                <div className="sm:col-span-2 flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <label htmlFor="fin-proj" className="block text-xs font-semibold text-slate-700 mb-1">
                      Projected Projects / Month
                    </label>
                    <input
                      id="fin-proj"
                      type="number"
                      min={0}
                      value={assumptions.projectedMonthlyProjects}
                      onChange={(e) =>
                        setAssumptions({
                          ...assumptions,
                          projectedMonthlyProjects: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg tabular-nums"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingFin}
                    className="px-4 py-2 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73] whitespace-nowrap"
                  >
                    {savingFin ? 'Saving...' : 'Save Assumptions'}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Revenue / Project</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatINR(financialSnap.revenuePerProject)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Contribution / Project</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatINR(financialSnap.contributionPerProject)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Monthly Revenue</span>
                  <span className="font-mono font-semibold text-[#0F2D52] tabular-nums">
                    {formatINR(financialSnap.monthlyRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-medium">Operating Surplus / Deficit</span>
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      financialSnap.monthlyOperatingSurplus >= 0
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {formatINR(financialSnap.monthlyOperatingSurplus)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-medium">Break-Even Volume</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {financialSnap.breakEvenProjectsPerMonth !== null
                      ? `${financialSnap.breakEvenProjectsPerMonth} projects/month`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: PROJECTS & MANUAL MATCHING */}
      {tab === 'projects' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">All Projects Pipeline</h2>
            <select
              aria-label="Filter projects by status"
              value={projectStatusFilter}
              onChange={(e) => setProjectStatusFilter(e.target.value as ProjectStatus | 'All')}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">All Statuses</option>
              {PROJECT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{p.businessName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{p.location}</span>
                    <span aria-hidden="true">·</span>
                    <span>{p.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(p.budgetMin)}–{formatINR(p.budgetMax)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                  <p className="text-xs text-slate-500">
                    Required: {p.requiredSkills.join(', ')} · Assigned: {p.assignedStudentIds.length} student(s)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <StatusBadge status={p.status} />
                  <button
                    type="button"
                    onClick={() => onNavigate(`/projects/${p.id}`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73]"
                  >
                    <span>{p.assignedStudentIds.length === 0 ? 'Match Team' : 'Manage'}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT TALENT DATABASE */}
      {tab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
              <input
                aria-label="Search students"
                value={stuSearch}
                onChange={(e) => setStuSearch(e.target.value)}
                placeholder="Search name, enrollment, skills..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <select
              aria-label="Filter by skill"
              value={stuSkill}
              onChange={(e) => setStuSkill(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
            >
              <option value="All">All Skills</option>
              {STANDARD_SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by proficiency"
              value={stuProf}
              onChange={(e) => setStuProf(e.target.value as SkillProficiency | 'All')}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
            >
              <option value="All">Any Proficiency</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <select
              aria-label="Filter by availability"
              value={stuAvail}
              onChange={(e) => setStuAvail(e.target.value as AvailabilityStatus | 'All')}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
            >
              <option value="All">All Availability</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((stu) => (
              <div key={stu.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{stu.name}</h3>
                    <p className="text-xs text-slate-500">
                      {stu.enrollmentNumber} · {stu.programBatch}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      stu.availabilityStatus === 'Available' ? 'text-teal-700' : 'text-amber-700'
                    }`}
                  >
                    {stu.availabilityStatus} · {stu.weeklyHours}h/wk
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  {stu.skills.map((s) => `${s.name} (${s.proficiency})`).join(' · ')}
                </p>
                {stu.pastProjects && <p className="text-xs text-slate-600">{stu.pastProjects}</p>}
                <p className="text-xs text-slate-500 font-mono">
                  {stu.email} {stu.phone ? `· ${stu.phone}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMER DISCOVERY LOG */}
      {tab === 'interviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Customer Discovery Interviews</h2>
              <p className="text-xs text-slate-500">
                Track Selaqui &amp; Dehradun SME conversations, workarounds, pricing willingness, and trust concerns.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIntForm(!showIntForm)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F2D52] rounded-lg"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Log Interview</span>
            </button>
          </div>

          {showIntForm && (
            <form
              onSubmit={handleAddInterview}
              className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              <input
                required
                placeholder="Business Name"
                value={intForm.businessName}
                onChange={(e) => setIntForm({ ...intForm, businessName: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="date"
                value={intForm.date}
                onChange={(e) => setIntForm({ ...intForm, date: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                required
                placeholder="Problem Type"
                value={intForm.problemType}
                onChange={(e) => setIntForm({ ...intForm, problemType: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                placeholder="Current Workaround"
                value={intForm.currentWorkaround}
                onChange={(e) => setIntForm({ ...intForm, currentWorkaround: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                placeholder="Frequency (e.g. Monthly)"
                value={intForm.frequency}
                onChange={(e) => setIntForm({ ...intForm, frequency: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <select
                aria-label="Willingness to pay"
                value={intForm.willingnessToPay}
                onChange={(e) =>
                  setIntForm({
                    ...intForm,
                    willingnessToPay: e.target.value as 'Yes' | 'Maybe' | 'No',
                  })
                }
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                <option value="Yes">Willing to Pay: Yes</option>
                <option value="Maybe">Willing to Pay: Maybe</option>
                <option value="No">Willing to Pay: No</option>
              </select>
              <input
                placeholder="Price Range Mentioned (INR)"
                value={intForm.priceRangeMentioned}
                onChange={(e) => setIntForm({ ...intForm, priceRangeMentioned: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                placeholder="Trust Concerns"
                value={intForm.trustConcerns}
                onChange={(e) => setIntForm({ ...intForm, trustConcerns: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIntForm(false)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0F2D52] rounded-lg"
                >
                  Save Interview
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="p-3 font-semibold">Business</th>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Problem Type</th>
                  <th className="p-3 font-semibold">Current Workaround</th>
                  <th className="p-3 font-semibold">Freq.</th>
                  <th className="p-3 font-semibold">WTP</th>
                  <th className="p-3 font-semibold">Price Range</th>
                  <th className="p-3 font-semibold">Trust Concerns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workspace.interviews.map((iv) => (
                  <tr key={iv.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-semibold text-slate-900">{iv.businessName}</td>
                    <td className="p-3 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                      {iv.date}
                    </td>
                    <td className="p-3 text-slate-700">{iv.problemType}</td>
                    <td className="p-3 text-slate-600">{iv.currentWorkaround}</td>
                    <td className="p-3 text-slate-600">{iv.frequency}</td>
                    <td className="p-3 font-semibold text-slate-800">{iv.willingnessToPay}</td>
                    <td className="p-3 font-mono text-slate-700 tabular-nums">
                      {iv.priceRangeMentioned}
                    </td>
                    <td className="p-3 text-slate-600">{iv.trustConcerns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: LEADS & BOOKINGS */}
      {tab === 'leads' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Lead Source Tracker</h2>
            <button
              type="button"
              onClick={() => setShowLeadForm(!showLeadForm)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F2D52] rounded-lg"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add Lead</span>
            </button>
          </div>

          {showLeadForm && (
            <form
              onSubmit={handleAddLead}
              className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              <input
                required
                placeholder="Business Name"
                value={leadForm.businessName}
                onChange={(e) => setLeadForm({ ...leadForm, businessName: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                required
                placeholder="Contact Name"
                value={leadForm.contactName}
                onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                placeholder="Phone / WhatsApp"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <select
                aria-label="Lead source"
                value={leadForm.source}
                onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value as LeadSource })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                aria-label="Lead stage"
                value={leadForm.stage}
                onChange={(e) => setLeadForm({ ...leadForm, stage: e.target.value as LeadStage })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {['Contacted', 'Qualified', 'Proposal Sent', 'Paid Pilot', 'Completed'].map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <input
                placeholder="Notes"
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLeadForm(false)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0F2D52] rounded-lg"
                >
                  Save Lead
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="p-3 font-semibold">Business</th>
                  <th className="p-3 font-semibold">Contact</th>
                  <th className="p-3 font-semibold">Source</th>
                  <th className="p-3 font-semibold">Stage</th>
                  <th className="p-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workspace.leads.map((l) => (
                  <tr key={l.id}>
                    <td className="p-3 font-semibold text-slate-900">{l.businessName}</td>
                    <td className="p-3 text-slate-700">
                      {l.contactName} {l.phone ? `· ${l.phone}` : ''}
                    </td>
                    <td className="p-3 text-slate-600">{l.source}</td>
                    <td className="p-3">
                      <select
                        aria-label={`Stage for ${l.businessName}`}
                        value={l.stage}
                        onChange={(e) => handleUpdateLeadStage(l.id, e.target.value as LeadStage)}
                        className="px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                      >
                        {['Contacted', 'Qualified', 'Proposal Sent', 'Paid Pilot', 'Completed'].map(
                          (st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          )
                        )}
                      </select>
                    </td>
                    <td className="p-3 text-slate-600">{l.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {workspace.discoveryBookings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                15-Minute Discussion Requests ({workspace.discoveryBookings.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workspace.discoveryBookings.map((b) => (
                  <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-sm font-bold text-slate-900">{b.businessName}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {b.contactName} · {b.phone} · {b.email}
                    </p>
                    <p className="text-xs font-medium text-teal-700 mt-1">{b.preferredSlot}</p>
                    <p className="text-xs text-slate-600 mt-1">{b.topic}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
