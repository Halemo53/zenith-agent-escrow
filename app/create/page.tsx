'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Lock,
  Loader2,
  Info,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  XCircle,
  Database,
} from 'lucide-react';
import { useWeb3, ZENITH_CHAIN_ID_DEC, TxState } from '@/context/Web3Context';
import { truncateAddress } from '@/lib/mockData';

export default function CreateJobPage() {
  const router = useRouter();
  const {
    address,
    balance,
    isConnected,
    contractAddress,
    connectWallet,
    createJob,
  } = useWeb3();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Smart Contracts');
  const [description, setDescription] = useState('');
  const [criteriaInput, setCriteriaInput] = useState(
    'Repository builds cleanly with zero compiler errors\n100% unit test pass rate on target deliverables\nIncludes deployment & verification instructions'
  );
  const [reward, setReward] = useState('');
  const [txState, setTxState] = useState<TxState>('idle');
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [createdTxHash, setCreatedTxHash] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const categories = [
    'Smart Contracts',
    'Backend & Indexing',
    'SDK & Tooling',
    'Frontend Engineering',
    'Security & Auditing',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter a descriptive job title.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide the technical scope and deliverable specification.');
      return;
    }
    const numericReward = parseFloat(reward.replace(/,/g, ''));
    if (isNaN(numericReward) || numericReward <= 0) {
      setFormError('Please specify a valid ZTH reward amount greater than 0.');
      return;
    }

    setTxState('pending');
    setTxMessage(
      `Calling createJob(title, description, ${numericReward} ZTH) via signer on ${truncateAddress(
        contractAddress
      )}...`
    );

    try {
      const criteriaList = criteriaInput
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const created = await createJob(
        title.trim(),
        category,
        description.trim(),
        criteriaList,
        numericReward.toString()
      );

      setCreatedTxHash(created.escrowTxHash);
      setTxState('success');
      setTxMessage(
        'Transaction confirmed on Zenith EVM Testnet & indexed to Supabase jobs table. Redirecting...'
      );

      setTimeout(() => {
        router.push(`/job/${created.id}`);
      }, 900);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Transaction failed or was rejected in wallet.';
      setTxState('failed');
      setTxMessage(msg);
      setFormError(msg);
    }
  };

  const isSubmitting = txState === 'pending';

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Back navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Escrow Explorer</span>
      </Link>

      {/* Page Heading */}
      <div className="mt-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-100">
          Deploy New Escrow Contract
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Execute <span className="font-mono text-zinc-200">createJob(title, description, reward)</span>{' '}
          on Zenith EVM Testnet (Chain ID {ZENITH_CHAIN_ID_DEC}) and index metadata directly to
          Supabase.
        </p>
      </div>

      {/* Main Centered Form Card */}
      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-lg border border-white/10 bg-[#18181b] p-6 sm:p-8 space-y-6"
      >
        {/* Contract & Wallet Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Escrow Contract:</span>
            <span className="font-mono text-zinc-200 tabular-nums" title={contractAddress}>
              {truncateAddress(contractAddress)}
            </span>
          </div>

          {isConnected ? (
            <div className="font-mono text-zinc-300 tabular-nums">
              Signer: <span className="text-zinc-100">{truncateAddress(address || '')}</span> ·
              Balance: <span className="text-emerald-400 font-semibold">{balance} ZTH</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={connectWallet}
              className="inline-flex items-center gap-1.5 font-medium text-emerald-400 hover:text-emerald-300 transition-colors duration-200 cursor-pointer"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Connect Wallet to sign transaction</span>
            </button>
          )}
        </div>

        {/* Transaction State Banner (Pending / Success / Failed) */}
        {txState === 'pending' && txMessage && (
          <div className="flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-950/20 px-4 py-3.5 text-xs text-emerald-200">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-emerald-400" />
            <div className="flex-1">
              <div className="font-semibold text-emerald-300">
                Transaction Pending · Awaiting Block Confirmation
              </div>
              <div className="mt-1 text-zinc-300">{txMessage}</div>
            </div>
          </div>
        )}

        {txState === 'success' && txMessage && (
          <div className="flex items-start gap-3 rounded-md border border-emerald-500/40 bg-emerald-950/30 px-4 py-3.5 text-xs text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div className="flex-1">
              <div className="font-semibold text-emerald-300">
                Transaction Confirmed &amp; Cached in Supabase
              </div>
              <div className="mt-1 text-zinc-200">{txMessage}</div>
              {createdTxHash && (
                <div className="mt-1.5 font-mono text-[11px] text-emerald-400 tabular-nums">
                  Tx Hash: {createdTxHash}
                </div>
              )}
            </div>
          </div>
        )}

        {(txState === 'failed' || formError) && (
          <div className="flex items-start gap-3 rounded-md border border-red-500/30 bg-red-950/30 px-4 py-3.5 text-xs text-red-200">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div className="flex-1">
              <div className="font-semibold text-red-300">Transaction Error</div>
              <div className="mt-0.5 text-red-200">{formError || txMessage}</div>
            </div>
          </div>
        )}

        {/* Title & Category */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="job-title" className="block text-xs font-semibold text-zinc-200">
              Job Title
            </label>
            <input
              id="job-title"
              type="text"
              required
              disabled={isSubmitting}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Implement Merkle Airdrop Claim Contract with Foundry Tests"
              className="mt-2 w-full rounded-md border border-white/10 bg-[#09090b] px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none disabled:opacity-60 transition-colors duration-200"
            />
          </div>

          <div>
            <label htmlFor="job-category" className="block text-xs font-semibold text-zinc-200">
              Domain Category
            </label>
            <select
              id="job-category"
              disabled={isSubmitting}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-md border border-white/10 bg-[#09090b] px-3.5 py-2.5 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none disabled:opacity-60 transition-colors duration-200"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#09090b] text-zinc-100">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="job-description" className="block text-xs font-semibold text-zinc-200">
            Technical Specification &amp; Deliverable Scope
          </label>
          <textarea
            id="job-description"
            rows={4}
            required
            disabled={isSubmitting}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the architecture, expected interfaces, performance benchmarks, and repository structure required for automated verification..."
            className="mt-2 w-full rounded-md border border-white/10 bg-[#09090b] px-3.5 py-2.5 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none disabled:opacity-60 transition-colors duration-200"
          />
        </div>

        {/* Acceptance Criteria */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="job-criteria" className="block text-xs font-semibold text-zinc-200">
              Verification Acceptance Criteria (One per line)
            </label>
            <span className="text-[11px] text-zinc-400">Audited during AI Agent Evaluation</span>
          </div>
          <textarea
            id="job-criteria"
            rows={3}
            disabled={isSubmitting}
            value={criteriaInput}
            onChange={(e) => setCriteriaInput(e.target.value)}
            className="mt-2 w-full rounded-md border border-white/10 bg-[#09090b] px-3.5 py-2.5 font-mono text-xs leading-relaxed text-zinc-200 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none disabled:opacity-60 transition-colors duration-200"
          />
        </div>

        {/* Reward Amount */}
        <div>
          <label htmlFor="job-reward" className="block text-xs font-semibold text-zinc-200">
            Escrow Reward Amount (ZTH)
          </label>
          <div className="relative mt-2">
            <input
              id="job-reward"
              type="number"
              step="0.01"
              min="1"
              required
              disabled={isSubmitting}
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="500.00"
              className="w-full rounded-md border border-white/10 bg-[#09090b] pl-3.5 pr-16 py-2.5 font-mono text-sm text-zinc-100 tabular-nums placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none disabled:opacity-60 transition-colors duration-200"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-emerald-400">
              ZTH
            </span>
          </div>

          {/* Mandatory Testnet Note & Supabase Sync Indicator */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border border-white/10 bg-[#09090b] px-3.5 py-2.5 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>ZTH is a testnet token with no real value.</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              <span>Instant Supabase Write-Through Enabled</span>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || txState === 'success'}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60 transition-all duration-200 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing &amp; Locking ZTH in Smart Contract...</span>
              </>
            ) : txState === 'success' ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Escrow Deployed · Redirecting...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Lock ZTH &amp; Create Job</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
