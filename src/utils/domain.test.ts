import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCharterFinancials,
  calculateFinancialSnapshot,
  calculateValidationMetrics,
  DEFAULT_FINANCIAL_ASSUMPTIONS,
  filterStudents,
  generateWhatsAppMessage,
  getNextStatus,
  rankStudentsBySkillOverlap,
  validateProblemSubmission,
  validateStudentEmail,
} from './domain';
import type { Lead, Project, ProjectCharter, ProjectFeedback, StudentProfile } from '../types/models';

test('validateStudentEmail strictly enforces @dgu.ac.in', () => {
  assert.equal(validateStudentEmail('soumya.0251mba666@dgu.ac.in'), true);
  assert.equal(validateStudentEmail('AARAV@DGU.AC.IN'), true);
  assert.equal(validateStudentEmail('student@gmail.com'), false);
  assert.equal(validateStudentEmail('@dgu.ac.in'), false);
  assert.equal(validateStudentEmail('student@fake-dgu.ac.in'), false);
});

test('calculateCharterFinancials computes commission and student payout accurately', () => {
  const res = calculateCharterFinancials(5000, 20);
  assert.equal(res.totalFeeInr, 5000);
  assert.equal(res.commissionPct, 20);
  assert.equal(res.commissionAmount, 1000);
  assert.equal(res.studentPayoutInr, 4000);

  const clamped = calculateCharterFinancials(6000, 150);
  assert.equal(clamped.commissionPct, 100);
  assert.equal(clamped.studentPayoutInr, 0);
});

test('calculateFinancialSnapshot matches Venture Plan default base economics', () => {
  const snap = calculateFinancialSnapshot(DEFAULT_FINANCIAL_ASSUMPTIONS);
  assert.equal(snap.revenuePerProject, 1000);
  assert.equal(snap.contributionPerProject, 750);
  assert.equal(snap.monthlyRevenue, 10000);
  assert.equal(snap.monthlyOperatingSurplus, -7500);
  assert.equal(snap.breakEvenProjectsPerMonth, 20);
});

test('rankStudentsBySkillOverlap ranks by overlap count then availability', () => {
  const students: StudentProfile[] = [
    {
      id: 's1',
      userId: 'u1',
      name: 'Student One',
      enrollmentNumber: 'DGU1',
      programBatch: 'MBA 2026',
      email: 's1@dgu.ac.in',
      phone: '9999999991',
      skills: [{ name: 'Marketing', proficiency: 'Intermediate' }],
      pastProjects: '',
      portfolioUrl: '',
      weeklyHours: 10,
      availabilityStatus: 'Available',
      createdAt: '2026-01-01',
    },
    {
      id: 's2',
      userId: 'u2',
      name: 'Student Two',
      enrollmentNumber: 'DGU2',
      programBatch: 'MBA 2026',
      email: 's2@dgu.ac.in',
      phone: '9999999992',
      skills: [
        { name: 'Excel', proficiency: 'Advanced' },
        { name: 'Power BI', proficiency: 'Intermediate' },
      ],
      pastProjects: '',
      portfolioUrl: '',
      weeklyHours: 12,
      availabilityStatus: 'Available',
      createdAt: '2026-01-01',
    },
  ];

  const ranked = rankStudentsBySkillOverlap(['Excel', 'Power BI'], students);
  assert.equal(ranked[0].student.id, 's2');
  assert.equal(ranked[0].overlapCount, 2);
  assert.equal(ranked[1].student.id, 's1');
  assert.equal(ranked[1].overlapCount, 0);

  const filtered = filterStudents(students, {
    skill: 'Excel',
    proficiency: 'Advanced',
    availability: 'Available',
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 's2');
});

test('getNextStatus progresses through the 9-stage project pipeline', () => {
  assert.equal(getNextStatus('Submitted'), 'Under Review');
  assert.equal(getNextStatus('Paid'), 'Closed');
  assert.equal(getNextStatus('Closed'), null);
});

test('validateProblemSubmission returns explicit errors for missing required fields', () => {
  const errors = validateProblemSubmission({
    businessName: '',
    contactName: 'Owner',
    phone: '123',
    email: 'bad-email',
    location: 'Selaqui',
    industry: '',
    title: 'Hi',
    description: 'Too short',
    category: 'Market Research',
    expectedOutcome: '',
    requiredSkills: [],
    timeline: '2 weeks',
    budgetMin: 0,
    budgetMax: 0,
  });

  assert.ok(errors.businessName);
  assert.ok(errors.phone);
  assert.ok(errors.email);
  assert.ok(errors.industry);
  assert.ok(errors.title);
  assert.ok(errors.description);
  assert.ok(errors.expectedOutcome);
  assert.ok(errors.requiredSkills);
  assert.ok(errors.budget);
});

test('calculateValidationMetrics aggregates funnel, financials, and feedback accurately', () => {
  const projects: Project[] = [
    {
      id: 'p1',
      businessId: 'b1',
      businessUserId: 'u1',
      businessName: 'Biz 1',
      contactName: 'Rajesh',
      phone: '9876543210',
      email: 'r@biz.in',
      location: 'Selaqui',
      industry: 'Manufacturing',
      title: 'Sales Dashboard',
      description: 'Need dashboard for sales tracking.',
      category: 'Excel/Power BI Dashboard',
      expectedOutcome: 'Dashboard',
      requiredSkills: ['Excel'],
      timeline: '2 weeks',
      budgetMin: 4000,
      budgetMax: 6000,
      dataAvailability: 'Yes',
      confidentialityNotes: '',
      status: 'Paid',
      assignedStudentIds: ['s1'],
      studentResponses: { s1: 'Accepted' },
      paidAmount: 5000,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-10',
    },
    {
      id: 'p2',
      businessId: 'b2',
      businessUserId: 'u2',
      businessName: 'Biz 2',
      contactName: 'Anita',
      phone: '9876543211',
      email: 'a@biz.in',
      location: 'Selaqui',
      industry: 'Packaging',
      title: 'Competitor Research',
      description: 'Research local competitors.',
      category: 'Competitor Analysis',
      expectedOutcome: 'Report',
      requiredSkills: ['Market Research'],
      timeline: '2 weeks',
      budgetMin: 3000,
      budgetMax: 5000,
      dataAvailability: 'Partial',
      confidentialityNotes: '',
      status: 'Submitted',
      assignedStudentIds: [],
      studentResponses: {},
      createdAt: '2026-11-15',
      updatedAt: '2026-11-15',
    },
  ];
  const charters: ProjectCharter[] = [
    {
      id: 'c1',
      projectId: 'p1',
      scopeSummary: 'Scope',
      inScope: ['A'],
      outOfScope: ['B'],
      deliverables: ['Dashboard'],
      milestones: [],
      totalFeeInr: 5000,
      commissionPct: 20,
      studentPayoutInr: 4000,
      businessResponsibilities: 'Data',
      studentResponsibilities: 'Analysis',
      approvedByBusiness: true,
      updatedAt: '2026-11-02',
    },
  ];
  const feedbacks: ProjectFeedback[] = [
    {
      id: 'f1',
      projectId: 'p1',
      businessId: 'b1',
      businessName: 'Biz 1',
      usefulness: 5,
      onTime: true,
      quality: 4,
      wouldPayAgain: true,
      nps: 9,
      comments: 'Great work',
      testimonial: 'Very helpful team.',
      createdAt: '2026-11-09',
    },
  ];
  const leads: Lead[] = [
    {
      id: 'l1',
      businessName: 'Biz 1',
      contactName: 'Rajesh',
      phone: '9876543210',
      source: 'Direct outreach',
      stage: 'Paid Pilot',
      notes: '',
      createdAt: '2026-11-01',
    },
  ];

  const metrics = calculateValidationMetrics({
    businessesCount: 2,
    projects,
    charters,
    feedbacks,
    leads,
  });

  assert.equal(metrics.paidPilotsSecured, 1);
  assert.equal(metrics.totalProjectValue, 5000);
  assert.equal(metrics.commissionEarned, 1000);
  assert.equal(metrics.studentPayouts, 4000);
  assert.equal(metrics.avgUsefulness, 5);
  assert.equal(metrics.onTimePct, 100);
  assert.equal(metrics.avgNps, 9);
  assert.equal(metrics.funnel[0].count, 2);
  assert.equal(metrics.funnel[4].count, 1);
});

test('generateWhatsAppMessage produces pre-filled readable message', () => {
  const msg = generateWhatsAppMessage('charter_approval', {
    recipientName: 'Rajesh',
    businessName: 'Himalayan Herbs',
    projectTitle: 'Sales Dashboard',
    extra: 'Fee: ₹6,000',
  });
  assert.ok(msg.includes('Rajesh'));
  assert.ok(msg.includes('Sales Dashboard'));
  assert.ok(msg.includes('Approve Charter'));
});
