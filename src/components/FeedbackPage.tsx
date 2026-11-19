import { useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import type { User, WorkspaceSnapshot } from '../types/models';

interface FeedbackPageProps {
  projectId: string;
  user: User;
  workspace: WorkspaceSnapshot;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export function FeedbackPage({
  projectId,
  user,
  workspace,
  onRefresh,
  onNavigate,
}: FeedbackPageProps) {
  const project = workspace.projects.find((p) => p.id === projectId);
  const existing = workspace.feedbacks.find((f) => f.projectId === projectId);

  const [usefulness, setUsefulness] = useState(5);
  const [onTime, setOnTime] = useState(true);
  const [quality, setQuality] = useState(5);
  const [wouldPayAgain, setWouldPayAgain] = useState(true);
  const [nps, setNps] = useState(9);
  const [comments, setComments] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!project) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-base font-bold text-slate-900">Project not found</p>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg"
        >
          Go Home
        </button>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.submitFeedback(project!.id, {
        usefulness,
        onTime,
        quality,
        wouldPayAgain,
        nps,
        comments,
        testimonial,
      });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => onNavigate(`/projects/${project.id}`)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F2D52]"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Back to Project</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-medium text-slate-500">
            Post-Delivery Feedback · {project.businessName}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{project.title}</h1>
        </div>

        {existing ? (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-teal-800 font-semibold text-sm bg-teal-50 border border-teal-200 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              <span>Feedback submitted — thank you for helping validate DGU IndustryBridge.</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 block">Usefulness</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {existing.usefulness} / 5
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 block">Quality</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {existing.quality} / 5
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 block">Delivered On Time</span>
                <span className="font-semibold text-slate-900">{existing.onTime ? 'Yes' : 'No'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 block">Would Pay Again</span>
                <span className="font-semibold text-slate-900">
                  {existing.wouldPayAgain ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 block">Recommend (NPS)</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {existing.nps} / 10
                </span>
              </div>
            </div>

            {existing.comments && (
              <div>
                <p className="text-xs font-semibold text-slate-500">Comments</p>
                <p className="text-sm text-slate-800 mt-1">{existing.comments}</p>
              </div>
            )}
            {existing.testimonial && (
              <div>
                <p className="text-xs font-semibold text-slate-500">One-line Testimonial</p>
                <p className="text-sm text-slate-800 mt-1">“{existing.testimonial}”</p>
              </div>
            )}
          </div>
        ) : user.role === 'business' || user.role === 'admin' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fb-use" className="block text-xs font-semibold text-slate-700 mb-1">
                  Usefulness (1–5)
                </label>
                <select
                  id="fb-use"
                  value={usefulness}
                  onChange={(e) => setUsefulness(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                >
                  {[5, 4, 3, 2, 1].map((v) => (
                    <option key={v} value={v}>
                      {v} — {v === 5 ? 'Very Useful' : v === 1 ? 'Not Useful' : `${v}/5`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="fb-qual" className="block text-xs font-semibold text-slate-700 mb-1">
                  Quality of Deliverable (1–5)
                </label>
                <select
                  id="fb-qual"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                >
                  {[5, 4, 3, 2, 1].map((v) => (
                    <option key={v} value={v}>
                      {v} / 5
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivered On Time?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOnTime(true)}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      onTime
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnTime(false)}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      !onTime
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1">
                  Would You Pay Again?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWouldPayAgain(true)}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      wouldPayAgain
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setWouldPayAgain(false)}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      !wouldPayAgain
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="fb-nps" className="block text-xs font-semibold text-slate-700 mb-1">
                How likely are you to recommend DGU IndustryBridge? (0–10 NPS):{' '}
                <span className="font-mono text-[#0F2D52]">{nps}</span>
              </label>
              <input
                id="fb-nps"
                type="range"
                min={0}
                max={10}
                value={nps}
                onChange={(e) => setNps(Number(e.target.value))}
                className="w-full accent-[#0F2D52]"
              />
            </div>

            <div>
              <label htmlFor="fb-comm" className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Comments
              </label>
              <textarea
                id="fb-comm"
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                placeholder="What worked well? What should student teams improve next time?"
              />
            </div>

            <div>
              <label htmlFor="fb-test" className="block text-xs font-semibold text-slate-700 mb-1">
                One-Line Testimonial (optional)
              </label>
              <input
                id="fb-test"
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                placeholder="e.g. Useful analysis delivered on time at a practical budget."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73]"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-500">Waiting for business owner feedback.</p>
        )}
      </div>
    </div>
  );
}
