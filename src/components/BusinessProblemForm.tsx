import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';
import type { BusinessProfile, DataAvailability, ProjectCategory, ProjectTimeline } from '../types/models';
import { PROJECT_CATEGORIES, STANDARD_SKILLS, validateProblemSubmission } from '../utils/domain';

interface BusinessProblemFormProps {
  defaultBusiness?: BusinessProfile;
  userEmail: string;
  userName: string;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
}

export function BusinessProblemForm({
  defaultBusiness,
  userEmail,
  userName,
  onSuccess,
  onCancel,
}: BusinessProblemFormProps) {
  const [businessName, setBusinessName] = useState(defaultBusiness?.businessName || '');
  const [contactName, setContactName] = useState(defaultBusiness?.ownerName || userName || '');
  const [phone, setPhone] = useState(defaultBusiness?.phone || '');
  const [email, setEmail] = useState(defaultBusiness?.email || userEmail || '');
  const [location, setLocation] = useState<'Selaqui' | 'Other Dehradun'>(
    defaultBusiness?.location || 'Selaqui'
  );
  const [industry, setIndustry] = useState(defaultBusiness?.industry || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Market Research');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Market Research']);
  const [timeline, setTimeline] = useState<ProjectTimeline>('2 weeks');
  const [budgetMin, setBudgetMin] = useState(4000);
  const [budgetMax, setBudgetMax] = useState(6000);
  const [dataAvailability, setDataAvailability] = useState<DataAvailability>('Partial');
  const [confidentialityNotes, setConfidentialityNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function toggleSkill(skill: string) {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');
    const validationErrors = validateProblemSubmission({
      businessName,
      contactName,
      phone,
      email,
      location,
      industry,
      title,
      description,
      category,
      expectedOutcome,
      requiredSkills,
      timeline,
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await api.createProject({
        businessName,
        contactName,
        phone,
        email,
        location,
        industry,
        title,
        description,
        category,
        expectedOutcome,
        requiredSkills,
        timeline,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        dataAvailability,
        confidentialityNotes,
      });
      await onSuccess();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Unable to submit business problem.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Submit a Business Problem</h2>
          <p className="text-sm text-slate-600 mt-1">
            Describe one clearly scoped, non-regulated business task. Status starts as Submitted for coordinator review.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Close problem submission form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {serverError && (
        <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pf-biz" className="block text-xs font-semibold text-slate-700 mb-1">
              Business Name *
            </label>
            <input
              id="pf-biz"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="e.g. Himalayan Nutraceuticals Pvt Ltd"
            />
            {errors.businessName && <p className="text-xs text-red-600 mt-1">{errors.businessName}</p>}
          </div>

          <div>
            <label htmlFor="pf-contact" className="block text-xs font-semibold text-slate-700 mb-1">
              Owner / Contact Name *
            </label>
            <input
              id="pf-contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="e.g. Rajesh Rawat"
            />
            {errors.contactName && <p className="text-xs text-red-600 mt-1">{errors.contactName}</p>}
          </div>

          <div>
            <label htmlFor="pf-phone" className="block text-xs font-semibold text-slate-700 mb-1">
              Phone / WhatsApp *
            </label>
            <input
              id="pf-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="+91 98370 11223"
            />
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="pf-email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email *
            </label>
            <input
              id="pf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="pf-loc" className="block text-xs font-semibold text-slate-700 mb-1">
              Location *
            </label>
            <select
              id="pf-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value as 'Selaqui' | 'Other Dehradun')}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            >
              <option value="Selaqui">Selaqui</option>
              <option value="Other Dehradun">Other Dehradun</option>
            </select>
          </div>

          <div>
            <label htmlFor="pf-ind" className="block text-xs font-semibold text-slate-700 mb-1">
              Industry *
            </label>
            <input
              id="pf-ind"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="e.g. Packaging, FMCG, Pharma"
            />
            {errors.industry && <p className="text-xs text-red-600 mt-1">{errors.industry}</p>}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-title" className="block text-xs font-semibold text-slate-700 mb-1">
                Problem Title *
              </label>
              <input
                id="pf-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                placeholder="e.g. Distributor Margin & Monthly Sales Dashboard"
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="pf-cat" className="block text-xs font-semibold text-slate-700 mb-1">
                Project Category *
              </label>
              <select
                id="pf-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="pf-desc" className="block text-xs font-semibold text-slate-700 mb-1">
              Problem Description *
            </label>
            <textarea
              id="pf-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="Explain what happens today, where delays or guesswork occur, and what needs analysis."
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label htmlFor="pf-outcome" className="block text-xs font-semibold text-slate-700 mb-1">
              Expected Outcome / Deliverable *
            </label>
            <input
              id="pf-outcome"
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="e.g. An Excel workbook + 10-slide summary of top/bottom SKUs and competitor pricing."
            />
            {errors.expectedOutcome && (
              <p className="text-xs text-red-600 mt-1">{errors.expectedOutcome}</p>
            )}
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Required Skills (select all that apply) *
            </span>
            <div className="flex flex-wrap gap-2">
              {STANDARD_SKILLS.map((skill) => {
                const selected = requiredSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-[#0F2D52] text-white border-[#0F2D52]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
            {errors.requiredSkills && (
              <p className="text-xs text-red-600 mt-1">{errors.requiredSkills}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="pf-time" className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Timeline
              </label>
              <select
                id="pf-time"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value as ProjectTimeline)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="3-4 weeks">3-4 weeks</option>
              </select>
            </div>

            <div>
              <label htmlFor="pf-bmin" className="block text-xs font-semibold text-slate-700 mb-1">
                Min Budget (INR)
              </label>
              <input
                id="pf-bmin"
                type="number"
                min={500}
                step={500}
                value={budgetMin}
                onChange={(e) => setBudgetMin(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="pf-bmax" className="block text-xs font-semibold text-slate-700 mb-1">
                Max Budget (INR)
              </label>
              <input
                id="pf-bmax"
                type="number"
                min={500}
                step={500}
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="pf-data" className="block text-xs font-semibold text-slate-700 mb-1">
                Data Availability
              </label>
              <select
                id="pf-data"
                value={dataAvailability}
                onChange={(e) => setDataAvailability(e.target.value as DataAvailability)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                <option value="Yes">Yes</option>
                <option value="Partial">Partial</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
          {errors.budget && <p className="text-xs text-red-600">{errors.budget}</p>}

          <div>
            <label htmlFor="pf-conf" className="block text-xs font-semibold text-slate-700 mb-1">
              Confidentiality Notes
            </label>
            <input
              id="pf-conf"
              value={confidentialityNotes}
              onChange={(e) => setConfidentialityNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              placeholder="e.g. Anonymize customer names or review invoices on-site in Selaqui."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73] disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Problem'}
          </button>
        </div>
      </form>
    </div>
  );
}
