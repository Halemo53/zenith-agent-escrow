'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Cpu,
  Brain,
  Send,
  FileCode2,
  Lock,
  Unlock,
  RotateCcw,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useWeb3, ZENITH_CHAIN_ID_DEC } from '@/context/Web3Context';
import { DEFAULT_DEMO_WALLET, truncateAddress } from '@/lib/mockData';

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id || '';
  const {
    address,
    contractAddress,
    jobs,
    submitWork,
    releaseFunds,
    refundClient,
    evaluateJob,
  } = useWeb3();

  const job = jobs.find((j) => j.id === jobId);

  const activeWallet = (address || DEFAULT_DEMO_WALLET).toLowerCase();
  const isJobClient = job ? job.clientAddress.toLowerCase() === activeWallet : false;

  // Allow switching between Client and Freelancer view or default to wallet match
  const [roleOverride, setRoleOverride] = useState<'auto' | 'client' | 'freelancer'>('auto');
  const effectiveRole: 'client' | 'freelancer' =
    roleOverride === 'auto' ? (isJobClient ? 'client' : 'freelancer') : roleOverride;

  const [deliverableUrl, setDeliverableUrl] = useState(job?.submissionUrl || '');
  const [submissionNotes, setSubmissionNotes] = useState(job?.submissionNotes || '');
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [workFeedback, setWorkFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalPhase, setEvalPhase] = useState<string>('');

  const [isReleasing, setIsReleasing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  if (!job) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-zinc-100">
          Escrow Contract Not Found
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          The requested job ID ({jobId}) could not be found in the Zenith Testnet ledger.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Explorer</span>
        </Link>
      </div>
    );
  }

  const isEvaluationApproved = job.evaluation?.status === 'approved' || job.evaluation?.passed === true;

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverableUrl.trim()) return;

    setIsSubmittingWork(true);
    setWorkFeedback(null);
    setActionError(null);

    try {
      const txHash = await submitWork(job.id, deliverableUrl.trim(), submissionNotes);
      setWorkFeedback(
        `submitWork(${job.onChainId}, url) confirmed (${truncateAddress(
          txHash
        )}) and indexed to Supabase submissions table.`
      );
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Transaction failed while submitting work.'
      );
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    setActionError(null);
    setEvalPhase('Fetching deliverable repository & parsing AST...');

    const timer1 = setTimeout(() => {
      setEvalPhase('Evaluating code structure against acceptance criteria...');
    }, 1000);

    const timer2 = setTimeout(() => {
      setEvalPhase('Computing deterministic compliance verdict...');
    }, 2000);

    try {
      await evaluateJob(job.id);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'AI Agent evaluation request failed.'
      );
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsEvaluating(false);
      setEvalPhase('');
    }
  };

  const handleReleaseFunds = async () => {
    setIsReleasing(true);
    setActionError(null);
    try {
      await releaseFunds(job.id);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Could not release escrow funds.'
      );
    } finally {
      setIsReleasing(false);
    }
  };

  const handleRefundClient = async () => {
    setIsRefunding(true);
    setActionError(null);
    try {
      await refundClient(job.id);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Could not refund client escrow.'
      );
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Top Breadcrumb & Role Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Escrow Explorer</span>
        </Link>

        <div className="flex flex-wrap items-center gap-4">
          <div className="font-mono text-xs text-zinc-400 tabular-nums">
            <span>On-Chain ID: #{job.onChainId}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Contract: {truncateAddress(contractAddress)}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Chain ID: {ZENITH_CHAIN_ID_DEC}</span>
          </div>

          {/* Interactive Role Selector for testing Client vs Freelancer contract controls */}
          <div className="flex items-center gap-1 rounded-md border border-white/10 bg-[#18181b] p-1 text-xs">
            <button
              type="button"
              onClick={() => setRoleOverride('client')}
              className={`rounded px-2.5 py-1 font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                effectiveRole === 'client'
                  ? 'bg-emerald-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Client View {isJobClient ? '(You)' : ''}
            </button>
            <button
              type="button"
              onClick={() => setRoleOverride('freelancer')}
              className={`rounded px-2.5 py-1 font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                effectiveRole === 'freelancer'
                  ? 'bg-emerald-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Freelancer View {!isJobClient ? '(You)' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="mt-6 rounded-lg border border-white/10 bg-[#18181b] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            {/* Unboxed Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="font-medium text-zinc-200">{job.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">Created {job.createdAt}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{job.deadline}</span>
              <span aria-hidden="true">·</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  job.status === 'Open'
                    ? 'text-emerald-400'
                    : job.status === 'In Review'
                    ? 'text-amber-400'
                    : job.status === 'Completed'
                    ? 'text-emerald-400'
                    : 'text-zinc-400'
                }`}
              >
                {job.status === 'Open' && <ShieldCheck className="h-3.5 w-3.5" />}
                {job.status === 'In Review' && <Clock className="h-3.5 w-3.5" />}
                {job.status === 'Completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                {job.status === 'Refunded' && <RotateCcw className="h-3.5 w-3.5" />}
                <span>Status: {job.status}</span>
              </span>
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
              {job.title}
            </h1>
          </div>

          {/* Escrow Vault Payout Box */}
          <div className="shrink-0 rounded-md border border-white/10 bg-[#09090b] px-5 py-4 lg:text-right">
            <div className="flex items-center lg:justify-end gap-1.5 text-xs text-zinc-400">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Escrow Vault Balance</span>
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-zinc-100 tabular-nums">
              {job.reward} <span className="text-sm font-normal text-emerald-400">ZTH</span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-zinc-400 tabular-nums">
              {job.status === 'Completed'
                ? 'FundsReleased to Freelancer'
                : job.status === 'Refunded'
                ? 'Refunded to Client'
                : 'Locked in Escrow.sol'}
            </div>
          </div>
        </div>

        {/* On-Chain Addresses & Metadata Bar */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3 text-xs">
          <div>
            <div className="text-zinc-400">Client Address</div>
            <div className="mt-1 font-mono text-zinc-200 tabular-nums" title={job.clientAddress}>
              {job.clientAddress.slice(0, 14)}...{job.clientAddress.slice(-8)}
            </div>
          </div>
          <div>
            <div className="text-zinc-400">Assigned Freelancer</div>
            <div className="mt-1 font-mono text-zinc-200 tabular-nums">
              {job.freelancerAddress
                ? `${job.freelancerAddress.slice(0, 14)}...${job.freelancerAddress.slice(-8)}`
                : 'Open for Submission'}
            </div>
          </div>
          <div>
            <div className="text-zinc-400">
              {job.settlementTxHash ? 'Settlement Tx Hash' : 'Escrow Deposit Tx Hash'}
            </div>
            <div className="mt-1 font-mono text-zinc-300 tabular-nums">
              {truncateAddress(job.settlementTxHash || job.escrowTxHash)}
            </div>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-md border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-200">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs underline hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two-Column Body: Specification (Left) & Role Actions / AI Agent Evaluation (Right) */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Job Specification & Acceptance Criteria */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-lg border border-white/10 bg-[#18181b] p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold text-zinc-100">
              Technical Specification
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{job.description}</p>

            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="font-display text-sm font-bold text-zinc-100">
                Deterministic Acceptance Criteria
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                The autonomous verification agent checks these conditions prior to authorizing ZTH
                release:
              </p>

              <ul className="mt-4 space-y-3">
                {job.acceptanceCriteria.map((criterion, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-md border border-white/10 bg-[#09090b] p-3.5 text-xs text-zinc-200"
                  >
                    <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span className="leading-relaxed">{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Current Deliverable Artifact (if submitted) */}
          {job.submissionUrl && (
            <div className="rounded-lg border border-white/10 bg-[#18181b] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-display text-sm font-bold text-zinc-100">
                    Submitted Deliverable Artifact
                  </h3>
                </div>
                <span className="font-mono text-xs text-zinc-400 tabular-nums">
                  Anchored On-Chain &amp; Supabase
                </span>
              </div>

              <div className="mt-4 rounded-md border border-white/10 bg-[#09090b] p-3.5 font-mono text-xs text-emerald-400 break-all">
                <a
                  href={job.submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:underline"
                >
                  <span>{job.submissionUrl}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>

              {job.submissionNotes && (
                <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                  {job.submissionNotes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Role-Specific Smart Contract Controls & AI Agent Evaluation */}
        <div className="lg:col-span-5 space-y-6">
          {/* Role-Based Smart Contract Action Card */}
          {effectiveRole === 'client' ? (
            <div className="rounded-lg border border-white/10 bg-[#18181b] p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-zinc-100">
                  Client Escrow Controls
                </h2>
                <span className="font-mono text-xs text-emerald-400">releaseFunds(jobId)</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                As the job client, you can release the locked{' '}
                <span className="font-mono text-zinc-200 tabular-nums">{job.reward} ZTH</span> to
                the freelancer once the AI Agent approves the deliverable, or refund the escrow.
              </p>

              {!isEvaluationApproved && job.status !== 'Completed' && job.status !== 'Refunded' && (
                <div className="mt-4 flex items-start gap-2.5 rounded-md border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    Run the <strong>AI Agent Evaluation</strong> below and obtain an{' '}
                    <span className="font-mono">approved</span> verdict to unlock{' '}
                    <strong>Release Funds</strong>.
                  </span>
                </div>
              )}

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={handleReleaseFunds}
                  disabled={
                    isReleasing ||
                    isRefunding ||
                    job.status === 'Completed' ||
                    job.status === 'Refunded' ||
                    !isEvaluationApproved
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-45 transition-all duration-200 cursor-pointer"
                >
                  {isReleasing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Executing releaseFunds({job.onChainId})...</span>
                    </>
                  ) : job.status === 'Completed' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Funds Released ({job.reward} ZTH)</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4" />
                      <span>Release Funds ({job.reward} ZTH)</span>
                    </>
                  )}
                </button>

                {job.status !== 'Completed' && job.status !== 'Refunded' && (
                  <button
                    type="button"
                    onClick={handleRefundClient}
                    disabled={isReleasing || isRefunding}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-[#09090b] px-4 py-2 text-xs font-medium text-zinc-300 hover:border-white/25 hover:text-zinc-100 disabled:opacity-50 transition-all duration-200 cursor-pointer"
                  >
                    {isRefunding ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                        <span>Executing refundClient({job.onChainId})...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Refund Client Escrow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#18181b] p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-zinc-100">Submit Work</h2>
                <span className="font-mono text-xs text-emerald-400">
                  submitWork(jobId, workUrl)
                </span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-400">
                Anchor your GitHub pull request or deployment URL on-chain via{' '}
                <span className="font-mono text-zinc-200">submitWork</span> and sync to Supabase.
              </p>

              <form onSubmit={handleWorkSubmit} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="deliverable-url"
                    className="block text-xs font-semibold text-zinc-200"
                  >
                    Deliverable URL (GitHub PR / Commit / Endpoint)
                  </label>
                  <input
                    id="deliverable-url"
                    type="url"
                    required
                    disabled={
                      isSubmittingWork ||
                      job.status === 'Completed' ||
                      job.status === 'Refunded'
                    }
                    value={deliverableUrl}
                    onChange={(e) => setDeliverableUrl(e.target.value)}
                    placeholder="https://github.com/org/repo/pull/42"
                    className="mt-1.5 w-full rounded-md border border-white/10 bg-[#09090b] px-3.5 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none disabled:opacity-60 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="submission-notes"
                    className="block text-xs font-semibold text-zinc-200"
                  >
                    Release / Audit Notes (Optional)
                  </label>
                  <textarea
                    id="submission-notes"
                    rows={2}
                    disabled={
                      isSubmittingWork ||
                      job.status === 'Completed' ||
                      job.status === 'Refunded'
                    }
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="Brief summary of test execution and gas benchmarks..."
                    className="mt-1.5 w-full rounded-md border border-white/10 bg-[#09090b] px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none disabled:opacity-60 transition-colors duration-200"
                  />
                </div>

                {workFeedback && (
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-200">
                    {workFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    isSubmittingWork ||
                    job.status === 'Completed' ||
                    job.status === 'Refunded'
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-all duration-200 cursor-pointer"
                >
                  {isSubmittingWork ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Calling submitWork({job.onChainId}, workUrl)...</span>
                    </>
                  ) : job.status === 'Completed' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Deliverable Settled &amp; Closed</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{job.submissionUrl ? 'Update Submitted Work' : 'Submit Work'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Section 2: AI Agent Evaluation (/api/evaluate) */}
          <div className="rounded-lg border border-white/10 bg-[#18181b] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-emerald-400" />
                <h2 className="font-display text-base font-bold text-zinc-100">
                  AI Agent Evaluation
                </h2>
              </div>
              <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                POST /api/evaluate
              </span>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Dispatch the autonomous verification agent to analyze the submitted deliverable URL
              against the job description and unlock{' '}
              <span className="font-mono text-zinc-200 tabular-nums">releaseFunds</span>.
            </p>

            {/* Evaluation Action Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleRunEvaluation}
                disabled={isEvaluating || job.status === 'Refunded'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-emerald-500/40 bg-[#09090b] px-4 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 disabled:opacity-60 transition-all duration-200 cursor-pointer"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI Agent is analyzing...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4" />
                    <span>{job.evaluation ? 'Re-Run Evaluation' : 'Run Evaluation'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Animated "AI Agent is analyzing..." Loader */}
            {isEvaluating && (
              <div className="mt-4 rounded-md border border-emerald-500/30 bg-[#09090b] p-4 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-semibold">
                    <Brain className="h-4 w-4 animate-pulse shrink-0" />
                    <span>AI Agent is analyzing...</span>
                  </div>
                  <Cpu className="h-4 w-4 animate-spin text-zinc-400" />
                </div>
                <p className="mt-2 font-mono text-[11px] text-zinc-300">{evalPhase}</p>
              </div>
            )}

            {/* Evaluation Verdict Display */}
            {job.evaluation && !isEvaluating && (
              <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between text-xs">
                  {job.evaluation.status === 'approved' ? (
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Verdict: APPROVED</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Verdict: REJECTED</span>
                    </div>
                  )}
                  <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                    {job.evaluation.timestamp}
                  </span>
                </div>

                <div
                  className={`rounded-md border p-3.5 text-xs leading-relaxed ${
                    job.evaluation.status === 'approved'
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-100'
                      : 'border-amber-500/30 bg-amber-950/20 text-amber-100'
                  }`}
                >
                  <div className="font-mono text-[11px] uppercase tracking-wider opacity-80">
                    Agent Reason
                  </div>
                  <div className="mt-1 font-medium">{job.evaluation.reason}</div>
                </div>

                <div className="space-y-2.5">
                  {job.evaluation.checks.map((chk, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-white/10 bg-[#09090b] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-zinc-200">{chk.criterion}</span>
                        <span
                          className={`font-mono text-[11px] ${
                            chk.status === 'Verified' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {chk.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400">{chk.detail}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Release CTA if approved and not yet released */}
                {job.evaluation.status === 'approved' && job.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={handleReleaseFunds}
                    disabled={isReleasing}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60 transition-all duration-200 cursor-pointer"
                  >
                    {isReleasing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Releasing {job.reward} ZTH...</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4" />
                        <span>Release Funds ({job.reward} ZTH)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
