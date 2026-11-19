export type UserRole = 'business' | 'student' | 'admin';

export type BusinessLocation = 'Selaqui' | 'Other Dehradun';

export type ProjectCategory =
  | 'Market Research'
  | 'Customer Analysis'
  | 'Competitor Analysis'
  | 'Sales Analysis'
  | 'Financial Analysis'
  | 'Digital Marketing'
  | 'Excel/Power BI Dashboard'
  | 'Operations/Process Analysis'
  | 'Other';

export type ProjectTimeline = '1 week' | '2 weeks' | '3-4 weeks';

export type DataAvailability = 'Yes' | 'Partial' | 'No';

export type ProjectStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Matched'
  | 'Charter Approved'
  | 'In Progress'
  | 'Delivered'
  | 'Feedback Collected'
  | 'Paid'
  | 'Closed';

export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced';

export type AvailabilityStatus = 'Available' | 'Busy';

export type StudentInviteResponse = 'Pending' | 'Accepted' | 'Declined';

export type LeadSource =
  | 'Direct outreach'
  | 'Faculty-alumni referral'
  | 'LinkedIn'
  | 'Local network-WhatsApp';

export type LeadStage =
  | 'Contacted'
  | 'Qualified'
  | 'Proposal Sent'
  | 'Paid Pilot'
  | 'Completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  location: BusinessLocation;
  industry: string;
  createdAt: string;
}

export interface StudentSkill {
  name: string;
  proficiency: SkillProficiency;
}

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  enrollmentNumber: string;
  programBatch: string;
  email: string;
  phone: string;
  skills: StudentSkill[];
  pastProjects: string;
  portfolioUrl: string;
  weeklyHours: number;
  availabilityStatus: AvailabilityStatus;
  createdAt: string;
}

export interface Project {
  id: string;
  businessId: string;
  businessUserId: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  location: BusinessLocation;
  industry: string;
  title: string;
  description: string;
  category: ProjectCategory;
  expectedOutcome: string;
  requiredSkills: string[];
  timeline: ProjectTimeline;
  budgetMin: number;
  budgetMax: number;
  dataAvailability: DataAvailability;
  confidentialityNotes: string;
  status: ProjectStatus;
  assignedStudentIds: string[];
  teamLeadId?: string;
  studentResponses: Record<string, StudentInviteResponse>;
  paymentRef?: string;
  paidAmount?: number;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharterMilestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface ProjectCharter {
  id: string;
  projectId: string;
  scopeSummary: string;
  inScope: string[];
  outOfScope: string[];
  deliverables: string[];
  milestones: CharterMilestone[];
  totalFeeInr: number;
  commissionPct: number;
  studentPayoutInr: number;
  businessResponsibilities: string;
  studentResponsibilities: string;
  approvedByBusiness: boolean;
  approvedAt?: string;
  updatedAt: string;
}

export type DeliverableFileType = 'PDF' | 'Excel' | 'PPT' | 'Link';
export type DeliverableStatus = 'Pending Review' | 'Approved' | 'Revision Requested';

export interface Deliverable {
  id: string;
  projectId: string;
  submittedByUserId: string;
  submittedByName: string;
  title: string;
  notes: string;
  fileType: DeliverableFileType;
  fileName?: string;
  fileDataUrl?: string;
  externalUrl?: string;
  status: DeliverableStatus;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFeedback {
  id: string;
  projectId: string;
  businessId: string;
  businessName: string;
  usefulness: number;
  onTime: boolean;
  quality: number;
  wouldPayAgain: boolean;
  nps: number;
  comments: string;
  testimonial: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  source: LeadSource;
  stage: LeadStage;
  notes: string;
  createdAt: string;
}

export interface CustomerInterview {
  id: string;
  businessName: string;
  date: string;
  problemType: string;
  currentWorkaround: string;
  frequency: string;
  willingnessToPay: 'Yes' | 'Maybe' | 'No';
  priceRangeMentioned: string;
  trustConcerns: string;
  createdAt: string;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  body: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface DiscoveryBooking {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  preferredSlot: string;
  topic: string;
  createdAt: string;
}

export interface FinancialAssumptions {
  avgProjectValue: number;
  commissionPct: number;
  variableCostPerProject: number;
  monthlyFixedCost: number;
  projectedMonthlyProjects: number;
}

export interface WorkspaceSnapshot {
  businesses: BusinessProfile[];
  students: StudentProfile[];
  projects: Project[];
  charters: ProjectCharter[];
  deliverables: Deliverable[];
  feedbacks: ProjectFeedback[];
  leads: Lead[];
  interviews: CustomerInterview[];
  messages: ProjectMessage[];
  notifications: Notification[];
  discoveryBookings: DiscoveryBooking[];
  financialAssumptions: FinancialAssumptions;
}
