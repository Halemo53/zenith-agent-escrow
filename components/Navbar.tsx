'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Wallet,
  Loader2,
  AlertTriangle,
  LogOut,
  RefreshCw,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { useWeb3, ZENITH_CHAIN_ID_DEC } from '@/context/Web3Context';
import { truncateAddress } from '@/lib/mockData';

export default function Navbar() {
  const pathname = usePathname();
  const {
    address,
    balance,
    isConnected,
    isConnecting,
    isWrongNetwork,
    error,
    notifications,
    connectWallet,
    disconnectWallet,
    switchToZenithNetwork,
    dismissNotification,
    clearError,
  } = useWeb3();

  const navItems = [
    { label: 'Explorer', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Create Job', href: '/create' },
    { label: 'Faucet', href: '/faucet' },
  ];

  return (
    <>
      <div className="sticky top-0 z-40 w-full bg-[#09090b]/95 backdrop-blur-md">
        {/* Subtle Top Testnet Banner */}
        <div className="border-b border-white/10 bg-[#18181b] px-4 py-2 text-xs text-zinc-400">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>Zenith Testnet Demo. ZTH has no real value.</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-zinc-400 tabular-nums">
              <span>Network: Zenith EVM Testnet</span>
              <span aria-hidden="true">·</span>
              <span>Chain ID: {ZENITH_CHAIN_ID_DEC} (0xe4a25)</span>
              <span aria-hidden="true">·</span>
              <span>RPC: rpc.testnet.zenith.network</span>
            </div>
          </div>
        </div>

        {/* Main Top Navigation Bar (Strict 3-Zone Contract) */}
        <header className="border-b border-white/10 px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-8">
            {/* Zone 1: Brand Wordmark */}
            <Link
              href="/"
              className="font-display text-lg font-bold tracking-tight text-zinc-100 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity duration-200"
            >
              AgentEscrow
            </Link>

            {/* Zone 2: Navigation Links */}
            <nav className="flex items-center gap-6 text-sm font-medium">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/' || pathname.startsWith('/job')
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap shrink-0 py-1 transition-colors duration-200 border-b-2 ${
                      isActive
                        ? 'border-emerald-500 text-zinc-100'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Zone 3: Wallet Primary Action */}
            <div className="flex items-center gap-3 shrink-0">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60 transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" />
                      <span>Connect Wallet</span>
                    </>
                  )}
                </button>
              ) : isWrongNetwork ? (
                <button
                  type="button"
                  onClick={switchToZenithNetwork}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Switch to Zenith (936485)</span>
                </button>
              ) : (
                <div className="flex items-center rounded-md border border-white/10 bg-[#18181b] p-1">
                  <div className="px-3 py-1 font-mono text-xs font-medium text-emerald-400 tabular-nums whitespace-nowrap shrink-0">
                    {balance} ZTH
                  </div>
                  <div className="flex items-center gap-2 rounded bg-[#09090b] px-3 py-1 font-mono text-xs text-zinc-200 border border-white/10 tabular-nums whitespace-nowrap shrink-0">
                    <span>{truncateAddress(address || '')}</span>
                    <button
                      type="button"
                      onClick={disconnectWallet}
                      title="Disconnect Wallet"
                      className="ml-1 text-zinc-400 hover:text-zinc-100 transition-colors duration-200 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Error Bar if any wallet error occurs */}
        {error && (
          <div className="border-b border-red-500/30 bg-red-950/40 px-6 py-2 text-xs text-red-200">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="text-xs font-medium text-red-300 underline hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Transaction Toasts */}
      {notifications.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
          {notifications.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start justify-between gap-3 rounded-lg border border-white/15 bg-[#18181b] p-4 shadow-xl"
            >
              <div className="flex items-start gap-2.5">
                {toast.type === 'pending' && (
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-emerald-400" />
                )}
                {toast.type === 'success' && (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                )}
                {toast.type === 'error' && (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                )}
                <div className="text-xs">
                  <div className="font-semibold text-zinc-100">{toast.title}</div>
                  <div className="mt-0.5 text-zinc-400 leading-relaxed">{toast.message}</div>
                  {toast.txHash && (
                    <div className="mt-1.5 font-mono text-[11px] text-emerald-400 tabular-nums">
                      Tx: {truncateAddress(toast.txHash)}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismissNotification(toast.id)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                aria-label="Close notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
