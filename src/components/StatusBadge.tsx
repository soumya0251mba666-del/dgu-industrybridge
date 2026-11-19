import {
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  IndianRupee,
  Lock,
  MessageSquareHeart,
  PlayCircle,
  Users,
} from 'lucide-react';
import type { ProjectStatus } from '../types/models';
import { getStatusIndex, PROJECT_STATUSES } from '../utils/domain';

const STATUS_META: Record<
  ProjectStatus,
  { colorClass: string; Icon: typeof Clock }
> = {
  Submitted: {
    colorClass: 'text-slate-700 bg-slate-100 border-slate-200',
    Icon: FileText,
  },
  'Under Review': {
    colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
    Icon: Clock,
  },
  Matched: {
    colorClass: 'text-blue-800 bg-blue-50 border-blue-200',
    Icon: Users,
  },
  'Charter Approved': {
    colorClass: 'text-indigo-800 bg-indigo-50 border-indigo-200',
    Icon: FileCheck2,
  },
  'In Progress': {
    colorClass: 'text-teal-800 bg-teal-50 border-teal-200',
    Icon: PlayCircle,
  },
  Delivered: {
    colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    Icon: CheckCircle2,
  },
  'Feedback Collected': {
    colorClass: 'text-teal-900 bg-teal-100/70 border-teal-300',
    Icon: MessageSquareHeart,
  },
  Paid: {
    colorClass: 'text-emerald-900 bg-emerald-100 border-emerald-300',
    Icon: IndianRupee,
  },
  Closed: {
    colorClass: 'text-slate-700 bg-slate-200/70 border-slate-300',
    Icon: Lock,
  },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const meta = STATUS_META[status] || STATUS_META.Submitted;
  const Icon = meta.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 ${meta.colorClass}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}

export function ProjectStepper({ status }: { status: ProjectStatus }) {
  const currentIdx = getStatusIndex(status);

  return (
    <div className="w-full overflow-x-auto pb-2" aria-label={`Project progress: ${status}`}>
      <ol className="flex items-center min-w-[680px] gap-1">
        {PROJECT_STATUSES.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <li key={step} className="flex-1 flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <div
                  className={`h-2 flex-1 rounded-sm transition-colors ${
                    isCompleted
                      ? 'bg-teal-600'
                      : isCurrent
                      ? 'bg-[#0F2D52]'
                      : 'bg-slate-200'
                  }`}
                />
              </div>
              <span
                className={`text-[11px] leading-tight truncate ${
                  isCurrent
                    ? 'font-semibold text-[#0F2D52]'
                    : isCompleted
                    ? 'font-medium text-teal-700'
                    : 'text-slate-400'
                }`}
                title={step}
              >
                {idx + 1}. {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
