import type {
  AvailabilityStatus,
  CustomerInterview,
  FinancialAssumptions,
  Lead,
  LeadSource,
  Project,
  ProjectCharter,
  ProjectFeedback,
  ProjectStatus,
  SkillProficiency,
  StudentProfile,
} from '../types/models';

export const PROJECT_STATUSES: ProjectStatus[] = [
  'Submitted',
  'Under Review',
  'Matched',
  'Charter Approved',
  'In Progress',
  'Delivered',
  'Feedback Collected',
  'Paid',
  'Closed',
];

export const PROJECT_CATEGORIES = [
  'Market Research',
  'Customer Analysis',
  'Competitor Analysis',
  'Sales Analysis',
  'Financial Analysis',
  'Digital Marketing',
  'Excel/Power BI Dashboard',
  'Operations/Process Analysis',
  'Other',
] as const;

export const STANDARD_SKILLS = [
  'Finance',
  'Marketing',
  'Analytics',
  'Excel',
  'Power BI',
  'Market Research',
  'Customer Analysis',
  'Competitor Analysis',
  'Sales Analysis',
  'Financial Analysis',
  'Digital Marketing',
  'Operations',
  'Process Analysis',
  'HR',
] as const;

export const LEAD_SOURCES: LeadSource[] = [
  'Direct outreach',
  'Faculty-alumni referral',
  'LinkedIn',
  'Local network-WhatsApp',
];

export const DEFAULT_FINANCIAL_ASSUMPTIONS: FinancialAssumptions = {
  avgProjectValue: 5000,
  commissionPct: 20,
  variableCostPerProject: 250,
  monthlyFixedCost: 15000,
  projectedMonthlyProjects: 10,
};

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safe);
}

export function validateStudentEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  return parts[0].length > 0 && parts[1] === 'dgu.ac.in';
}

export function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getStatusIndex(status: ProjectStatus): number {
  return PROJECT_STATUSES.indexOf(status);
}

export function getNextStatus(status: ProjectStatus): ProjectStatus | null {
  const idx = getStatusIndex(status);
  if (idx === -1 || idx >= PROJECT_STATUSES.length - 1) return null;
  return PROJECT_STATUSES[idx + 1];
}

export interface RankedStudent {
  student: StudentProfile;
  overlapCount: number;
  matchedSkills: string[];
  proficiencyWeight: number;
}

const PROFICIENCY_SCORE: Record<SkillProficiency, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
};

export function rankStudentsBySkillOverlap(
  requiredSkills: string[],
  students: StudentProfile[]
): RankedStudent[] {
  const normalizedRequired = requiredSkills.map((s) => s.trim().toLowerCase()).filter(Boolean);

  return students
    .map((student) => {
      const matchedSkills: string[] = [];
      let proficiencyWeight = 0;

      for (const req of normalizedRequired) {
        const found = student.skills.find(
          (sk) =>
            sk.name.trim().toLowerCase() === req ||
            sk.name.trim().toLowerCase().includes(req) ||
            req.includes(sk.name.trim().toLowerCase())
        );
        if (found) {
          matchedSkills.push(found.name);
          proficiencyWeight += PROFICIENCY_SCORE[found.proficiency] ?? 1;
        }
      }

      return {
        student,
        overlapCount: matchedSkills.length,
        matchedSkills,
        proficiencyWeight,
      };
    })
    .sort((a, b) => {
      if (b.overlapCount !== a.overlapCount) return b.overlapCount - a.overlapCount;
      if (a.student.availabilityStatus !== b.student.availabilityStatus) {
        return a.student.availabilityStatus === 'Available' ? -1 : 1;
      }
      if (b.proficiencyWeight !== a.proficiencyWeight) {
        return b.proficiencyWeight - a.proficiencyWeight;
      }
      return b.student.weeklyHours - a.student.weeklyHours;
    });
}

export interface StudentFilterCriteria {
  searchQuery?: string;
  skill?: string;
  proficiency?: SkillProficiency | 'All';
  availability?: AvailabilityStatus | 'All';
}

export function filterStudents(
  students: StudentProfile[],
  criteria: StudentFilterCriteria
): StudentProfile[] {
  const q = (criteria.searchQuery || '').trim().toLowerCase();
  const skillFilter = (criteria.skill || 'All').trim().toLowerCase();
  const profFilter = criteria.proficiency || 'All';
  const availFilter = criteria.availability || 'All';

  return students.filter((student) => {
    if (availFilter !== 'All' && student.availabilityStatus !== availFilter) {
      return false;
    }
    if (q) {
      const hay = [
        student.name,
        student.enrollmentNumber,
        student.programBatch,
        student.pastProjects,
        ...student.skills.map((s) => s.name),
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (skillFilter !== 'all' && skillFilter !== '') {
      const matchingSkill = student.skills.find(
        (s) => s.name.trim().toLowerCase() === skillFilter
      );
      if (!matchingSkill) return false;
      if (profFilter !== 'All' && matchingSkill.proficiency !== profFilter) {
        return false;
      }
    } else if (profFilter !== 'All') {
      const hasProf = student.skills.some((s) => s.proficiency === profFilter);
      if (!hasProf) return false;
    }
    return true;
  });
}

export function calculateCharterFinancials(totalFeeInr: number, commissionPct: number) {
  const safeFee = Math.max(0, Number(totalFeeInr) || 0);
  const safePct = Math.min(100, Math.max(0, Number(commissionPct) || 0));
  const commissionAmount = Math.round((safeFee * safePct) / 100);
  const studentPayoutInr = Math.max(0, safeFee - commissionAmount);
  return {
    totalFeeInr: safeFee,
    commissionPct: safePct,
    commissionAmount,
    studentPayoutInr,
  };
}

export interface FinancialSnapshotOutput {
  revenuePerProject: number;
  contributionPerProject: number;
  monthlyRevenue: number;
  monthlyVariableCost: number;
  monthlyOperatingSurplus: number;
  breakEvenProjectsPerMonth: number | null;
}

export function calculateFinancialSnapshot(
  assumptions: FinancialAssumptions
): FinancialSnapshotOutput {
  const avgVal = Math.max(0, Number(assumptions.avgProjectValue) || 0);
  const commPct = Math.min(100, Math.max(0, Number(assumptions.commissionPct) || 0));
  const varCost = Math.max(0, Number(assumptions.variableCostPerProject) || 0);
  const fixedCost = Math.max(0, Number(assumptions.monthlyFixedCost) || 0);
  const projects = Math.max(0, Number(assumptions.projectedMonthlyProjects) || 0);

  const revenuePerProject = Math.round((avgVal * commPct) / 100);
  const contributionPerProject = revenuePerProject - varCost;
  const monthlyRevenue = revenuePerProject * projects;
  const monthlyVariableCost = varCost * projects;
  const monthlyOperatingSurplus = contributionPerProject * projects - fixedCost;
  const breakEvenProjectsPerMonth =
    contributionPerProject > 0 ? Math.ceil(fixedCost / contributionPerProject) : null;

  return {
    revenuePerProject,
    contributionPerProject,
    monthlyRevenue,
    monthlyVariableCost,
    monthlyOperatingSurplus,
    breakEvenProjectsPerMonth,
  };
}

export interface ValidationMetrics {
  businessesRegistered: number;
  totalLeads: number;
  qualifiedLeads: number;
  proposalsSent: number;
  paidPilotsSecured: number;
  pilotsCompleted: number;
  totalProjectValue: number;
  commissionEarned: number;
  studentPayouts: number;
  avgUsefulness: number | null;
  onTimePct: number | null;
  repeatInterestPct: number | null;
  avgNps: number | null;
  funnel: { stage: string; count: number }[];
  leadSourceBreakdown: {
    source: LeadSource;
    leads: number;
    qualified: number;
    conversions: number;
    conversionRatePct: number;
  }[];
}

export function calculateValidationMetrics(params: {
  businessesCount: number;
  projects: Project[];
  charters: ProjectCharter[];
  feedbacks: ProjectFeedback[];
  leads: Lead[];
  interviews?: CustomerInterview[];
}): ValidationMetrics {
  const { businessesCount, projects, charters, feedbacks, leads } = params;

  const qualifiedLeads = leads.filter((l) =>
    ['Qualified', 'Proposal Sent', 'Paid Pilot', 'Completed'].includes(l.stage)
  ).length;
  const proposalsSent = leads.filter((l) =>
    ['Proposal Sent', 'Paid Pilot', 'Completed'].includes(l.stage)
  ).length;

  const charterByProject = new Map(charters.map((c) => [c.projectId, c]));

  let totalProjectValue = 0;
  let commissionEarned = 0;
  let studentPayouts = 0;

  const paidStatuses: ProjectStatus[] = ['Paid', 'Closed'];
  const completedStatuses: ProjectStatus[] = ['Delivered', 'Feedback Collected', 'Paid', 'Closed'];
  const approvedOrLater: ProjectStatus[] = [
    'Charter Approved',
    'In Progress',
    'Delivered',
    'Feedback Collected',
    'Paid',
    'Closed',
  ];
  const matchedOrLater: ProjectStatus[] = ['Matched', ...approvedOrLater];

  let paidPilotsSecured = 0;
  let pilotsCompleted = 0;

  for (const p of projects) {
    const charter = charterByProject.get(p.id);
    if (paidStatuses.includes(p.status)) {
      paidPilotsSecured += 1;
      const fee = p.paidAmount ?? charter?.totalFeeInr ?? 0;
      const pct = charter?.commissionPct ?? 20;
      const fin = calculateCharterFinancials(fee, pct);
      totalProjectValue += fin.totalFeeInr;
      commissionEarned += fin.commissionAmount;
      studentPayouts += fin.studentPayoutInr;
    } else if (charter && charter.approvedByBusiness) {
      // Count committed charter value separately? No, prompt lists total project value, commission earned, student payouts.
      // Let's sum committed/approved charters OR paid? Paid + Charter Approved projects represent active financial pipeline,
      // Wait: if we count all Charter Approved+ projects for total project value vs Paid, let's check:
      // Actually in pilot tracking, if Paid is 1 and Delivered is 1, let's include Paid projects in realized commission/payouts
      // and include Charter-approved+ in committed value, OR keep them aligned cleanly. Let's check:
      // In our seed data we have 1 Paid (₹5,000) and 1 Delivered (₹6,000) and 1 In Progress (₹4,500).
      // Counting Charter-Approved+ for committed project value and Paid for realized commission? Better:
      // Let's count approved charters for Total Project Value, Commission, Payouts? Or Paid only?
      // Wait: if someone marks a project Paid, it updates immediately. Let's use Paid projects for realized commissionEarned & studentPayouts, and if Paid count is 0, show ₹0. Wait: in seed data let's make sure 2 projects are Paid or Delivered so KPIs look clear!
      // Actually prompt says: "paid pilots secured (target: 2), pilots completed", "Total project value, commission earned, student payouts".
      // If a project has status 'Charter Approved' or later and has a paidAmount or approved charter, let's count 'Paid' & 'Closed' in realized commission/payouts AND let's seed 1 Paid + 1 Delivered + 1 Charter Approved/In Progress + 1 Submitted (total 4 projects at different statuses!).
    }
    if (completedStatuses.includes(p.status)) {
      pilotsCompleted += 1;
    }
  }

  const avgUsefulness =
    feedbacks.length > 0
      ? Number(
          (feedbacks.reduce((sum, f) => sum + f.usefulness, 0) / feedbacks.length).toFixed(1)
        )
      : null;

  const onTimePct =
    feedbacks.length > 0
      ? Math.round((feedbacks.filter((f) => f.onTime).length / feedbacks.length) * 100)
      : null;

  const repeatInterestPct =
    feedbacks.length > 0
      ? Math.round((feedbacks.filter((f) => f.wouldPayAgain).length / feedbacks.length) * 100)
      : null;

  const avgNps =
    feedbacks.length > 0
      ? Number((feedbacks.reduce((sum, f) => sum + f.nps, 0) / feedbacks.length).toFixed(1))
      : null;

  const funnel = [
    { stage: 'Submitted', count: projects.length },
    {
      stage: 'Matched',
      count: projects.filter((p) => matchedOrLater.includes(p.status)).length,
    },
    {
      stage: 'Charter Approved',
      count: projects.filter((p) => approvedOrLater.includes(p.status)).length,
    },
    {
      stage: 'Delivered',
      count: projects.filter((p) => completedStatuses.includes(p.status)).length,
    },
    {
      stage: 'Paid',
      count: projects.filter((p) => paidStatuses.includes(p.status)).length,
    },
  ];

  const leadSourceBreakdown = LEAD_SOURCES.map((source) => {
    const sourceLeads = leads.filter((l) => l.source === source);
    const qualified = sourceLeads.filter((l) =>
      ['Qualified', 'Proposal Sent', 'Paid Pilot', 'Completed'].includes(l.stage)
    ).length;
    const conversions = sourceLeads.filter((l) =>
      ['Paid Pilot', 'Completed'].includes(l.stage)
    ).length;
    const conversionRatePct =
      sourceLeads.length > 0 ? Math.round((conversions / sourceLeads.length) * 100) : 0;
    return {
      source,
      leads: sourceLeads.length,
      qualified,
      conversions,
      conversionRatePct,
    };
  });

  return {
    businessesRegistered: businessesCount,
    totalLeads: leads.length,
    qualifiedLeads,
    proposalsSent,
    paidPilotsSecured,
    pilotsCompleted,
    totalProjectValue,
    commissionEarned,
    studentPayouts,
    avgUsefulness,
    onTimePct,
    repeatInterestPct,
    avgNps,
    funnel,
    leadSourceBreakdown,
  };
}

export interface ProblemSubmissionInput {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  location: string;
  industry: string;
  title: string;
  description: string;
  category: string;
  expectedOutcome: string;
  requiredSkills: string[];
  timeline: string;
  budgetMin: number;
  budgetMax: number;
}

export function validateProblemSubmission(
  input: ProblemSubmissionInput
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.businessName.trim()) errors.businessName = 'Business name is required.';
  if (!input.contactName.trim()) errors.contactName = 'Owner or contact name is required.';
  if (!input.phone.trim() || input.phone.trim().length < 8) {
    errors.phone = 'Enter a valid phone or WhatsApp number.';
  }
  if (!validateEmailFormat(input.email)) errors.email = 'Enter a valid email address.';
  if (!input.industry.trim()) errors.industry = 'Industry is required.';
  if (!input.title.trim() || input.title.trim().length < 5) {
    errors.title = 'Enter a clear problem title (at least 5 characters).';
  }
  if (!input.description.trim() || input.description.trim().length < 15) {
    errors.description = 'Describe the business problem (at least 15 characters).';
  }
  if (!input.expectedOutcome.trim()) {
    errors.expectedOutcome = 'Specify the expected outcome.';
  }
  if (!input.requiredSkills || input.requiredSkills.length === 0) {
    errors.requiredSkills = 'Select at least one required skill.';
  }
  if (input.budgetMin <= 0 || input.budgetMax < input.budgetMin) {
    errors.budget = 'Enter a valid INR budget range.';
  }
  return errors;
}

export type WhatsAppTemplateType =
  | 'team_assigned'
  | 'charter_approval'
  | 'deliverable_ready'
  | 'payment_recorded';

export function generateWhatsAppMessage(
  type: WhatsAppTemplateType,
  ctx: {
    recipientName: string;
    businessName: string;
    projectTitle: string;
    extra?: string;
  }
): string {
  switch (type) {
    case 'team_assigned':
      return `Hi ${ctx.recipientName}, you have been matched to the DGU IndustryBridge project "${ctx.projectTitle}" for ${ctx.businessName}. Please log in to IndustryBridge to review the brief and Accept/Decline within 24 hours.${ctx.extra ? ` (${ctx.extra})` : ''}`;
    case 'charter_approval':
      return `Namaste ${ctx.recipientName}, the Project Charter for "${ctx.projectTitle}" (${ctx.businessName}) is ready on DGU IndustryBridge.${ctx.extra ? ` ${ctx.extra}` : ''} Please review the scope, milestones, and fee and click "Approve Charter" so our DGU student team can begin.`;
    case 'deliverable_ready':
      return `Namaste ${ctx.recipientName}, the DGU student team has uploaded the deliverable for "${ctx.projectTitle}" (${ctx.businessName}) on IndustryBridge. Please review it and approve or share revision notes.`;
    case 'payment_recorded':
      return `Namaste ${ctx.recipientName}, thank you! Payment for "${ctx.projectTitle}" (${ctx.businessName}) has been recorded on DGU IndustryBridge${ctx.extra ? ` (Ref: ${ctx.extra})` : ''}. We appreciate your support for DGU student talent.`;
  }
}
