import crypto from 'node:crypto';
import type {
  BusinessProfile,
  CustomerInterview,
  Deliverable,
  DiscoveryBooking,
  FinancialAssumptions,
  Lead,
  Notification,
  Project,
  ProjectCharter,
  ProjectFeedback,
  ProjectMessage,
  StudentProfile,
  UserRole,
} from '../src/types/models';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface DatabaseState {
  users: StoredUser[];
  sessions: Record<string, string>; // token -> userId
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

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

export function createSeedData(): DatabaseState {
  const now = '2026-11-19T09:00:00.000Z';
  const demoPass = hashPassword('Demo@123');
  const adminPass = hashPassword('Admin@123');

  const users: StoredUser[] = [
    {
      id: 'user-admin-1',
      name: 'Soumya · Founder',
      email: 'soumya.0251mba666@dgu.ac.in',
      passwordHash: adminPass,
      role: 'admin',
      createdAt: '2026-10-20T08:00:00.000Z',
    },
    {
      id: 'user-biz-1',
      name: 'Rajesh Rawat',
      email: 'rajesh@himalayanherbs.in',
      passwordHash: demoPass,
      role: 'business',
      createdAt: '2026-10-25T10:00:00.000Z',
    },
    {
      id: 'user-biz-2',
      name: 'Anita Negi',
      email: 'anita@doonprecision.in',
      passwordHash: demoPass,
      role: 'business',
      createdAt: '2026-10-28T11:30:00.000Z',
    },
    {
      id: 'user-biz-3',
      name: 'Vikram Bisht',
      email: 'vikram@shivalikagro.in',
      passwordHash: demoPass,
      role: 'business',
      createdAt: '2026-11-02T09:15:00.000Z',
    },
    {
      id: 'user-stu-1',
      name: 'Aarav Sharma',
      email: 'aarav.0251mba101@dgu.ac.in',
      passwordHash: demoPass,
      role: 'student',
      createdAt: '2026-10-21T09:00:00.000Z',
    },
    {
      id: 'user-stu-2',
      name: 'Priya Nautiyal',
      email: 'priya.0251mba104@dgu.ac.in',
      passwordHash: demoPass,
      role: 'student',
      createdAt: '2026-10-21T09:30:00.000Z',
    },
    {
      id: 'user-stu-3',
      name: 'Rohan Joshi',
      email: 'rohan.0251mba112@dgu.ac.in',
      passwordHash: demoPass,
      role: 'student',
      createdAt: '2026-10-22T10:00:00.000Z',
    },
    {
      id: 'user-stu-4',
      name: 'Meera Bhandari',
      email: 'meera.0251mba118@dgu.ac.in',
      passwordHash: demoPass,
      role: 'student',
      createdAt: '2026-10-22T11:00:00.000Z',
    },
    {
      id: 'user-stu-5',
      name: 'Kabir Verma',
      email: 'kabir.0251mba125@dgu.ac.in',
      passwordHash: demoPass,
      role: 'student',
      createdAt: '2026-10-23T12:00:00.000Z',
    },
    {
      id: 'user-stu-6',
      name: 'Sneha Gusain',
      email: 'sneha.0251mba131@dgu.ac.in',
      passwordHash: demoPass,
      role: 'student',
      createdAt: '2026-10-23T14:00:00.000Z',
    },
  ];

  const businesses: BusinessProfile[] = [
    {
      id: 'biz-1',
      userId: 'user-biz-1',
      businessName: 'Himalayan Nutraceuticals Pvt Ltd',
      ownerName: 'Rajesh Rawat',
      phone: '+91 98370 11223',
      email: 'rajesh@himalayanherbs.in',
      location: 'Selaqui',
      industry: 'Pharma & Nutraceutical Manufacturing',
      createdAt: '2026-10-25T10:00:00.000Z',
    },
    {
      id: 'biz-2',
      userId: 'user-biz-2',
      businessName: 'Doon Precision Packaging',
      ownerName: 'Anita Negi',
      phone: '+91 97192 44556',
      email: 'anita@doonprecision.in',
      location: 'Selaqui',
      industry: 'Industrial Corrugated & Label Packaging',
      createdAt: '2026-10-28T11:30:00.000Z',
    },
    {
      id: 'biz-3',
      userId: 'user-biz-3',
      businessName: 'Shivalik Agro Foods',
      ownerName: 'Vikram Bisht',
      phone: '+91 94120 77889',
      email: 'vikram@shivalikagro.in',
      location: 'Other Dehradun',
      industry: 'FMCG & Organic Staples',
      createdAt: '2026-11-02T09:15:00.000Z',
    },
  ];

  const students: StudentProfile[] = [
    {
      id: 'stu-1',
      userId: 'user-stu-1',
      name: 'Aarav Sharma',
      enrollmentNumber: 'DGU25MBA101',
      programBatch: 'MBA (Finance & Analytics) · Batch 2025–27',
      email: 'aarav.0251mba101@dgu.ac.in',
      phone: '+91 90123 10101',
      skills: [
        { name: 'Financial Analysis', proficiency: 'Advanced' },
        { name: 'Excel', proficiency: 'Advanced' },
        { name: 'Finance', proficiency: 'Advanced' },
        { name: 'Analytics', proficiency: 'Intermediate' },
      ],
      pastProjects: 'Built working-capital variance workbook for a Haridwar SME during summer internship.',
      portfolioUrl: 'https://linkedin.com/in/aarav-sharma-dgu',
      weeklyHours: 14,
      availabilityStatus: 'Available',
      createdAt: '2026-10-21T09:00:00.000Z',
    },
    {
      id: 'stu-2',
      userId: 'user-stu-2',
      name: 'Priya Nautiyal',
      enrollmentNumber: 'DGU25MBA104',
      programBatch: 'MBA (Marketing) · Batch 2025–27',
      email: 'priya.0251mba104@dgu.ac.in',
      phone: '+91 90123 10404',
      skills: [
        { name: 'Market Research', proficiency: 'Advanced' },
        { name: 'Customer Analysis', proficiency: 'Advanced' },
        { name: 'Marketing', proficiency: 'Advanced' },
        { name: 'Digital Marketing', proficiency: 'Intermediate' },
      ],
      pastProjects: 'Led 120-respondent consumer perception survey across Rajpur Road & Ballupur retail stores.',
      portfolioUrl: 'https://linkedin.com/in/priya-nautiyal-dgu',
      weeklyHours: 16,
      availabilityStatus: 'Available',
      createdAt: '2026-10-21T09:30:00.000Z',
    },
    {
      id: 'stu-3',
      userId: 'user-stu-3',
      name: 'Rohan Joshi',
      enrollmentNumber: 'DGU25MBA112',
      programBatch: 'MBA (Business Analytics) · Batch 2025–27',
      email: 'rohan.0251mba112@dgu.ac.in',
      phone: '+91 90123 11212',
      skills: [
        { name: 'Power BI', proficiency: 'Advanced' },
        { name: 'Excel', proficiency: 'Advanced' },
        { name: 'Sales Analysis', proficiency: 'Intermediate' },
        { name: 'Analytics', proficiency: 'Advanced' },
      ],
      pastProjects: 'Designed automated SKU velocity & regional margin Power BI dashboard for FMCG distributor.',
      portfolioUrl: 'https://linkedin.com/in/rohan-joshi-dgu',
      weeklyHours: 12,
      availabilityStatus: 'Available',
      createdAt: '2026-10-22T10:00:00.000Z',
    },
    {
      id: 'stu-4',
      userId: 'user-stu-4',
      name: 'Meera Bhandari',
      enrollmentNumber: 'DGU25MBA118',
      programBatch: 'MBA (Operations) · Batch 2025–27',
      email: 'meera.0251mba118@dgu.ac.in',
      phone: '+91 90123 11818',
      skills: [
        { name: 'Operations', proficiency: 'Advanced' },
        { name: 'Process Analysis', proficiency: 'Advanced' },
        { name: 'Excel', proficiency: 'Intermediate' },
        { name: 'Financial Analysis', proficiency: 'Intermediate' },
      ],
      pastProjects: 'Mapped packaging line bottlenecks and reduced changeover waste in a campus operations case study.',
      portfolioUrl: 'https://linkedin.com/in/meera-bhandari-dgu',
      weeklyHours: 15,
      availabilityStatus: 'Available',
      createdAt: '2026-10-22T11:00:00.000Z',
    },
    {
      id: 'stu-5',
      userId: 'user-stu-5',
      name: 'Kabir Verma',
      enrollmentNumber: 'DGU25MBA125',
      programBatch: 'MBA (Marketing & Strategy) · Batch 2025–27',
      email: 'kabir.0251mba125@dgu.ac.in',
      phone: '+91 90123 12525',
      skills: [
        { name: 'Competitor Analysis', proficiency: 'Advanced' },
        { name: 'Market Research', proficiency: 'Intermediate' },
        { name: 'Digital Marketing', proficiency: 'Advanced' },
        { name: 'Sales Analysis', proficiency: 'Intermediate' },
      ],
      pastProjects: 'Audited B2B pricing tiers and Google Business presence for 15 Uttarakhand manufacturers.',
      portfolioUrl: 'https://linkedin.com/in/kabir-verma-dgu',
      weeklyHours: 10,
      availabilityStatus: 'Available',
      createdAt: '2026-10-23T12:00:00.000Z',
    },
    {
      id: 'stu-6',
      userId: 'user-stu-6',
      name: 'Sneha Gusain',
      enrollmentNumber: 'DGU25MBA131',
      programBatch: 'MBA (HR & Operations) · Batch 2025–27',
      email: 'sneha.0251mba131@dgu.ac.in',
      phone: '+91 90123 13131',
      skills: [
        { name: 'HR', proficiency: 'Advanced' },
        { name: 'Operations', proficiency: 'Intermediate' },
        { name: 'Process Analysis', proficiency: 'Intermediate' },
        { name: 'Customer Analysis', proficiency: 'Beginner' },
      ],
      pastProjects: 'Created shift-handover SOPs and onboarding checklist for a 45-person logistics unit.',
      portfolioUrl: 'https://linkedin.com/in/sneha-gusain-dgu',
      weeklyHours: 6,
      availabilityStatus: 'Busy',
      createdAt: '2026-10-23T14:00:00.000Z',
    },
  ];

  const projects: Project[] = [
    {
      id: 'proj-1',
      businessId: 'biz-1',
      businessUserId: 'user-biz-1',
      businessName: 'Himalayan Nutraceuticals Pvt Ltd',
      contactName: 'Rajesh Rawat',
      phone: '+91 98370 11223',
      email: 'rajesh@himalayanherbs.in',
      location: 'Selaqui',
      industry: 'Pharma & Nutraceutical Manufacturing',
      title: 'Distributor Margin & Secondary Sales Excel/Power BI Dashboard',
      description:
        'We distribute 28 herbal supplement SKUs across 45 stockists in Uttarakhand and western UP. Currently our sales coordinator consolidates 45 monthly Excel sheets manually, taking 5 days and hiding slow-moving SKUs.',
      category: 'Excel/Power BI Dashboard',
      expectedOutcome:
        'A clean Excel + Power BI dashboard showing stockist-wise margins, top/bottom 10 SKUs, and 90-day slow-moving stock alerts.',
      requiredSkills: ['Excel', 'Power BI', 'Sales Analysis', 'Financial Analysis'],
      timeline: '2 weeks',
      budgetMin: 5000,
      budgetMax: 7000,
      dataAvailability: 'Yes',
      confidentialityNotes: 'Stockist names anonymized with codes before sharing outside business.',
      status: 'Delivered',
      assignedStudentIds: ['stu-1', 'stu-3'],
      teamLeadId: 'stu-3',
      studentResponses: {
        'stu-1': 'Accepted',
        'stu-3': 'Accepted',
      },
      createdAt: '2026-11-01T09:00:00.000Z',
      updatedAt: '2026-11-16T15:30:00.000Z',
    },
    {
      id: 'proj-2',
      businessId: 'biz-2',
      businessUserId: 'user-biz-2',
      businessName: 'Doon Precision Packaging',
      contactName: 'Anita Negi',
      phone: '+91 97192 44556',
      email: 'anita@doonprecision.in',
      location: 'Selaqui',
      industry: 'Industrial Corrugated & Label Packaging',
      title: 'Selaqui Pharma & FMCG Buyer Competitor Pricing Study',
      description:
        'We want to expand corrugated carton and shrink-label supply to mid-sized pharma units in UPSIDC Selaqui. Need structured market mapping of 25 target units, current supplier benchmarks, and typical order MOQs.',
      category: 'Competitor Analysis',
      expectedOutcome:
        'Structured comparison sheet of 6 regional packaging competitors, pricing tiers, and 25 prioritized buyer leads in Selaqui.',
      requiredSkills: ['Competitor Analysis', 'Market Research', 'Customer Analysis'],
      timeline: '2 weeks',
      budgetMin: 4500,
      budgetMax: 5500,
      dataAvailability: 'Partial',
      confidentialityNotes: 'Do not share our internal rate card during market interviews.',
      status: 'Paid',
      assignedStudentIds: ['stu-2', 'stu-5'],
      teamLeadId: 'stu-2',
      studentResponses: {
        'stu-2': 'Accepted',
        'stu-5': 'Accepted',
      },
      paymentRef: 'UPI-409281726',
      paidAmount: 5000,
      paidAt: '2026-11-14T17:00:00.000Z',
      createdAt: '2026-10-29T10:00:00.000Z',
      updatedAt: '2026-11-14T17:00:00.000Z',
    },
    {
      id: 'proj-3',
      businessId: 'biz-3',
      businessUserId: 'user-biz-3',
      businessName: 'Shivalik Agro Foods',
      contactName: 'Vikram Bisht',
      phone: '+91 94120 77889',
      email: 'vikram@shivalikagro.in',
      location: 'Other Dehradun',
      industry: 'FMCG & Organic Staples',
      title: 'Dehradun Retail Customer Survey & Local Digital Marketing Plan',
      description:
        'Our packaged pahadi rajma and millets sell well in 12 kirana stores, but repeat purchase online is low. We need a 60-customer survey around Jakhan & Rajpur plus a practical 30-day Instagram & WhatsApp catalog plan.',
      category: 'Market Research',
      expectedOutcome:
        'Survey insights report (n=60) on price sensitivity & pack sizes, plus a ready-to-run 30-day content and WhatsApp catalog calendar.',
      requiredSkills: ['Market Research', 'Customer Analysis', 'Digital Marketing'],
      timeline: '3-4 weeks',
      budgetMin: 4000,
      budgetMax: 5000,
      dataAvailability: 'Partial',
      confidentialityNotes: 'Standard business confidentiality; public retail survey only.',
      status: 'In Progress',
      assignedStudentIds: ['stu-2', 'stu-5'],
      teamLeadId: 'stu-2',
      studentResponses: {
        'stu-2': 'Accepted',
        'stu-5': 'Accepted',
      },
      createdAt: '2026-11-05T11:20:00.000Z',
      updatedAt: '2026-11-15T10:00:00.000Z',
    },
    {
      id: 'proj-4',
      businessId: 'biz-2',
      businessUserId: 'user-biz-2',
      businessName: 'Doon Precision Packaging',
      contactName: 'Anita Negi',
      phone: '+91 97192 44556',
      email: 'anita@doonprecision.in',
      location: 'Selaqui',
      industry: 'Industrial Corrugated & Label Packaging',
      title: 'Kraft Paper Procurement & Scrap Variance Cost Analysis',
      description:
        'Kraft paper reel prices fluctuated 14% over the last two quarters and trim scrap on short runs is eroding margins. Need an Excel model analyzing past 6 months purchase invoices vs job-card output.',
      category: 'Financial Analysis',
      expectedOutcome:
        'Clean Excel cost-variance template identifying high-scrap die sizes and recommended reorder batch quantities.',
      requiredSkills: ['Financial Analysis', 'Excel', 'Operations', 'Process Analysis'],
      timeline: '2 weeks',
      budgetMin: 5000,
      budgetMax: 6500,
      dataAvailability: 'Yes',
      confidentialityNotes: 'Supplier names masked as Vendor A–F; invoices shared on site.',
      status: 'Submitted',
      assignedStudentIds: [],
      studentResponses: {},
      createdAt: '2026-11-18T14:00:00.000Z',
      updatedAt: '2026-11-18T14:00:00.000Z',
    },
  ];

  const charters: ProjectCharter[] = [
    {
      id: 'charter-1',
      projectId: 'proj-1',
      scopeSummary:
        'Build an automated Excel + Power BI secondary sales and margin workbook covering 6 months of anonymized stockist data across 28 SKUs.',
      inScope: [
        'Clean and standardize 6 months of CSV/Excel stockist invoices',
        'Interactive Power BI report with margin %, SKU velocity, and 90-day slow-mover flag',
        '1-hour handover walkthrough with sales coordinator',
      ],
      outOfScope: [
        'ERP / Tally live API integration',
        'GST filing or statutory tax accounting',
      ],
      deliverables: [
        'Standardized Master Data Template (.xlsx)',
        'Power BI Dashboard (.pbix) + Executive PDF Snapshot',
      ],
      milestones: [
        { id: 'm1', title: 'Data cleaning & schema sign-off', dueDate: '2026-11-06', completed: true },
        { id: 'm2', title: 'Draft dashboard review', dueDate: '2026-11-12', completed: true },
        { id: 'm3', title: 'Final deliverable & walkthrough', dueDate: '2026-11-16', completed: true },
      ],
      totalFeeInr: 6000,
      commissionPct: 20,
      studentPayoutInr: 4800,
      businessResponsibilities: 'Provide anonymized 6-month stockist sheets within 48 hours and attend 20-min mid-point review.',
      studentResponsibilities: 'Deliver clean, bug-free Excel/Power BI files on schedule and maintain strict data confidentiality.',
      approvedByBusiness: true,
      approvedAt: '2026-11-02T14:00:00.000Z',
      updatedAt: '2026-11-02T14:00:00.000Z',
    },
    {
      id: 'charter-2',
      projectId: 'proj-2',
      scopeSummary:
        'Structured competitor pricing benchmark and Selaqui industrial buyer map for corrugated cartons and shrink labels.',
      inScope: [
        'Benchmark 6 regional packaging suppliers on MOQ, lead time, and indicative pricing',
        'Compile verified directory of 25 Selaqui pharma & FMCG procurement contacts',
        'Summary recommendation deck (10–12 slides)',
      ],
      outOfScope: [
        'Direct cold-calling or commission sales closing',
        'Technical lab testing of corrugated board strength',
      ],
      deliverables: [
        'Competitor Pricing & Lead-Time Matrix (.xlsx)',
        '25-Unit Selaqui Buyer Prospect List + Strategy Deck (.pdf)',
      ],
      milestones: [
        { id: 'm1', title: 'Competitor shortlist & interview guide', dueDate: '2026-11-02', completed: true },
        { id: 'm2', title: 'Field mapping of 25 Selaqui units', dueDate: '2026-11-08', completed: true },
        { id: 'm3', title: 'Final presentation & Excel matrix', dueDate: '2026-11-12', completed: true },
      ],
      totalFeeInr: 5000,
      commissionPct: 20,
      studentPayoutInr: 4000,
      businessResponsibilities: 'Share target SKU specs and review shortlist on Day 3.',
      studentResponsibilities: 'Verify all buyer contacts independently and present clear benchmark findings.',
      approvedByBusiness: true,
      approvedAt: '2026-10-30T16:00:00.000Z',
      updatedAt: '2026-10-30T16:00:00.000Z',
    },
    {
      id: 'charter-3',
      projectId: 'proj-3',
      scopeSummary:
        'Conduct a 60-consumer retail perception survey in Dehradun and create a 30-day WhatsApp & Instagram conversion plan.',
      inScope: [
        'Design & execute 60 structured consumer surveys (Jakhan, Rajpur, Ballupur)',
        'Analyze pack-size preference & price elasticity for 3 core staples',
        '30-day WhatsApp Business catalog & Instagram reel calendar',
      ],
      outOfScope: [
        'Paid Meta/Google ad spend management',
        'E-commerce website development',
      ],
      deliverables: [
        'Consumer Survey Findings Report (.pdf)',
        '30-Day Digital & WhatsApp Playbook (.xlsx / .pdf)',
      ],
      milestones: [
        { id: 'm1', title: 'Questionnaire approval', dueDate: '2026-11-08', completed: true },
        { id: 'm2', title: '60 surveys completed', dueDate: '2026-11-18', completed: false },
        { id: 'm3', title: 'Final report & 30-day calendar', dueDate: '2026-11-26', completed: false },
      ],
      totalFeeInr: 4500,
      commissionPct: 20,
      studentPayoutInr: 3600,
      businessResponsibilities: 'Provide product sample photos and current MRP/wholesale price list.',
      studentResponsibilities: 'Collect authentic survey responses with location tags and deliver actionable calendar.',
      approvedByBusiness: true,
      approvedAt: '2026-11-06T12:00:00.000Z',
      updatedAt: '2026-11-06T12:00:00.000Z',
    },
  ];

  const deliverables: Deliverable[] = [
    {
      id: 'deliv-1',
      projectId: 'proj-1',
      submittedByUserId: 'user-stu-3',
      submittedByName: 'Rohan Joshi',
      title: 'Himalayan Nutraceuticals — Stockist Margin & SKU Velocity Workbook',
      notes:
        'Includes automated Power Query refresh sheet, 28-SKU margin heatmap, and 90-day slow-moving inventory alert tab. Ready for your review.',
      fileType: 'Excel',
      fileName: 'Himalayan_Secondary_Sales_Margin_v1.xlsx',
      externalUrl: 'https://docs.google.com/spreadsheets/d/example-himalayan-margin',
      status: 'Pending Review',
      createdAt: '2026-11-16T15:30:00.000Z',
      updatedAt: '2026-11-16T15:30:00.000Z',
    },
    {
      id: 'deliv-2',
      projectId: 'proj-2',
      submittedByUserId: 'user-stu-2',
      submittedByName: 'Priya Nautiyal',
      title: 'Selaqui Packaging Competitor Benchmark & 25-Buyer Prospect Deck',
      notes: 'Complete pricing matrix across 6 regional suppliers and verified procurement contact sheet for 25 UPSIDC Selaqui units.',
      fileType: 'PDF',
      fileName: 'Doon_Precision_Selaqui_Buyer_Study.pdf',
      externalUrl: 'https://drive.google.com/file/d/example-doon-precision-study',
      status: 'Approved',
      reviewComment: 'Very practical list—we already booked two plant visits from the 25 leads.',
      createdAt: '2026-11-12T16:00:00.000Z',
      updatedAt: '2026-11-13T11:00:00.000Z',
    },
  ];

  const feedbacks: ProjectFeedback[] = [
    {
      id: 'fb-1',
      projectId: 'proj-2',
      businessId: 'biz-2',
      businessName: 'Doon Precision Packaging',
      usefulness: 5,
      onTime: true,
      quality: 5,
      wouldPayAgain: true,
      nps: 9,
      comments:
        'The charter kept expectations crystal clear. Having local DGU MBA students visit Selaqui units saved our sales team weeks of cold research.',
      testimonial:
        'DGU IndustryBridge delivered a practical 25-buyer Selaqui prospect map in two weeks at a fraction of consultant rates.',
      createdAt: '2026-11-14T11:00:00.000Z',
    },
  ];

  const leads: Lead[] = [
    {
      id: 'lead-1',
      businessName: 'Himalayan Nutraceuticals Pvt Ltd',
      contactName: 'Rajesh Rawat',
      phone: '+91 98370 11223',
      source: 'Direct outreach',
      stage: 'Completed',
      notes: 'Selaqui pharma unit visit; wanted secondary sales visibility.',
      createdAt: '2026-10-25T10:00:00.000Z',
    },
    {
      id: 'lead-2',
      businessName: 'Doon Precision Packaging',
      contactName: 'Anita Negi',
      phone: '+91 97192 44556',
      source: 'Faculty-alumni referral',
      stage: 'Paid Pilot',
      notes: 'Referred by DGU MBA alumnus; completed 1st pilot and submitted 2nd problem.',
      createdAt: '2026-10-28T11:30:00.000Z',
    },
    {
      id: 'lead-3',
      businessName: 'Shivalik Agro Foods',
      contactName: 'Vikram Bisht',
      phone: '+91 94120 77889',
      source: 'Local network-WhatsApp',
      stage: 'Proposal Sent',
      notes: 'Active pilot in progress; charter approved at ₹4,500.',
      createdAt: '2026-11-02T09:15:00.000Z',
    },
    {
      id: 'lead-4',
      businessName: 'Garhwal MedTech Consumables',
      contactName: 'Sandeep Rawal',
      phone: '+91 98374 55110',
      source: 'Direct outreach',
      stage: 'Qualified',
      notes: 'Interested in inventory reorder Excel model after 15-min discovery call.',
      createdAt: '2026-11-10T15:00:00.000Z',
    },
    {
      id: 'lead-5',
      businessName: 'Uttarakhand Spice Exports',
      contactName: 'Deepak Joshi',
      phone: '+91 97600 88221',
      source: 'LinkedIn',
      stage: 'Proposal Sent',
      notes: 'Sent ₹5,000 pilot proposal for distributor onboarding tracker.',
      createdAt: '2026-11-12T12:00:00.000Z',
    },
    {
      id: 'lead-6',
      businessName: 'Alaknanda Cold Chain',
      contactName: 'Manoj Kandpal',
      phone: '+91 94111 33445',
      source: 'LinkedIn',
      stage: 'Contacted',
      notes: 'Initial LinkedIn message sent; follow-up scheduled.',
      createdAt: '2026-11-16T09:00:00.000Z',
    },
  ];

  const interviews: CustomerInterview[] = [
    {
      id: 'int-1',
      businessName: 'Himalayan Nutraceuticals Pvt Ltd',
      date: '2026-10-24',
      problemType: 'Sales & Distributor Margin Tracking',
      currentWorkaround: 'Sales coordinator merges 45 Excel sheets manually every month',
      frequency: 'Monthly (5 days wasted)',
      willingnessToPay: 'Yes',
      priceRangeMentioned: '₹5,000 – ₹7,000 per project',
      trustConcerns: 'Wanted stockist names anonymized before students see data',
      createdAt: '2026-10-24T17:00:00.000Z',
    },
    {
      id: 'int-2',
      businessName: 'Doon Precision Packaging',
      date: '2026-10-27',
      problemType: 'Competitor Pricing & B2B Lead Mapping',
      currentWorkaround: 'Owner asks existing sales staff or postpones market checks',
      frequency: 'Quarterly',
      willingnessToPay: 'Yes',
      priceRangeMentioned: '₹4,500 – ₹6,000 per project',
      trustConcerns: 'Concerned about rate card confidentiality and deadline reliability',
      createdAt: '2026-10-27T16:30:00.000Z',
    },
    {
      id: 'int-3',
      businessName: 'Shivalik Agro Foods',
      date: '2026-11-01',
      problemType: 'Customer Survey & Digital Marketing Plan',
      currentWorkaround: 'Posting sporadically on Instagram without customer data',
      frequency: 'One-time / Seasonal',
      willingnessToPay: 'Maybe',
      priceRangeMentioned: '₹3,500 – ₹5,000',
      trustConcerns: 'Wanted structured milestones before paying upfront',
      createdAt: '2026-11-01T14:00:00.000Z',
    },
    {
      id: 'int-4',
      businessName: 'Garhwal MedTech Consumables',
      date: '2026-11-09',
      problemType: 'Inventory Reorder & Expiry Tracking',
      currentWorkaround: 'Tally export + manual physical stock register',
      frequency: 'Weekly',
      willingnessToPay: 'Yes',
      priceRangeMentioned: '₹5,000',
      trustConcerns: 'Prefers on-site Selaqui kickoff meeting with team lead',
      createdAt: '2026-11-09T11:00:00.000Z',
    },
  ];

  const messages: ProjectMessage[] = [
    {
      id: 'msg-1',
      projectId: 'proj-1',
      senderId: 'user-admin-1',
      senderName: 'Soumya (Admin)',
      senderRole: 'admin',
      body: 'Charter approved by Rajesh ji! Rohan (Team Lead) and Aarav, please confirm receipt of the anonymized stockist sheets.',
      createdAt: '2026-11-02T14:15:00.000Z',
    },
    {
      id: 'msg-2',
      projectId: 'proj-1',
      senderId: 'user-stu-3',
      senderName: 'Rohan Joshi',
      senderRole: 'student',
      body: 'Received the 6-month CSV files. We found duplicate SKU codes in April and standardized them—draft dashboard uploaded!',
      createdAt: '2026-11-16T15:35:00.000Z',
    },
    {
      id: 'msg-3',
      projectId: 'proj-3',
      senderId: 'user-biz-3',
      senderName: 'Vikram Bisht',
      senderRole: 'business',
      body: 'Shared updated wholesale rate sheet and 3 product photos. Looking forward to the Jakhan survey insights.',
      createdAt: '2026-11-08T10:30:00.000Z',
    },
  ];

  const notifications: Notification[] = [
    {
      id: 'notif-1',
      userId: 'user-biz-1',
      title: 'Deliverable ready for review',
      body: 'Rohan Joshi uploaded "Himalayan Nutraceuticals — Stockist Margin & SKU Velocity Workbook".',
      link: '/projects/proj-1',
      read: false,
      createdAt: '2026-11-16T15:32:00.000Z',
    },
    {
      id: 'notif-2',
      userId: 'user-admin-1',
      title: 'New project problem submitted',
      body: 'Doon Precision Packaging submitted "Kraft Paper Procurement & Scrap Variance Cost Analysis".',
      link: '/projects/proj-4',
      read: false,
      createdAt: '2026-11-18T14:01:00.000Z',
    },
    {
      id: 'notif-3',
      userId: 'user-stu-2',
      title: 'Charter approved — In Progress',
      body: 'Shivalik Agro Foods approved the charter for "Dehradun Retail Customer Survey & Local Digital Marketing Plan".',
      link: '/projects/proj-3',
      read: true,
      createdAt: '2026-11-06T12:05:00.000Z',
    },
  ];

  const discoveryBookings: DiscoveryBooking[] = [
    {
      id: 'book-1',
      businessName: 'Garhwal MedTech Consumables',
      contactName: 'Sandeep Rawal',
      phone: '+91 98374 55110',
      email: 'sandeep@garhwalmedtech.in',
      preferredSlot: 'Tomorrow, 11:30 AM IST',
      topic: 'Inventory reorder & batch expiry Excel tracker',
      createdAt: now,
    },
  ];

  return {
    users,
    sessions: {},
    businesses,
    students,
    projects,
    charters,
    deliverables,
    feedbacks,
    leads,
    interviews,
    messages,
    notifications,
    discoveryBookings,
    financialAssumptions: {
      avgProjectValue: 5000,
      commissionPct: 20,
      variableCostPerProject: 250,
      monthlyFixedCost: 15000,
      projectedMonthlyProjects: 10,
    },
  };
}
