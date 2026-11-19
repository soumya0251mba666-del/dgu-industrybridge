import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
} from 'lucide-react';
import type { User } from '../types/models';
import { api } from '../lib/api';

interface LandingPageProps {
  currentUser: User | null;
  publicStats: {
    activeStudents: number;
    partnerBusinesses: number;
    projectsCompletedOrActive: number;
  };
  testimonials: {
    id: string;
    businessName: string;
    testimonial: string;
    usefulness: number;
    onTime: boolean;
  }[];
  onNavigate: (path: string) => void;
}

const EXAMPLE_PROJECTS = [
  {
    code: '01',
    title: 'Market & Competitor Study',
    scope: 'Map 20–30 local buyers or benchmark 5–8 competitors across Selaqui & Dehradun with pricing tiers.',
    timeline: '2 weeks · ₹4,500–₹6,000',
  },
  {
    code: '02',
    title: 'Excel & Power BI Dashboards',
    scope: 'Clean monthly distributor Excel sheets into automated margin, SKU velocity, and slow-mover alerts.',
    timeline: '2 weeks · ₹5,000–₹7,000',
  },
  {
    code: '03',
    title: 'Customer Surveys & Insights',
    scope: 'Run 50–100 structured retail or B2B buyer interviews to test pricing, packaging, or repeat buying.',
    timeline: '2–3 weeks · ₹4,000–₹5,500',
  },
  {
    code: '04',
    title: 'Financial & Cost Analysis',
    scope: 'Analyze raw-material scrap variance, working-capital cycles, or SKU-level contribution margins.',
    timeline: '2 weeks · ₹5,000–₹6,500',
  },
  {
    code: '05',
    title: 'Sales Pipeline & Territory Review',
    scope: 'Audit stockist coverage, secondary sales drop-offs, and dealer onboarding conversion.',
    timeline: '1–2 weeks · ₹4,000–₹5,000',
  },
  {
    code: '06',
    title: 'Digital Marketing & WhatsApp Playbooks',
    scope: 'Build a practical 30-day catalog, Google Business, and local B2B/D2C outreach calendar.',
    timeline: '2 weeks · ₹3,500–₹5,000',
  },
];

const FAQS = [
  {
    q: 'What kind of work can DGU student teams take on?',
    a: 'Only structured, non-regulated short-term business work: market research, customer surveys, competitor analysis, sales analysis, financial/cost analysis using business-provided data, digital marketing plans, Excel/Power BI dashboards, and process analysis.',
  },
  {
    q: 'How are students matched to my business problem?',
    a: 'Matching is reviewed manually by the IndustryBridge coordinator—never left to an automated feed. We check skill fit, coursework, availability, and select a 1–4 student team with an assigned Team Lead before sharing a written Project Charter.',
  },
  {
    q: 'When do we commit or pay?',
    a: 'Nothing starts until you review and click "Approve Charter" covering exact scope, exclusions, milestones, deliverables, and total INR fee. For this pilot stage, payments are settled offline via UPI/bank transfer after delivery and recorded with a reference number.',
  },
  {
    q: 'How is business data kept confidential?',
    a: 'Every project form includes confidentiality notes. Businesses can share anonymized customer/stockist IDs, and all charter agreements explicitly bind the assigned DGU student team to data confidentiality.',
  },
  {
    q: 'Who can join as a student?',
    a: 'Currently open to DBS Global University (DGU) students, primarily MBA candidates across Finance, Marketing, Analytics, Operations, and HR. A valid @dgu.ac.in email is required at signup.',
  },
];

export function LandingPage({
  currentUser,
  publicStats,
  testimonials,
  onNavigate,
}: LandingPageProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    preferredSlot: 'Weekday Morning (10:30 AM – 1:00 PM)',
    topic: '',
  });
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [bookingError, setBookingError] = useState('');

  const dashboardRoute = currentUser
    ? currentUser.role === 'admin'
      ? '/admin'
      : currentUser.role === 'business'
      ? '/business'
      : '/student'
    : '/auth';

  async function handleBookSubmit(e: FormEvent) {
    e.preventDefault();
    setBookingStatus('submitting');
    setBookingError('');
    try {
      await api.bookDiscoveryCall(bookingForm);
      setBookingStatus('success');
      setBookingForm({
        businessName: '',
        contactName: '',
        phone: '',
        email: '',
        preferredSlot: 'Weekday Morning (10:30 AM – 1:00 PM)',
        topic: '',
      });
    } catch (err) {
      setBookingStatus('error');
      setBookingError(err instanceof Error ? err.message : 'Unable to submit booking.');
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="text-lg font-bold tracking-tight text-[#0F2D52] whitespace-nowrap shrink-0"
          >
            DGU IndustryBridge
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600" aria-label="Primary">
            <a href="#how-it-works" className="hover:text-[#0F2D52] transition-colors whitespace-nowrap shrink-0">
              How It Works
            </a>
            <a href="#project-types" className="hover:text-[#0F2D52] transition-colors whitespace-nowrap shrink-0">
              Project Types
            </a>
            <a href="#faq" className="hover:text-[#0F2D52] transition-colors whitespace-nowrap shrink-0">
              FAQ
            </a>
            <button
              type="button"
              onClick={() => onNavigate(dashboardRoute)}
              className="hover:text-[#0F2D52] transition-colors whitespace-nowrap shrink-0"
            >
              {currentUser ? 'Dashboard' : 'Sign In'}
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                onNavigate(currentUser?.role === 'business' ? '/business' : '/auth?role=business&intent=post')
              }
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73] transition-colors whitespace-nowrap shrink-0"
            >
              Post a Problem
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <a
              href="#how-it-works"
              onClick={() => setMobileNavOpen(false)}
              className="block text-sm font-medium text-slate-700 py-1.5"
            >
              How It Works
            </a>
            <a
              href="#project-types"
              onClick={() => setMobileNavOpen(false)}
              className="block text-sm font-medium text-slate-700 py-1.5"
            >
              Project Types
            </a>
            <a
              href="#faq"
              onClick={() => setMobileNavOpen(false)}
              className="block text-sm font-medium text-slate-700 py-1.5"
            >
              FAQ
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  onNavigate(dashboardRoute);
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-[#0F2D52] border border-slate-300 rounded-lg"
              >
                {currentUser ? 'Open Dashboard' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  onNavigate('/auth?role=business&intent=post');
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#0F2D52] rounded-lg"
              >
                Post a Problem
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="top" className="border-b border-slate-200 bg-slate-50/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-xs font-medium text-teal-700 tracking-wide mb-3">
              DBS Global University · Selaqui &amp; Dehradun SME Network
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12] [text-wrap:balance]">
              Real business problems. Real student talent. Structured outcomes.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              DGU IndustryBridge pairs owner-led SMEs in Selaqui and nearby Dehradun with
              hand-matched DGU MBA student teams for 1–4 week, fixed-scope projects in market
              research, sales analysis, financial modeling, and Excel/Power BI dashboards.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  onNavigate(currentUser?.role === 'business' ? '/business' : '/auth?role=business&intent=post')
                }
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73] transition-colors whitespace-nowrap"
              >
                <span>Post a Problem</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onNavigate(currentUser?.role === 'student' ? '/student' : '/auth?role=student')
                }
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#0F2D52] bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <span>Join as a Student</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBookingStatus('idle');
                  setBookingOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-teal-800 hover:text-teal-950 underline underline-offset-4 whitespace-nowrap"
              >
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>Book a 15-minute discussion</span>
              </button>
            </div>
          </div>

          {/* Right Column: Structured Charter Preview Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Sample Pilot Structure · Selaqui Industrial Area
              </p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">
                How every pilot stays predictable
              </h2>
              <div className="mt-5 space-y-4 divide-y divide-slate-100">
                <div className="pt-1 flex items-baseline justify-between gap-4">
                  <span className="text-sm text-slate-600">Typical Pilot Budget</span>
                  <span className="text-base font-mono font-semibold text-slate-900 tabular-nums">
                    ₹4,500 – ₹6,500
                  </span>
                </div>
                <div className="pt-4 flex items-baseline justify-between gap-4">
                  <span className="text-sm text-slate-600">Project Duration</span>
                  <span className="text-base font-mono font-semibold text-slate-900 tabular-nums">
                    1 – 4 Weeks
                  </span>
                </div>
                <div className="pt-4 flex items-baseline justify-between gap-4">
                  <span className="text-sm text-slate-600">Matching Method</span>
                  <span className="text-sm font-semibold text-teal-700">
                    Manual Team Selection + Lead
                  </span>
                </div>
                <div className="pt-4 flex items-baseline justify-between gap-4">
                  <span className="text-sm text-slate-600">Scope Lock</span>
                  <span className="text-sm font-semibold text-slate-900">
                    Written Project Charter
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 tabular-nums">
              <span>{publicStats.partnerBusinesses} local SMEs</span>
              <span aria-hidden="true">·</span>
              <span>{publicStats.activeStudents} vetted DGU students</span>
              <span aria-hidden="true">·</span>
              <span>{publicStats.projectsCompletedOrActive} pilot projects</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Built for busy business owners and practical MBA learners
          </h2>
          <p className="mt-3 text-slate-600">
            No endless freelance bidding or unvetted resumes. One coordinator defines the scope,
            assigns a focused DGU team, and tracks every milestone.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-slate-200 rounded-xl p-6 bg-white">
            <h3 className="text-lg font-bold text-[#0F2D52]">For Businesses (Selaqui &amp; Dehradun)</h3>
            <ol className="mt-5 space-y-4">
              <li className="flex gap-3">
                <span className="font-mono text-xs font-semibold text-teal-700 pt-0.5">01.</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Describe one specific problem</p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Share your goal, timeline (1–4 weeks), data availability, and comfort budget in under 3 minutes.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-semibold text-teal-700 pt-0.5">02.</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Approve the written Project Charter</p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Review the assigned student team, deliverables, milestone dates, and exact INR fee before work starts.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-semibold text-teal-700 pt-0.5">03.</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Review deliverables &amp; share feedback</p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Approve the final Excel, PDF, or presentation deliverable or request revisions right inside your dashboard.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="border border-slate-200 rounded-xl p-6 bg-white">
            <h3 className="text-lg font-bold text-[#0F2D52]">For DGU Students</h3>
            <ol className="mt-5 space-y-4">
              <li className="flex gap-3">
                <span className="font-mono text-xs font-semibold text-teal-700 pt-0.5">01.</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Build your verified @dgu.ac.in profile</p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    List your skills (Finance, Excel, Power BI, Market Research), proficiency levels, and weekly hours.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-semibold text-teal-700 pt-0.5">02.</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Accept matched team invitations</p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Work in small 1–4 person squads with a designated Team Lead and a clear milestone charter.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-semibold text-teal-700 pt-0.5">03.</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Deliver real outcomes &amp; earn payout</p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Upload structured deliverables, receive client feedback, and receive 80% of the agreed project fee.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Example Project Types */}
      <section id="project-types" className="border-y border-slate-200 bg-slate-50/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Example Project Scopes
              </h2>
              <p className="mt-2 text-slate-600 max-w-2xl">
                Focused, non-regulated business work designed for 1–4 week turnarounds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/auth?role=business&intent=post')}
              className="text-sm font-semibold text-[#0F2D52] hover:text-teal-700 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Submit a custom scope</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXAMPLE_PROJECTS.map((item) => (
              <div
                key={item.code}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-mono font-semibold text-teal-700">
                    {item.code}.
                  </span>
                  <h3 className="mt-1 text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.scope}</p>
                </div>
                <p className="mt-5 pt-3 border-t border-slate-100 text-xs font-mono text-slate-500 tabular-nums">
                  {item.timeline}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pilot Evidence / Testimonials */}
      {testimonials.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Early Pilot Feedback</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div key={t.id} className="border border-slate-200 rounded-xl p-6 bg-white">
                <p className="text-slate-700 text-base leading-relaxed">“{t.testimonial}”</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">{t.businessName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">Usefulness {t.usefulness}/5</span>
                  <span aria-hidden="true">·</span>
                  <span>{t.onTime ? 'Delivered on time' : 'Completed'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Frequently Asked Questions
        </h2>
        <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
          {FAQS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={item.q} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 text-left py-1"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-slate-900">{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed pr-8">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#0F2D52]">DGU IndustryBridge</p>
            <p className="text-xs text-slate-500 mt-1">
              Selaqui &amp; Dehradun SME Project Exchange · DBS Global University
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs font-medium text-slate-600">
            <button type="button" onClick={() => setBookingOpen(true)} className="hover:text-[#0F2D52]">
              Book 15-min discussion
            </button>
            <button type="button" onClick={() => onNavigate('/auth')} className="hover:text-[#0F2D52]">
              Portal Sign In
            </button>
          </div>
        </div>
      </footer>

      {/* 15-Minute Discovery Booking Modal */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="booking-modal-title" className="text-lg font-bold text-slate-900">
                  Book a 15-minute discussion
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Identify one business problem that could be solved through a short-term DGU student project.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close booking dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingStatus === 'success' ? (
              <div className="mt-6 p-5 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex items-center gap-2 text-teal-800 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  <span>Discussion request received</span>
                </div>
                <p className="mt-2 text-sm text-teal-900">
                  Our IndustryBridge coordinator will message you on WhatsApp or phone to confirm your 15-minute slot.
                </p>
                <button
                  type="button"
                  onClick={() => setBookingOpen(false)}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#0F2D52] rounded-lg"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookSubmit} className="mt-5 space-y-4">
                {bookingError && (
                  <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {bookingError}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="bk-biz">
                      Business Name
                    </label>
                    <input
                      id="bk-biz"
                      required
                      value={bookingForm.businessName}
                      onChange={(e) => setBookingForm({ ...bookingForm, businessName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D52]"
                      placeholder="e.g. Doon Precision Packaging"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="bk-contact">
                      Your Name
                    </label>
                    <input
                      id="bk-contact"
                      required
                      value={bookingForm.contactName}
                      onChange={(e) => setBookingForm({ ...bookingForm, contactName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D52]"
                      placeholder="Owner or Manager"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="bk-phone">
                      Phone / WhatsApp
                    </label>
                    <input
                      id="bk-phone"
                      required
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D52]"
                      placeholder="+91 98..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="bk-email">
                      Email
                    </label>
                    <input
                      id="bk-email"
                      type="email"
                      required
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D52]"
                      placeholder="you@company.in"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="bk-slot">
                    Preferred Call Window
                  </label>
                  <select
                    id="bk-slot"
                    value={bookingForm.preferredSlot}
                    onChange={(e) => setBookingForm({ ...bookingForm, preferredSlot: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D52]"
                  >
                    <option>Weekday Morning (10:30 AM – 1:00 PM)</option>
                    <option>Weekday Afternoon (2:30 PM – 5:00 PM)</option>
                    <option>Saturday Morning (11:00 AM – 1:00 PM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="bk-topic">
                    Brief Problem Topic (optional)
                  </label>
                  <textarea
                    id="bk-topic"
                    rows={2}
                    value={bookingForm.topic}
                    onChange={(e) => setBookingForm({ ...bookingForm, topic: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D52]"
                    placeholder="e.g. Monthly distributor sales sheet consolidation"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingStatus === 'submitting'}
                    className="px-4 py-2 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73] disabled:opacity-50"
                  >
                    {bookingStatus === 'submitting' ? 'Sending...' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
