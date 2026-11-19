import { useState } from 'react';
import { ArrowRight, FileCheck2, MessageSquareHeart, Plus } from 'lucide-react';
import type { User, WorkspaceSnapshot } from '../types/models';
import { formatINR } from '../utils/domain';
import { BusinessProblemForm } from './BusinessProblemForm';
import { ProjectStepper, StatusBadge } from './StatusBadge';

interface BusinessDashboardProps {
  user: User;
  workspace: WorkspaceSnapshot;
  defaultOpenNew?: boolean;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export function BusinessDashboard({
  user,
  workspace,
  defaultOpenNew = false,
  onRefresh,
  onNavigate,
}: BusinessDashboardProps) {
  const [showNewForm, setShowNewForm] = useState(defaultOpenNew);

  const myBusiness = workspace.businesses[0];
  const projects = workspace.projects;
  const chartersByProject = new Map(workspace.charters.map((c) => [c.projectId, c]));
  const deliverablesByProject = new Map<string, typeof workspace.deliverables>();
  for (const d of workspace.deliverables) {
    const arr = deliverablesByProject.get(d.projectId) || [];
    arr.push(d);
    deliverablesByProject.set(d.projectId, arr);
  }
  const feedbacksByProject = new Map(workspace.feedbacks.map((f) => [f.projectId, f]));

  const pendingCharters = projects.filter((p) => {
    const c = chartersByProject.get(p.id);
    return c && !c.approvedByBusiness;
  }).length;

  const pendingDeliverables = workspace.deliverables.filter(
    (d) => d.status === 'Pending Review'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {myBusiness ? myBusiness.businessName : 'Business Workspace'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Post business problems, approve written charters, review student deliverables, and share feedback.
          </p>
        </div>
        {!showNewForm && (
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Post a Problem</span>
          </button>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Submitted Projects</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {projects.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Charters Awaiting Approval</p>
          <p className="text-2xl font-bold font-mono text-[#0F2D52] mt-1 tabular-nums">
            {pendingCharters}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Deliverables to Review</p>
          <p className="text-2xl font-bold font-mono text-teal-700 mt-1 tabular-nums">
            {pendingDeliverables}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Completed / Paid</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {projects.filter((p) => ['Paid', 'Closed', 'Feedback Collected'].includes(p.status)).length}
          </p>
        </div>
      </div>

      {/* Problem Submission Drawer / Panel */}
      {showNewForm && (
        <BusinessProblemForm
          defaultBusiness={myBusiness}
          userEmail={user.email}
          userName={user.name}
          onCancel={() => setShowNewForm(false)}
          onSuccess={async () => {
            await onRefresh();
            setShowNewForm(false);
          }}
        />
      )}

      {/* Projects List */}
      <section aria-labelledby="biz-projects-heading" className="space-y-4">
        <h2 id="biz-projects-heading" className="text-lg font-bold text-slate-900">
          Your Projects
        </h2>

        {projects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-base font-semibold text-slate-900">No business problems posted yet</p>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              Submit your first short-term project (market research, Excel dashboard, or sales study) to get matched with a DGU MBA team.
            </p>
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Post Your First Problem</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((p) => {
              const charter = chartersByProject.get(p.id);
              const delivs = deliverablesByProject.get(p.id) || [];
              const fb = feedbacksByProject.get(p.id);
              const hasPendingDeliverable = delivs.some((d) => d.status === 'Pending Review');

              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                        <span>{p.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.location}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.timeline}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatINR(p.budgetMin)} – {formatINR(p.budgetMax)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{p.title}</h3>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.description}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  <ProjectStepper status={p.status} />

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      {p.assignedStudentIds.length > 0 ? (
                        <span>
                          Matched team: {p.assignedStudentIds.length} DGU student
                          {p.assignedStudentIds.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span>Awaiting coordinator matching</span>
                      )}
                      {hasPendingDeliverable && (
                        <span className="ml-2 font-semibold text-teal-700">
                          · Deliverable awaiting your review
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {charter && (
                        <button
                          type="button"
                          onClick={() => onNavigate(`/projects/${p.id}/charter`)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap ${
                            !charter.approvedByBusiness
                              ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{charter.approvedByBusiness ? 'View Charter' : 'Review & Approve Charter'}</span>
                        </button>
                      )}
                      {['Delivered', 'Feedback Collected', 'Paid', 'Closed'].includes(p.status) && !fb && (
                        <button
                          type="button"
                          onClick={() => onNavigate(`/projects/${p.id}/feedback`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 whitespace-nowrap"
                        >
                          <MessageSquareHeart className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Give Feedback</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onNavigate(`/projects/${p.id}`)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#0F2D52] text-white hover:bg-[#173f73] whitespace-nowrap"
                      >
                        <span>Open Project</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
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
