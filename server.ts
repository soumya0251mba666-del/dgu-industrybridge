import crypto from 'node:crypto';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  calculateCharterFinancials,
  validateEmailFormat,
  validateProblemSubmission,
  validateStudentEmail,
} from './src/utils/domain';
import type {
  AvailabilityStatus,
  BusinessLocation,
  Deliverable,
  LeadStage,
  Project,
  ProjectCharter,
  ProjectFeedback,
  ProjectStatus,
  StudentProfile,
  User,
  UserRole,
  WorkspaceSnapshot,
} from './src/types/models';
import { hashPassword, verifyPassword, type StoredUser } from './server/seed';
import { loadDb, saveDb } from './server/store';

interface AuthedRequest extends Request {
  authUser?: StoredUser;
  authToken?: string;
}

function toPublicUser(u: StoredUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  };
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const db = loadDb();
  const userId = db.sessions[token];
  const user = userId ? db.users.find((u) => u.id === userId) : undefined;
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  req.authUser = user;
  req.authToken = token;
  next();
}

function requireRole(...roles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      res.status(403).json({ error: 'You do not have permission for this action.' });
      return;
    }
    next();
  };
}

function addNotification(
  userId: string,
  title: string,
  body: string,
  link?: string
) {
  const db = loadDb();
  db.notifications.unshift({
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    userId,
    title,
    body,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

function buildRoleWorkspace(user: StoredUser): WorkspaceSnapshot {
  const db = loadDb();
  const userNotifs = db.notifications.filter((n) => n.userId === user.id);

  if (user.role === 'admin') {
    return {
      businesses: db.businesses,
      students: db.students,
      projects: db.projects,
      charters: db.charters,
      deliverables: db.deliverables,
      feedbacks: db.feedbacks,
      leads: db.leads,
      interviews: db.interviews,
      messages: db.messages,
      notifications: userNotifs,
      discoveryBookings: db.discoveryBookings,
      financialAssumptions: db.financialAssumptions,
    };
  }

  if (user.role === 'business') {
    const myBusinesses = db.businesses.filter((b) => b.userId === user.id);
    const myProjects = db.projects.filter((p) => p.businessUserId === user.id);
    const myProjectIds = new Set(myProjects.map((p) => p.id));
    const assignedStudentIds = new Set(myProjects.flatMap((p) => p.assignedStudentIds));

    // Only expose assigned student summaries (PII minimized: hide student phone unless matched)
    const relevantStudents = db.students
      .filter((s) => assignedStudentIds.has(s.id))
      .map((s) => ({ ...s, phone: '' }));

    return {
      businesses: myBusinesses,
      students: relevantStudents,
      projects: myProjects,
      charters: db.charters.filter((c) => myProjectIds.has(c.projectId)),
      deliverables: db.deliverables.filter((d) => myProjectIds.has(d.projectId)),
      feedbacks: db.feedbacks.filter((f) => myProjectIds.has(f.projectId)),
      leads: [],
      interviews: [],
      messages: db.messages.filter((m) => myProjectIds.has(m.projectId)),
      notifications: userNotifs,
      discoveryBookings: [],
      financialAssumptions: db.financialAssumptions,
    };
  }

  // Student role
  const myProfile = db.students.find((s) => s.userId === user.id);
  const myStudentId = myProfile?.id;
  const myProjects = myStudentId
    ? db.projects.filter((p) => p.assignedStudentIds.includes(myStudentId))
    : [];
  const myProjectIds = new Set(myProjects.map((p) => p.id));
  const teammateIds = new Set(myProjects.flatMap((p) => p.assignedStudentIds));
  if (myStudentId) teammateIds.add(myStudentId);

  const visibleStudents = db.students.filter((s) => teammateIds.has(s.id));

  return {
    businesses: [],
    students: visibleStudents,
    projects: myProjects,
    charters: db.charters.filter((c) => myProjectIds.has(c.projectId)),
    deliverables: db.deliverables.filter((d) => myProjectIds.has(d.projectId)),
    feedbacks: [],
    leads: [],
    interviews: [],
    messages: db.messages.filter((m) => myProjectIds.has(m.projectId)),
    notifications: userNotifs,
    discoveryBookings: [],
    financialAssumptions: db.financialAssumptions,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Public non-PII summary for landing page
  app.get('/api/public/summary', (_req, res) => {
    const db = loadDb();
    const publicTestimonials = db.feedbacks.map((f) => ({
      id: f.id,
      businessName: f.businessName,
      testimonial: f.testimonial,
      usefulness: f.usefulness,
      onTime: f.onTime,
    }));
    res.json({
      stats: {
        activeStudents: db.students.length,
        partnerBusinesses: db.businesses.length,
        projectsCompletedOrActive: db.projects.length,
      },
      testimonials: publicTestimonials,
    });
  });

  // Public 15-minute discovery booking
  app.post('/api/public/discovery-booking', (req, res) => {
    const { businessName, contactName, phone, email, preferredSlot, topic } = req.body || {};
    if (!businessName?.trim() || !contactName?.trim() || !phone?.trim() || !validateEmailFormat(email || '')) {
      res.status(400).json({ error: 'Please complete business name, contact name, phone, and a valid email.' });
      return;
    }
    const db = loadDb();
    const booking = {
      id: `book-${crypto.randomUUID().slice(0, 8)}`,
      businessName: businessName.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      preferredSlot: (preferredSlot || 'Flexible weekday slot').trim(),
      topic: (topic || 'General business problem discussion').trim(),
      createdAt: new Date().toISOString(),
    };
    db.discoveryBookings.unshift(booking);
    const admin = db.users.find((u) => u.role === 'admin');
    if (admin) {
      addNotification(
        admin.id,
        'New 15-min discussion booked',
        `${booking.contactName} (${booking.businessName}) requested ${booking.preferredSlot}.`,
        '/admin'
      );
    }
    saveDb(db);
    res.status(201).json({ booking });
  });

  // Auth routes
  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, role, businessName, phone, location, industry, enrollmentNumber, programBatch } =
      req.body || {};

    if (!name?.trim() || !validateEmailFormat(email || '') || !password || password.length < 6) {
      res.status(400).json({ error: 'Name, valid email, and password (6+ chars) are required.' });
      return;
    }
    if (role !== 'business' && role !== 'student') {
      res.status(400).json({ error: 'Select Business or Student role. Admin accounts are set manually.' });
      return;
    }
    if (role === 'student' && !validateStudentEmail(email)) {
      res.status(400).json({ error: 'Students must sign up using an official @dgu.ac.in email address.' });
      return;
    }

    const db = loadDb();
    const normalizedEmail = email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const now = new Date().toISOString();
    const userId = `user-${crypto.randomUUID().slice(0, 8)}`;
    const newUser: StoredUser = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role,
      createdAt: now,
    };
    db.users.push(newUser);

    if (role === 'business') {
      const bizId = `biz-${crypto.randomUUID().slice(0, 8)}`;
      db.businesses.push({
        id: bizId,
        userId,
        businessName: (businessName || `${name.trim()}'s Enterprise`).trim(),
        ownerName: name.trim(),
        phone: (phone || '').trim(),
        email: normalizedEmail,
        location: location === 'Other Dehradun' ? 'Other Dehradun' : 'Selaqui',
        industry: (industry || 'Local SME').trim(),
        createdAt: now,
      });
    } else {
      const stuId = `stu-${crypto.randomUUID().slice(0, 8)}`;
      const stuProfile: StudentProfile = {
        id: stuId,
        userId,
        name: name.trim(),
        enrollmentNumber: (enrollmentNumber || 'DGU-NEW').trim(),
        programBatch: (programBatch || 'MBA · Batch 2025–27').trim(),
        email: normalizedEmail,
        phone: (phone || '').trim(),
        skills: [
          { name: 'Market Research', proficiency: 'Intermediate' },
          { name: 'Excel', proficiency: 'Intermediate' },
        ],
        pastProjects: '',
        portfolioUrl: '',
        weeklyHours: 10,
        availabilityStatus: 'Available',
        createdAt: now,
      };
      db.students.push(stuProfile);
    }

    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = userId;
    saveDb(db);
    res.status(201).json({ token, user: toPublicUser(newUser) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const db = loadDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = user.id;
    saveDb(db);
    res.json({ token, user: toPublicUser(user) });
  });

  // One-click demo account login for evaluation/demo convenience
  app.post('/api/auth/demo-login', (req, res) => {
    const { role } = req.body || {};
    const db = loadDb();
    let targetEmail = '';
    if (role === 'admin') targetEmail = 'soumya.0251mba666@dgu.ac.in';
    else if (role === 'business') targetEmail = 'rajesh@himalayanherbs.in';
    else if (role === 'business2') targetEmail = 'anita@doonprecision.in';
    else if (role === 'student') targetEmail = 'aarav.0251mba101@dgu.ac.in';
    else if (role === 'student2') targetEmail = 'priya.0251mba104@dgu.ac.in';
    else {
      res.status(400).json({ error: 'Invalid demo role requested.' });
      return;
    }
    const user = db.users.find((u) => u.email === targetEmail);
    if (!user) {
      res.status(404).json({ error: 'Demo user not found.' });
      return;
    }
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = user.id;
    saveDb(db);
    res.json({ token, user: toPublicUser(user) });
  });

  app.post('/api/auth/logout', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    if (req.authToken) {
      delete db.sessions[req.authToken];
      saveDb(db);
    }
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: toPublicUser(req.authUser!) });
  });

  app.get('/api/workspace', requireAuth, (req: AuthedRequest, res) => {
    const snapshot = buildRoleWorkspace(req.authUser!);
    res.json(snapshot);
  });

  // Business submits a new problem
  app.post('/api/projects', requireAuth, requireRole('business', 'admin'), (req: AuthedRequest, res) => {
    const body = req.body || {};
    const errors = validateProblemSubmission({
      businessName: body.businessName || '',
      contactName: body.contactName || '',
      phone: body.phone || '',
      email: body.email || '',
      location: body.location || 'Selaqui',
      industry: body.industry || '',
      title: body.title || '',
      description: body.description || '',
      category: body.category || 'Other',
      expectedOutcome: body.expectedOutcome || '',
      requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills : [],
      timeline: body.timeline || '2 weeks',
      budgetMin: Number(body.budgetMin) || 0,
      budgetMax: Number(body.budgetMax) || 0,
    });

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: Object.values(errors)[0], errors });
      return;
    }

    const db = loadDb();
    const now = new Date().toISOString();
    let biz = db.businesses.find((b) => b.userId === req.authUser!.id);
    if (!biz) {
      biz = {
        id: `biz-${crypto.randomUUID().slice(0, 8)}`,
        userId: req.authUser!.id,
        businessName: body.businessName.trim(),
        ownerName: body.contactName.trim(),
        phone: body.phone.trim(),
        email: body.email.trim(),
        location: (body.location === 'Other Dehradun' ? 'Other Dehradun' : 'Selaqui') as BusinessLocation,
        industry: body.industry.trim(),
        createdAt: now,
      };
      db.businesses.push(biz);
    }

    const project: Project = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      businessId: biz.id,
      businessUserId: req.authUser!.id,
      businessName: body.businessName.trim(),
      contactName: body.contactName.trim(),
      phone: body.phone.trim(),
      email: body.email.trim(),
      location: body.location === 'Other Dehradun' ? 'Other Dehradun' : 'Selaqui',
      industry: body.industry.trim(),
      title: body.title.trim(),
      description: body.description.trim(),
      category: body.category,
      expectedOutcome: body.expectedOutcome.trim(),
      requiredSkills: body.requiredSkills,
      timeline: body.timeline,
      budgetMin: Number(body.budgetMin),
      budgetMax: Number(body.budgetMax),
      dataAvailability: body.dataAvailability || 'Partial',
      confidentialityNotes: (body.confidentialityNotes || '').trim(),
      status: 'Submitted',
      assignedStudentIds: [],
      studentResponses: {},
      createdAt: now,
      updatedAt: now,
    };
    db.projects.unshift(project);

    const admin = db.users.find((u) => u.role === 'admin');
    if (admin) {
      addNotification(
        admin.id,
        'New business problem submitted',
        `${project.businessName} submitted "${project.title}".`,
        `/projects/${project.id}`
      );
    }

    saveDb(db);
    res.status(201).json({ project });
  });

  // Student updates own profile
  app.put('/api/students/me', requireAuth, requireRole('student'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const student = db.students.find((s) => s.userId === req.authUser!.id);
    if (!student) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }
    const {
      name,
      enrollmentNumber,
      programBatch,
      phone,
      skills,
      pastProjects,
      portfolioUrl,
      weeklyHours,
      availabilityStatus,
    } = req.body || {};

    if (!name?.trim() || !enrollmentNumber?.trim() || !programBatch?.trim()) {
      res.status(400).json({ error: 'Name, enrollment number, and program/batch are required.' });
      return;
    }

    student.name = name.trim();
    student.enrollmentNumber = enrollmentNumber.trim();
    student.programBatch = programBatch.trim();
    student.phone = (phone || '').trim();
    student.skills = Array.isArray(skills) ? skills.slice(0, 15) : student.skills;
    student.pastProjects = (pastProjects || '').trim();
    student.portfolioUrl = (portfolioUrl || '').trim();
    student.weeklyHours = Math.max(1, Math.min(40, Number(weeklyHours) || 10));
    student.availabilityStatus = (availabilityStatus === 'Busy' ? 'Busy' : 'Available') as AvailabilityStatus;

    req.authUser!.name = student.name;
    saveDb(db);
    res.json({ student });
  });

  // Admin manually matches 1-4 students + team lead to a project
  app.post('/api/projects/:id/assign', requireAuth, requireRole('admin'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const { studentIds, teamLeadId } = req.body || {};
    if (!Array.isArray(studentIds) || studentIds.length < 1 || studentIds.length > 4) {
      res.status(400).json({ error: 'Select between 1 and 4 students for the team.' });
      return;
    }
    if (!teamLeadId || !studentIds.includes(teamLeadId)) {
      res.status(400).json({ error: 'Choose one selected student as Team Lead.' });
      return;
    }

    const validStudents = db.students.filter((s) => studentIds.includes(s.id));
    if (validStudents.length !== studentIds.length) {
      res.status(400).json({ error: 'One or more selected students could not be found.' });
      return;
    }

    project.assignedStudentIds = studentIds;
    project.teamLeadId = teamLeadId;
    const nextResponses: Record<string, 'Pending' | 'Accepted' | 'Declined'> = {};
    for (const sid of studentIds) {
      nextResponses[sid] = project.studentResponses[sid] === 'Accepted' ? 'Accepted' : 'Pending';
    }
    project.studentResponses = nextResponses;
    if (project.status === 'Submitted' || project.status === 'Under Review') {
      project.status = 'Matched';
    }
    project.updatedAt = new Date().toISOString();

    for (const stu of validStudents) {
      addNotification(
        stu.userId,
        stu.id === teamLeadId ? 'Assigned as Team Lead' : 'Matched to a new project',
        `You were matched to "${project.title}" for ${project.businessName}. Please Accept or Decline.`,
        `/projects/${project.id}`
      );
    }
    addNotification(
      project.businessUserId,
      'Student team matched',
      `A DGU student team (${validStudents.map((s) => s.name).join(', ')}) was matched to "${project.title}".`,
      `/projects/${project.id}`
    );

    saveDb(db);
    res.json({ project });
  });

  // Student accepts or declines a project assignment
  app.post('/api/projects/:id/respond', requireAuth, requireRole('student'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const project = db.projects.find((p) => p.id === req.params.id);
    const student = db.students.find((s) => s.userId === req.authUser!.id);
    if (!project || !student) {
      res.status(404).json({ error: 'Project or student profile not found.' });
      return;
    }
    if (!project.assignedStudentIds.includes(student.id)) {
      res.status(403).json({ error: 'You are not assigned to this project.' });
      return;
    }
    const { response } = req.body || {};
    if (response !== 'Accepted' && response !== 'Declined') {
      res.status(400).json({ error: 'Response must be Accepted or Declined.' });
      return;
    }

    project.studentResponses[student.id] = response;
    project.updatedAt = new Date().toISOString();

    const admin = db.users.find((u) => u.role === 'admin');
    if (admin) {
      addNotification(
        admin.id,
        `Team member ${response.toLowerCase()} assignment`,
        `${student.name} ${response.toLowerCase()} "${project.title}".`,
        `/projects/${project.id}`
      );
    }

    saveDb(db);
    res.json({ project });
  });

  // Admin creates or updates Project Charter
  app.put('/api/projects/:id/charter', requireAuth, requireRole('admin'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const {
      scopeSummary,
      inScope,
      outOfScope,
      deliverables,
      milestones,
      totalFeeInr,
      commissionPct,
      businessResponsibilities,
      studentResponsibilities,
    } = req.body || {};

    if (!scopeSummary?.trim() || !Array.isArray(deliverables) || deliverables.length === 0) {
      res.status(400).json({ error: 'Scope summary and at least one deliverable are required.' });
      return;
    }

    const fin = calculateCharterFinancials(Number(totalFeeInr), Number(commissionPct ?? 20));
    if (fin.totalFeeInr <= 0) {
      res.status(400).json({ error: 'Total project fee must be greater than ₹0.' });
      return;
    }

    const now = new Date().toISOString();
    let charter = db.charters.find((c) => c.projectId === project.id);
    if (!charter) {
      charter = {
        id: `charter-${crypto.randomUUID().slice(0, 8)}`,
        projectId: project.id,
        scopeSummary: scopeSummary.trim(),
        inScope: Array.isArray(inScope) ? inScope : [],
        outOfScope: Array.isArray(outOfScope) ? outOfScope : [],
        deliverables,
        milestones: Array.isArray(milestones) ? milestones : [],
        totalFeeInr: fin.totalFeeInr,
        commissionPct: fin.commissionPct,
        studentPayoutInr: fin.studentPayoutInr,
        businessResponsibilities: (businessResponsibilities || '').trim(),
        studentResponsibilities: (studentResponsibilities || '').trim(),
        approvedByBusiness: false,
        updatedAt: now,
      };
      db.charters.push(charter);
    } else {
      charter.scopeSummary = scopeSummary.trim();
      charter.inScope = Array.isArray(inScope) ? inScope : [];
      charter.outOfScope = Array.isArray(outOfScope) ? outOfScope : [];
      charter.deliverables = deliverables;
      charter.milestones = Array.isArray(milestones) ? milestones : [];
      charter.totalFeeInr = fin.totalFeeInr;
      charter.commissionPct = fin.commissionPct;
      charter.studentPayoutInr = fin.studentPayoutInr;
      charter.businessResponsibilities = (businessResponsibilities || '').trim();
      charter.studentResponsibilities = (studentResponsibilities || '').trim();
      charter.updatedAt = now;
    }

    addNotification(
      project.businessUserId,
      'Project Charter ready for approval',
      `Review and approve the charter for "${project.title}" (Total fee: ₹${fin.totalFeeInr.toLocaleString('en-IN')}).`,
      `/projects/${project.id}/charter`
    );

    saveDb(db);
    res.json({ charter });
  });

  // Business approves Project Charter
  app.post('/api/projects/:id/charter/approve', requireAuth, requireRole('business', 'admin'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const project = db.projects.find((p) => p.id === req.params.id);
    const charter = db.charters.find((c) => c.projectId === req.params.id);
    if (!project || !charter) {
      res.status(404).json({ error: 'Project or Charter not found.' });
      return;
    }
    if (req.authUser!.role === 'business' && project.businessUserId !== req.authUser!.id) {
      res.status(403).json({ error: 'Only the project owner business can approve this charter.' });
      return;
    }

    const now = new Date().toISOString();
    charter.approvedByBusiness = true;
    charter.approvedAt = now;
    charter.updatedAt = now;
    if (['Submitted', 'Under Review', 'Matched'].includes(project.status)) {
      project.status = 'In Progress';
    }
    project.updatedAt = now;

    // Notify admin & assigned students
    const admin = db.users.find((u) => u.role === 'admin');
    if (admin) {
      addNotification(
        admin.id,
        'Charter approved by business',
        `${project.businessName} approved the charter for "${project.title}". Work is now In Progress.`,
        `/projects/${project.id}`
      );
    }
    for (const sid of project.assignedStudentIds) {
      const stu = db.students.find((s) => s.id === sid);
      if (stu) {
        addNotification(
          stu.userId,
          'Charter approved — start work',
          `${project.businessName} approved the charter for "${project.title}".`,
          `/projects/${project.id}`
        );
      }
    }

    saveDb(db);
    res.json({ charter, project });
  });

  // Admin updates project status or records payment
  app.patch('/api/projects/:id/status', requireAuth, requireRole('admin'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const { status, paymentRef, paidAmount } = req.body || {};
    if (!status) {
      res.status(400).json({ error: 'Target status is required.' });
      return;
    }

    if (status === 'Paid') {
      if (!paymentRef?.trim()) {
        res.status(400).json({ error: 'Enter a manual payment reference number to mark Paid.' });
        return;
      }
      const charter = db.charters.find((c) => c.projectId === project.id);
      project.paymentRef = paymentRef.trim();
      project.paidAmount = Number(paidAmount) || charter?.totalFeeInr || project.budgetMax;
      project.paidAt = new Date().toISOString();
    }

    project.status = status as ProjectStatus;
    project.updatedAt = new Date().toISOString();

    addNotification(
      project.businessUserId,
      `Project status: ${project.status}`,
      `"${project.title}" moved to ${project.status}.`,
      `/projects/${project.id}`
    );

    saveDb(db);
    res.json({ project });
  });

  // Student submits a deliverable (file upload or external link)
  app.post('/api/projects/:id/deliverables', requireAuth, requireRole('student', 'admin'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    if (req.authUser!.role === 'student') {
      const stu = db.students.find((s) => s.userId === req.authUser!.id);
      if (!stu || !project.assignedStudentIds.includes(stu.id)) {
        res.status(403).json({ error: 'Only assigned team members can submit deliverables.' });
        return;
      }
    }

    const { title, notes, fileType, fileName, fileDataUrl, externalUrl } = req.body || {};
    if (!title?.trim()) {
      res.status(400).json({ error: 'Deliverable title is required.' });
      return;
    }
    if (!fileDataUrl && !externalUrl?.trim()) {
      res.status(400).json({ error: 'Upload a file (PDF/Excel/PPT) or paste a deliverable link.' });
      return;
    }

    const now = new Date().toISOString();
    const deliv: Deliverable = {
      id: `deliv-${crypto.randomUUID().slice(0, 8)}`,
      projectId: project.id,
      submittedByUserId: req.authUser!.id,
      submittedByName: req.authUser!.name,
      title: title.trim(),
      notes: (notes || '').trim(),
      fileType: fileType || 'Link',
      fileName: fileName?.trim(),
      fileDataUrl,
      externalUrl: externalUrl?.trim(),
      status: 'Pending Review',
      createdAt: now,
      updatedAt: now,
    };
    db.deliverables.unshift(deliv);

    if (['Charter Approved', 'In Progress', 'Matched'].includes(project.status)) {
      project.status = 'Delivered';
      project.updatedAt = now;
    }

    addNotification(
      project.businessUserId,
      'Deliverable submitted for review',
      `${req.authUser!.name} uploaded "${deliv.title}" for "${project.title}".`,
      `/projects/${project.id}`
    );
    const admin = db.users.find((u) => u.role === 'admin');
    if (admin) {
      addNotification(
        admin.id,
        'Deliverable uploaded',
        `${req.authUser!.name} uploaded "${deliv.title}" on "${project.title}".`,
        `/projects/${project.id}`
      );
    }

    saveDb(db);
    res.status(201).json({ deliverable: deliv, project });
  });

  // Business approves or requests revisions on a deliverable
  app.patch('/api/deliverables/:id/review', requireAuth, requireRole('business', 'admin'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const deliv = db.deliverables.find((d) => d.id === req.params.id);
    if (!deliv) {
      res.status(404).json({ error: 'Deliverable not found.' });
      return;
    }
    const project = db.projects.find((p) => p.id === deliv.projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    if (req.authUser!.role === 'business' && project.businessUserId !== req.authUser!.id) {
      res.status(403).json({ error: 'Only the project business owner can review this deliverable.' });
      return;
    }

    const { status, reviewComment } = req.body || {};
    if (status !== 'Approved' && status !== 'Revision Requested') {
      res.status(400).json({ error: 'Review status must be Approved or Revision Requested.' });
      return;
    }

    const now = new Date().toISOString();
    deliv.status = status;
    deliv.reviewComment = (reviewComment || '').trim();
    deliv.updatedAt = now;

    if (status === 'Revision Requested') {
      project.status = 'In Progress';
      project.updatedAt = now;
    }

    for (const sid of project.assignedStudentIds) {
      const stu = db.students.find((s) => s.id === sid);
      if (stu) {
        addNotification(
          stu.userId,
          `Deliverable ${status}`,
          `${project.businessName} marked "${deliv.title}" as ${status}.`,
          `/projects/${project.id}`
        );
      }
    }

    saveDb(db);
    res.json({ deliverable: deliv, project });
  });

  // Business submits post-delivery feedback
  app.post('/api/projects/:id/feedback', requireAuth, requireRole('business', 'admin'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    if (req.authUser!.role === 'business' && project.businessUserId !== req.authUser!.id) {
      res.status(403).json({ error: 'Only the project owner can submit feedback.' });
      return;
    }
    if (db.feedbacks.some((f) => f.projectId === project.id)) {
      res.status(409).json({ error: 'Feedback has already been submitted for this project.' });
      return;
    }

    const { usefulness, onTime, quality, wouldPayAgain, nps, comments, testimonial } = req.body || {};
    const useVal = Number(usefulness);
    const qualVal = Number(quality);
    const npsVal = Number(nps);

    if (useVal < 1 || useVal > 5 || qualVal < 1 || qualVal > 5 || npsVal < 0 || npsVal > 10) {
      res.status(400).json({ error: 'Usefulness/Quality must be 1–5 and NPS must be 0–10.' });
      return;
    }

    const fb: ProjectFeedback = {
      id: `fb-${crypto.randomUUID().slice(0, 8)}`,
      projectId: project.id,
      businessId: project.businessId,
      businessName: project.businessName,
      usefulness: useVal,
      onTime: Boolean(onTime),
      quality: qualVal,
      wouldPayAgain: Boolean(wouldPayAgain),
      nps: npsVal,
      comments: (comments || '').trim(),
      testimonial: (testimonial || '').trim(),
      createdAt: new Date().toISOString(),
    };
    db.feedbacks.unshift(fb);

    if (project.status === 'Delivered') {
      project.status = 'Feedback Collected';
      project.updatedAt = new Date().toISOString();
    }

    const admin = db.users.find((u) => u.role === 'admin');
    if (admin) {
      addNotification(
        admin.id,
        'Business feedback collected',
        `${project.businessName} rated "${project.title}" ${fb.usefulness}/5 (NPS ${fb.nps}).`,
        `/projects/${project.id}/feedback`
      );
    }

    saveDb(db);
    res.status(201).json({ feedback: fb, project });
  });

  // Project messages thread (business <-> admin <-> assigned student team)
  app.post('/api/projects/:id/messages', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const user = req.authUser!;
    if (user.role === 'business' && project.businessUserId !== user.id) {
      res.status(403).json({ error: 'Not authorized for this project thread.' });
      return;
    }
    if (user.role === 'student') {
      const stu = db.students.find((s) => s.userId === user.id);
      if (!stu || !project.assignedStudentIds.includes(stu.id)) {
        res.status(403).json({ error: 'Only assigned team members can post in this thread.' });
        return;
      }
    }

    const { body } = req.body || {};
    if (!body?.trim()) {
      res.status(400).json({ error: 'Message text cannot be empty.' });
      return;
    }

    const msg = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      projectId: project.id,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };
    db.messages.push(msg);

    // Notify other participants
    const participantUserIds = new Set<string>([project.businessUserId]);
    const admin = db.users.find((u) => u.role === 'admin');
    if (admin) participantUserIds.add(admin.id);
    for (const sid of project.assignedStudentIds) {
      const s = db.students.find((st) => st.id === sid);
      if (s) participantUserIds.add(s.userId);
    }
    participantUserIds.delete(user.id);
    for (const uid of participantUserIds) {
      addNotification(
        uid,
        `New message on ${project.title}`,
        `${user.name}: ${msg.body.slice(0, 80)}`,
        `/projects/${project.id}`
      );
    }

    saveDb(db);
    res.status(201).json({ message: msg });
  });

  // Mark notification read
  app.patch('/api/notifications/:id/read', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const notif = db.notifications.find(
      (n) => n.id === req.params.id && n.userId === req.authUser!.id
    );
    if (notif) {
      notif.read = true;
      saveDb(db);
    }
    res.json({ ok: true });
  });

  app.post('/api/notifications/read-all', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    for (const n of db.notifications) {
      if (n.userId === req.authUser!.id) n.read = true;
    }
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: Leads management
  app.post('/api/admin/leads', requireAuth, requireRole('admin'), (req: AuthedRequest, res) => {
    const { businessName, contactName, phone, source, stage, notes } = req.body || {};
    if (!businessName?.trim() || !contactName?.trim()) {
      res.status(400).json({ error: 'Business name and contact name are required.' });
      return;
    }
    const db = loadDb();
    const lead = {
      id: `lead-${crypto.randomUUID().slice(0, 8)}`,
      businessName: businessName.trim(),
      contactName: contactName.trim(),
      phone: (phone || '').trim(),
      source: source || 'Direct outreach',
      stage: (stage || 'Contacted') as LeadStage,
      notes: (notes || '').trim(),
      createdAt: new Date().toISOString(),
    };
    db.leads.unshift(lead);
    saveDb(db);
    res.status(201).json({ lead });
  });

  app.patch('/api/admin/leads/:id', requireAuth, requireRole('admin'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const lead = db.leads.find((l) => l.id === req.params.id);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }
    const { stage, notes } = req.body || {};
    if (stage) lead.stage = stage as LeadStage;
    if (typeof notes === 'string') lead.notes = notes.trim();
    saveDb(db);
    res.json({ lead });
  });

  // Admin: Customer Discovery Interview Log
  app.post('/api/admin/interviews', requireAuth, requireRole('admin'), (req: AuthedRequest, res) => {
    const {
      businessName,
      date,
      problemType,
      currentWorkaround,
      frequency,
      willingnessToPay,
      priceRangeMentioned,
      trustConcerns,
    } = req.body || {};
    if (!businessName?.trim() || !problemType?.trim()) {
      res.status(400).json({ error: 'Business name and problem type are required.' });
      return;
    }
    const db = loadDb();
    const interview = {
      id: `int-${crypto.randomUUID().slice(0, 8)}`,
      businessName: businessName.trim(),
      date: date || new Date().toISOString().slice(0, 10),
      problemType: problemType.trim(),
      currentWorkaround: (currentWorkaround || '').trim(),
      frequency: (frequency || '').trim(),
      willingnessToPay: willingnessToPay || 'Maybe',
      priceRangeMentioned: (priceRangeMentioned || '').trim(),
      trustConcerns: (trustConcerns || '').trim(),
      createdAt: new Date().toISOString(),
    };
    db.interviews.unshift(interview);
    saveDb(db);
    res.status(201).json({ interview });
  });

  // Admin: Financial Assumptions
  app.put('/api/admin/financial-assumptions', requireAuth, requireRole('admin'), (req: AuthedRequest, res) => {
    const {
      avgProjectValue,
      commissionPct,
      variableCostPerProject,
      monthlyFixedCost,
      projectedMonthlyProjects,
    } = req.body || {};
    const db = loadDb();
    db.financialAssumptions = {
      avgProjectValue: Math.max(0, Number(avgProjectValue) || 0),
      commissionPct: Math.min(100, Math.max(0, Number(commissionPct) || 0)),
      variableCostPerProject: Math.max(0, Number(variableCostPerProject) || 0),
      monthlyFixedCost: Math.max(0, Number(monthlyFixedCost) || 0),
      projectedMonthlyProjects: Math.max(0, Number(projectedMonthlyProjects) || 0),
    };
    saveDb(db);
    res.json({ financialAssumptions: db.financialAssumptions });
  });

  // Vite dev middleware vs static dist
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`DGU IndustryBridge server listening on http://localhost:${port}`);
  });
}

startServer();
