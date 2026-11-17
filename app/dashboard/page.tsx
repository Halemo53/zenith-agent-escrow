'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Lock,
  TrendingUp,
  Clock,
  Unlock,
  RotateCcw,
  Send,
  ArrowUpRight,
  Plus,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useWeb3, ZENITH_CHAIN_ID_DEC } from '@/context/Web3Context';
import { DEFAULT_DEMO_WALLET, truncateAddress } from '@/lib/mockData';

export default function UserDashboardPage() {
  const {
    address,
    balance,
    isConnected,
    connectWallet,
    jobs,
    releaseFunds,
    refundClient,
    submitWork,
  } = useWeb3();

  const activeAddress = address || DEFAULT_DEMO_WALLET;

  // Match jobs belonging to either the connected address or the demo portfolio address
  const isUserAddress = (target?: string) => {
    if (!target) return false;
    const t = target.toLowerCase();
    return (
      t === activeAddress.toLowerCase() ||
      t === DEFAULT_DEMO_WALLET.toLowerCase()
    );
  };

  const myPostedJobs = useMemo(
    () => jobs.filter((job) => isUserAddress(job.clientAddress)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jobs, activeAddress]
  );

  const myFreelanceJobs = useMemo(
    () => jobs.filter((job) => isUserAddress(job.freelancerAddress)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jobs, activeAddress]
  );

  const stats = useMemo(() => {
    const totalLocked = myPostedJobs
      .filter((j) => j.status === 'Open' || j.status === 'In Review')
      .reduce((sum, j) => sum + (parseFloat(j.reward.replace(/,/g, '')) || 0), 0);

    const totalEarned = myFreelanceJobs
      .filter((j) => j.status === 'Completed')
      .reduce((sum, j) => sum + (parseFloat(j.reward.replace(/,/g, '')) || 0), 0);

    const pendingPayouts = myFreelanceJobs
      .filter((j) => j.status === 'Open' || j.status === 'In Review')
      .reduce((sum, j) => sum + (parseFloat(j.reward.replace(/,/g, '')) || 0), 0);

    return {
      totalLocked: totalLocked.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalEarned: totalEarned.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      pendingPayouts: pendingPayouts.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  }, [myPostedJobs, myFreelanceJobs]);

  const [busyJobAction, setBusyJobAction] = useState<{
    jobId: string;
    action: 'release' | 'refund' | 'submit';
  } | null>(null);

  const [workUrls, setWorkUrls] = useState<Record<string, string>>({});

  const handleRelease = async (jobId: string) => {
    setBusyJobAction({ jobId, action: 'release' });
    try {
      await releaseFunds(jobId);
    } catch {
      // Handled via global toast/error bar
    } finally {
      setBusyJobAction(null);
    }
  };

  const handleRefund = async (jobId: string) => {
    setBusyJobAction({ jobId, action: 'refund' });
    try {
      await refundClient(jobId);
    } catch {
      // Handled via global toast/error bar
    } finally {
      setBusyJobAction(null);
    }
  };

  const handleInlineSubmitWork = async (e: React.FormEvent, jobId: string) => {
    e.preventDefault();
    const url =
      workUrls[jobId]?.trim() ||
      'https://github.com/zenith-labs/escrow-deliverable/pull/19';
    setBusyJobAction({ jobId, action: 'submit' });
    try {
      await submitWork(
        jobId,
        url,
        'Submitted via Freelancer Dashboard for automated agent verification.'
      );
    } catch {
      // Handled via global toast/error bar
    } finally {
      setBusyJobAction(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-medium text-emerald-400">Account Ledger</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{truncateAddress(activeAddress)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Chain ID {ZENITH_CHAIN_ID_DEC}</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-zinc-100">
            Escrow Portfolio &amp; Settlements
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {!isConnected && (
            <button
              type="button"
              onClick={connectWallet}
              className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-[#18181b] px-4 py-2 text-xs font-semibold text-zinc-100 hover:border-emerald-500/50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Wallet className="h-4 w-4 text-emerald-400" />
              <span>Connect MetaMask</span>
            </button>
          )}
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Post New Job</span>
          </Link>
        </div>
      </div>

      {/* Financial Statistics Cards (Stripe / Coinbase style) */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-[#18181b] p-6">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total ZTH Earned</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-zinc-100 tabular-nums">
            {stats.totalEarned} <span className="text-xs font-normal text-emerald-400">ZTH</span>
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Settled on-chain via <span className="font-mono text-zinc-300">FundsReleased</span>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#18181b] p-6">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total ZTH Locked in Escrow</span>
            <Lock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-zinc-100 tabular-nums">
            {stats.totalLocked} <span className="text-xs font-normal text-emerald-400">ZTH</span>
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Across {myPostedJobs.filter((j) => j.status === 'Open' || j.status === 'In Review').length}{' '}
            active client contracts
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#18181b] p-6">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Pending Work Payouts</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-amber-400 tabular-nums">
            {stats.pendingPayouts} <span className="text-xs font-normal text-zinc-300">ZTH</span>
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Awaiting submission or client release
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#18181b] p-6">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Liquid Wallet Balance</span>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-emerald-400 tabular-nums">
            {balance === '0.00' ? '4,250.00' : balance}{' '}
            <span className="text-xs font-normal text-zinc-300">ZTH</span>
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Zenith Testnet (0xe4a25)
          </div>
        </div>
      </div>

      {/* Section 1: My Posted Jobs (Client Role) */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-100">
              My Posted Jobs (Client)
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Manage escrow contracts where you deposited ZTH collateral. Execute{' '}
              <span className="font-mono text-zinc-300">releaseFunds</span> or{' '}
              <span className="font-mono text-zinc-300">refundClient</span> directly.
            </p>
          </div>
          <span className="font-mono text-xs text-zinc-400 tabular-nums">
            {myPostedJobs.length} Contracts
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {myPostedJobs.map((job) => {
            const isReleasing =
              busyJobAction?.jobId === job.id && busyJobAction.action === 'release';
            const isRefunding =
              busyJobAction?.jobId === job.id && busyJobAction.action === 'refund';

            return (
              <div
                key={job.id}
                className="rounded-lg border border-white/10 bg-[#18181b] p-6 transition-colors hover:border-white/20"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="font-mono text-zinc-300 tabular-nums">
                        #{job.onChainId}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{job.category}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          job.status === 'Completed'
                            ? 'text-emerald-400'
                            : job.status === 'In Review'
                            ? 'text-amber-400'
                            : job.status === 'Refunded'
                            ? 'text-zinc-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {job.status === 'Completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {job.status === 'In Review' && <Clock className="h-3.5 w-3.5" />}
                        {job.status === 'Open' && <ShieldCheck className="h-3.5 w-3.5" />}
                        {job.status === 'Refunded' && <RotateCcw className="h-3.5 w-3.5" />}
                        <span>{job.status}</span>
                      </span>
                      {job.evaluation?.status === 'approved' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400 font-medium">
                            AI Verdict: Approved
                          </span>
                        </>
                      )}
                    </div>

                    <Link
                      href={`/job/${job.id}`}
                      className="inline-flex items-center gap-1.5 font-display text-lg font-bold text-zinc-100 hover:text-emerald-400 transition-colors"
                    >
                      <span>{job.title}</span>
                      <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                    </Link>

                    {job.submissionUrl && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span>Deliverable:</span>
                        <a
                          href={job.submissionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-emerald-400 hover:underline truncate max-w-md"
                        >
                          <span>{job.submissionUrl}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Reward & Smart Contract Actions */}
                  <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                    <div className="mr-2">
                      <div className="text-xs text-zinc-400">Escrow Amount</div>
                      <div className="font-mono text-lg font-bold text-zinc-100 tabular-nums">
                        {job.reward}{' '}
                        <span className="text-xs font-normal text-emerald-400">ZTH</span>
                      </div>
                    </div>

                    {job.status !== 'Completed' && job.status !== 'Refunded' ? (
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleRelease(job.id)}
                          disabled={Boolean(busyJobAction)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {isReleasing ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Releasing...</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3.5 w-3.5" />
                              <span>Release Funds</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRefund(job.id)}
                          disabled={Boolean(busyJobAction)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-[#09090b] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:border-white/30 hover:text-zinc-100 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {isRefunding ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Refunding...</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Refund</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={`/job/${job.id}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#09090b] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:border-white/20 whitespace-nowrap shrink-0"
                      >
                        <span>Inspect Receipt</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: My Work (Freelancer Role) */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-100">
              My Work (Freelancer)
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Deliverable submissions, pending escrow releases, and completed bounties assigned to
              your wallet.
            </p>
          </div>
          <span className="font-mono text-xs text-zinc-400 tabular-nums">
            {myFreelanceJobs.length} Assignments
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {myFreelanceJobs.map((job) => {
            const isSubmittingThis =
              busyJobAction?.jobId === job.id && busyJobAction.action === 'submit';
            const currentUrl =
              workUrls[job.id] !== undefined
                ? workUrls[job.id]
                : job.submissionUrl || '';

            return (
              <div
                key={job.id}
                className="rounded-lg border border-white/10 bg-[#18181b] p-6 transition-colors hover:border-white/20"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="font-mono text-zinc-300 tabular-nums">
                        #{job.onChainId}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Client: {truncateAddress(job.clientAddress)}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-semibold ${
                          job.status === 'Completed'
                            ? 'text-emerald-400'
                            : job.status === 'In Review'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {job.status === 'Completed'
                          ? 'Paid & Settled'
                          : job.status === 'In Review'
                          ? 'In Review · Payment Pending'
                          : 'Open · Awaiting Deliverable'}
                      </span>
                    </div>

                    <Link
                      href={`/job/${job.id}`}
                      className="inline-flex items-center gap-1.5 font-display text-lg font-bold text-zinc-100 hover:text-emerald-400 transition-colors"
                    >
                      <span>{job.title}</span>
                      <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                    </Link>

                    <p className="text-xs text-zinc-400 line-clamp-2">{job.description}</p>
                  </div>

                  <div className="shrink-0 lg:text-right">
                    <div className="text-xs text-zinc-400">
                      {job.status === 'Completed' ? 'Earned Payout' : 'Pending Payment'}
                    </div>
                    <div className="font-mono text-lg font-bold text-zinc-100 tabular-nums">
                      {job.reward}{' '}
                      <span className="text-xs font-normal text-emerald-400">ZTH</span>
                    </div>
                  </div>
                </div>

                {/* Inline Submit Work Form if not completed */}
                {job.status !== 'Completed' && job.status !== 'Refunded' && (
                  <form
                    onSubmit={(e) => handleInlineSubmitWork(e, job.id)}
                    className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center"
                  >
                    <input
                      type="url"
                      required
                      disabled={isSubmittingThis}
                      value={currentUrl}
                      onChange={(e) =>
                        setWorkUrls((prev) => ({ ...prev, [job.id]: e.target.value }))
                      }
                      placeholder="https://github.com/zenith-labs/repo/pull/42"
                      className="flex-1 rounded-md border border-white/10 bg-[#09090b] px-3.5 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="submit"
                        disabled={isSubmittingThis}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {isSubmittingThis ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Submitting On-Chain...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span>
                              {job.submissionUrl ? 'Update Work URL' : 'Submit Work'}
                            </span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/job/${job.id}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#09090b] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:border-white/25 whitespace-nowrap shrink-0"
                      >
                        <span>Run AI Evaluation</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
