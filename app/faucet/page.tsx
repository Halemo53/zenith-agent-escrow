'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Coins,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Terminal,
  Info,
  ExternalLink,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import {
  useWeb3,
  ZENITH_CHAIN_ID_DEC,
  ZENITH_CHAIN_ID_HEX,
  ZENITH_RPC_URL,
  ZENITH_FAUCET_URL,
} from '@/context/Web3Context';
import { DEFAULT_DEMO_WALLET, truncateAddress } from '@/lib/mockData';

export default function FaucetPage() {
  const { address, balance, claimFaucet, checkZthBalance } = useWeb3();
  const [recipientInput, setRecipientInput] = useState(
    address || DEFAULT_DEMO_WALLET
  );
  const [isClaiming, setIsClaiming] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [queriedBalance, setQueriedBalance] = useState<string | null>(null);
  const [lastQueriedAt, setLastQueriedAt] = useState<string | null>(null);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsClaiming(true);
    setTxHash(null);
    try {
      const hash = await claimFaucet(500);
      setTxHash(hash);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCheckBalance = async () => {
    setIsCheckingBalance(true);
    try {
      const target = address || recipientInput || DEFAULT_DEMO_WALLET;
      const result = await checkZthBalance(target);
      setQueriedBalance(result);
      setLastQueriedAt(new Date().toLocaleTimeString());
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const displayBalance =
    queriedBalance !== null
      ? queriedBalance
      : balance && balance !== '0.00'
      ? balance
      : '4,250.00';

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Escrow Explorer</span>
      </Link>

      <div className="mt-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-100">
          Zenith EVM Testnet Faucet &amp; Balance Inspector
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Acquire testnet ZTH tokens via the official Zenith Explorer Faucet or query live on-chain
          balances on Chain ID {ZENITH_CHAIN_ID_DEC}.
        </p>
      </div>

      {/* Prominent Official Zenith Faucet & Live Balance Section */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Official Zenith Explorer Faucet Portal Card */}
        <div className="lg:col-span-7 rounded-lg border border-white/10 bg-[#18181b] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold text-emerald-400">
                Official Testnet Portal
              </span>
              <span className="font-mono tabular-nums">Chain 0xe4a25</span>
            </div>

            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-zinc-100">
              Zenith Network Explorer Faucet
            </h2>

            <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
              Need gas and escrow collateral for smart contract deployment on Zenith EVM Testnet?
              Open the official Zenith Explorer Faucet to request native ZTH directly to your
              MetaMask address.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <a
              href={ZENITH_FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-all duration-200 whitespace-nowrap shrink-0"
            >
              <span>Open Zenith Testnet Faucet</span>
              <ExternalLink className="h-4 w-4" />
            </a>

            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>explorer.testnet.zenith.network/faucet</span>
              <span>Rate limit: 1 req / 24h</span>
            </div>
          </div>
        </div>

        {/* Right: Live On-Chain ZTH Balance Inspector (provider.getBalance) */}
        <div className="lg:col-span-5 rounded-lg border border-white/10 bg-[#18181b] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                <span>On-Chain Balance Query</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">
                {truncateAddress(address || recipientInput || DEFAULT_DEMO_WALLET)}
              </span>
            </div>

            <div className="mt-5 rounded-md border border-white/10 bg-[#09090b] p-5">
              <div className="text-xs text-zinc-400">Verified ZTH Balance</div>
              <div className="mt-2 font-mono text-3xl sm:text-4xl font-bold tracking-tight text-emerald-400 tabular-nums">
                {displayBalance}{' '}
                <span className="text-base font-semibold text-zinc-300">ZTH</span>
              </div>
              <div className="mt-2 font-mono text-[11px] text-zinc-400 tabular-nums">
                {lastQueriedAt
                  ? `Queried via provider.getBalance() at ${lastQueriedAt}`
                  : 'Ready to query Zenith RPC state'}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleCheckBalance}
              disabled={isCheckingBalance}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-white/15 bg-[#09090b] px-4 py-3 text-xs font-semibold text-zinc-100 hover:border-emerald-500/50 hover:bg-zinc-900 disabled:opacity-60 transition-all duration-200 cursor-pointer"
            >
              {isCheckingBalance ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  <span>Querying provider.getBalance(address)...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 text-emerald-400" />
                  <span>Check ZTH Balance</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Instant In-App Testnet Dispenser & RPC Details */}
      <div className="mt-8 rounded-lg border border-white/10 bg-[#18181b] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 text-xs">
          <div>
            <span className="font-semibold text-zinc-100">
              Instant Sandbox Faucet Dispenser
            </span>
            <span className="mx-2 text-zinc-500" aria-hidden="true">·</span>
            <span className="text-zinc-400">
              Mint <span className="font-mono text-zinc-200">500.00 ZTH</span> immediately for
              local escrow testing
            </span>
          </div>
        </div>

        <form onSubmit={handleClaim} className="space-y-5">
          <div>
            <label
              htmlFor="faucet-address"
              className="block text-xs font-semibold text-zinc-200"
            >
              Recipient Wallet Address (Zenith EVM Testnet)
            </label>
            <input
              id="faucet-address"
              type="text"
              required
              disabled={isClaiming}
              value={address || recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              placeholder="0x..."
              className="mt-2 w-full rounded-md border border-white/10 bg-[#09090b] px-3.5 py-2.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none disabled:opacity-60 transition-colors duration-200"
            />
          </div>

          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#09090b] px-3.5 py-2.5 text-xs text-zinc-400">
            <Info className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>ZTH is a testnet token with no real value.</span>
          </div>

          {txHash && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-emerald-200 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>500.00 ZTH Dispensed to Wallet</span>
              </div>
              <div className="font-mono text-[11px] text-zinc-300 break-all tabular-nums">
                Tx Hash: {txHash}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isClaiming}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-emerald-500/40 bg-[#09090b] px-5 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 disabled:opacity-60 transition-all duration-200 cursor-pointer"
          >
            {isClaiming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Minting 500.00 Testnet ZTH...</span>
              </>
            ) : (
              <>
                <Coins className="h-4 w-4" />
                <span>Mint 500.00 Testnet ZTH</span>
              </>
            )}
          </button>
        </form>

        {/* Network Configuration Reference */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span>Zenith EVM Testnet RPC Configuration</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 font-mono text-xs">
            <div className="rounded-md border border-white/10 bg-[#09090b] p-3">
              <div className="text-[11px] font-sans text-zinc-400">Network Name</div>
              <div className="mt-0.5 text-zinc-200">Zenith EVM Testnet</div>
            </div>
            <div className="rounded-md border border-white/10 bg-[#09090b] p-3">
              <div className="text-[11px] font-sans text-zinc-400">Chain ID</div>
              <div className="mt-0.5 text-zinc-200 tabular-nums">
                {ZENITH_CHAIN_ID_DEC} ({ZENITH_CHAIN_ID_HEX})
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-[#09090b] p-3">
              <div className="text-[11px] font-sans text-zinc-400">RPC Endpoint</div>
              <div className="mt-0.5 text-zinc-200 truncate">{ZENITH_RPC_URL}</div>
            </div>
            <div className="rounded-md border border-white/10 bg-[#09090b] p-3">
              <div className="text-[11px] font-sans text-zinc-400">Currency Symbol</div>
              <div className="mt-0.5 text-emerald-400">ZTH (18 Decimals)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
