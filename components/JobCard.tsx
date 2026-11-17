'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Job, truncateAddress } from '@/lib/mockData';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const getStatusStyle = (status: Job['status']) => {
    switch (status) {
      case 'Open':
        return {
          text: 'text-emerald-400',
          icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />,
        };
      case 'In Review':
        return {
          text: 'text-amber-400',
          icon: <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />,
        };
      case 'Completed':
        return {
          text: 'text-zinc-300',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />,
        };
      case 'Refunded':
        return {
          text: 'text-zinc-400',
          icon: <RotateCcw className="h-3.5 w-3.5 text-zinc-400 shrink-0" />,
        };
    }
  };

  const statusMeta = getStatusStyle(job.status);

  return (
    <Link
      href={`/job/${job.id}`}
      className="group flex flex-col justify-between rounded-lg border border-white/10 bg-[#18181b] p-6 hover:border-emerald-500/40 hover:bg-[#1c1c20] transition-all duration-200"
    >
      <div>
        {/* Unboxed Metadata Row (Zero-Pill Discipline) */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-300">{job.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-zinc-400 tabular-nums">{job.createdAt}</span>
          </div>
          <div className={`flex items-center gap-1.5 font-medium ${statusMeta.text}`}>
            {statusMeta.icon}
            <span>{job.status}</span>
          </div>
        </div>

        {/* Primary Job Title */}
        <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-zinc-100 group-hover:text-emerald-400 transition-colors duration-200">
          {job.title}
        </h3>

        {/* Description Excerpt */}
        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-zinc-400">
          {job.description}
        </p>
      </div>

      {/* Bottom Financial & Client Metadata Bar */}
      <div className="mt-6 border-t border-white/10 pt-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-400">Escrow Locked</div>
          <div className="mt-0.5 font-mono text-lg font-bold text-zinc-100 tabular-nums">
            {job.reward} <span className="text-xs font-normal text-emerald-400">ZTH</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-zinc-400">Client Address</div>
          <div className="mt-0.5 flex items-center justify-end gap-1.5 font-mono text-xs text-zinc-300 tabular-nums">
            <span>{truncateAddress(job.clientAddress)}</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </div>
        </div>
      </div>
    </Link>
  );
}
