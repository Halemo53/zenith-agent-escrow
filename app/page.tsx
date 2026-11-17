'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Shield,
  ArrowRight,
  Terminal,
  CheckCircle2,
  Coins,
} from 'lucide-react';
import { useWeb3 } from '@/context/Web3Context';
import JobCard from '@/components/JobCard';
import { JobStatus } from '@/lib/mockData';

export default function DashboardPage() {
  const { jobs } = useWeb3();
  const [statusFilter, setStatusFilter] = useState<'All' | JobStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.category.toLowerCase().includes(query) ||
        job.clientAddress.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [jobs, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    const totalLocked = jobs.reduce((acc, job) => {
      const val = parseFloat(job.reward.replace(/,/g, '')) || 0;
      return acc + val;
    }, 0);

    const openCount = jobs.filter((j) => j.status === 'Open').length;
    const reviewCount = jobs.filter((j) => j.status === 'In Review').length;
    const completedCount = jobs.filter((j) => j.status === 'Completed').length;

    return {
      totalLocked: totalLocked.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      openCount,
      reviewCount,
      completedCount,
    };
  }, [jobs]);

  const filterTabs: ('All' | JobStatus)[] = ['All', 'Open', 'In Review', 'Completed'];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Hero Section */}
      <section className="border-b border-white/10 pb-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <Shield className="h-4 w-4" />
              <span>Zenith EVM Testnet · Non-Custodial Smart Escrow</span>
            </div>

            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-zinc-100 sm:text-5xl max-w-3xl leading-[1.12]">
              Programmable Escrow with Deterministic Agent Verification.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">
              Clients lock ZTH tokens into immutable Zenith smart contracts with explicit technical
              acceptance criteria. Freelancers submit verifiable repository deliverables, and
              autonomous verification agents audit build integrity before releasing funds on-chain.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-all duration-200 whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Lock ZTH &amp; Create Job</span>
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-[#18181b] px-5 py-2.5 text-sm font-medium text-zinc-200 hover:border-white/20 hover:bg-zinc-800/80 transition-all duration-200 whitespace-nowrap shrink-0"
              >
                <span>My Escrow Portfolio</span>
                <ArrowRight className="h-4 w-4 text-emerald-400" />
              </Link>

              <Link
                href="/faucet"
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-[#09090b] px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-white/20 transition-all duration-200 whitespace-nowrap shrink-0"
              >
                <Coins className="h-4 w-4 text-emerald-400" />
                <span>Zenith Faucet</span>
              </Link>
            </div>
          </div>

          {/* Right column: Protocol Execution Architecture Summary */}
          <div className="lg:col-span-4">
            <div className="rounded-lg border border-white/10 bg-[#18181b] p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-semibold text-zinc-200">
                  Settlement Workflow
                </span>
                <span className="font-mono text-xs text-emerald-400 tabular-nums">
                  Chain 0xe4a25
                </span>
              </div>
              <ol className="mt-4 space-y-3.5 text-xs text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="font-mono font-semibold text-zinc-200 tabular-nums">01.</span>
                  <span>
                    <strong className="font-medium text-zinc-200">Lock Collateral:</strong> Client
                    deposits ZTH into the Escrow contract alongside acceptance criteria.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono font-semibold text-zinc-200 tabular-nums">02.</span>
                  <span>
                    <strong className="font-medium text-zinc-200">Submit Deliverable:</strong>{' '}
                    Freelancer links the pull request, commit hash, or deployment endpoint.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono font-semibold text-zinc-200 tabular-nums">03.</span>
                  <span>
                    <strong className="font-medium text-zinc-200">Agent Resolution:</strong>{' '}
                    Verification oracle validates the submission and triggers instant ZTH payout.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* 4-Column Protocol Ledger Metrics */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-[#18181b] p-5">
            <div className="text-xs text-zinc-400">Total Value Locked</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-zinc-100 tabular-nums">
              {metrics.totalLocked} <span className="text-sm font-normal text-emerald-400">ZTH</span>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#18181b] p-5">
            <div className="text-xs text-zinc-400">Open Bounties</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-zinc-100 tabular-nums">
              {metrics.openCount}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#18181b] p-5">
            <div className="text-xs text-zinc-400">Awaiting Agent Audit</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-amber-400 tabular-nums">
              {metrics.reviewCount}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#18181b] p-5">
            <div className="text-xs text-zinc-400">Settled Contracts</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-emerald-400 tabular-nums">
              {metrics.completedCount}
            </div>
          </div>
        </div>
      </section>

      {/* Active Escrow Jobs Section */}
      <section className="mt-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-100">
              Escrow Ledger &amp; Open Bounties
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Inspect active smart escrow contracts deployed on Zenith EVM Testnet.
            </p>
          </div>

          {/* Search & Interactive Segmented Filter Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title, skill, or 0x..."
                className="w-full sm:w-64 rounded-md border border-white/10 bg-[#18181b] pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none transition-colors duration-200"
              />
            </div>

            <div className="flex items-center gap-1 rounded-md border border-white/10 bg-[#18181b] p-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-emerald-500 text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab === 'All' ? 'All Jobs' : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Job Cards Grid */}
        {filteredJobs.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-white/10 bg-[#18181b] p-12 text-center">
            <Terminal className="mx-auto h-6 w-6 text-zinc-400" />
            <h3 className="mt-3 font-display text-base font-bold text-zinc-100">
              No matching escrow contracts found
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-zinc-400">
              No jobs match your current status filter or search query. Clear the filter or deploy a
              new escrow job on Zenith Testnet.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setSearchQuery('');
                }}
                className="rounded-md border border-white/10 bg-[#09090b] px-4 py-2 text-xs font-medium text-zinc-200 hover:border-white/20 transition-colors duration-200 cursor-pointer"
              >
                Reset Filters
              </button>
              <Link
                href="/create"
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors duration-200"
              >
                <span>Create Job</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
