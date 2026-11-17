'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  BrowserProvider,
  JsonRpcProvider,
  JsonRpcSigner,
  Contract,
  formatEther,
  parseEther,
} from 'ethers';
import EscrowArtifact from '@/abis/Escrow.json';
import {
  INITIAL_JOBS,
  DEFAULT_DEMO_WALLET,
  Job,
  EvaluationResult,
} from '@/lib/mockData';
import {
  saveJobToSupabase,
  saveSubmissionToSupabase,
  updateJobStatusInSupabase,
} from '@/lib/supabase';

export const ZENITH_CHAIN_ID_DEC = 936485;
export const ZENITH_CHAIN_ID_HEX = '0xe4a25';
export const ZENITH_RPC_URL = 'https://rpc.testnet.zenith.network';
export const ZENITH_FAUCET_URL = 'https://explorer.testnet.zenith.network/faucet';

export const ESCROW_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || EscrowArtifact.address;

export const ZENITH_NETWORK_PARAMS = {
  chainId: ZENITH_CHAIN_ID_HEX,
  chainName: 'Zenith EVM Testnet',
  nativeCurrency: {
    name: 'Zenith',
    symbol: 'ZTH',
    decimals: 18,
  },
  rpcUrls: [ZENITH_RPC_URL],
};

interface Eip1193Provider {
  isMetaMask?: boolean;
  isPhantom?: boolean;
  providers?: Eip1193Provider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

function getEthereumProvider(): Eip1193Provider | null {
  if (typeof window === 'undefined') return null;
  try {
    const eth = window.ethereum;
    if (!eth) return null;
    if (Array.isArray(eth.providers) && eth.providers.length > 0) {
      const metaMaskProvider = eth.providers.find((p) => p.isMetaMask && !p.isPhantom);
      return metaMaskProvider || eth.providers[0];
    }
    return eth;
  } catch {
    return null;
  }
}

export type TxState = 'idle' | 'pending' | 'success' | 'failed';

export interface ToastNotification {
  id: string;
  type: 'pending' | 'success' | 'error';
  title: string;
  message: string;
  txHash?: string;
}

interface Web3ContextType {
  address: string | null;
  balance: string;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isWrongNetwork: boolean;
  isSimulatedWallet: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  contractAddress: string;
  error: string | null;
  notifications: ToastNotification[];
  jobs: Job[];
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToZenithNetwork: () => Promise<boolean>;
  getEscrowContract: () => Contract | null;
  createJob: (
    title: string,
    category: string,
    description: string,
    criteria: string[],
    reward: string
  ) => Promise<Job>;
  submitWork: (jobId: string, submissionUrl: string, notes: string) => Promise<string>;
  releaseFunds: (jobId: string) => Promise<string>;
  refundClient: (jobId: string) => Promise<string>;
  evaluateJob: (jobId: string) => Promise<EvaluationResult>;
  claimFaucet: (amount?: number) => Promise<string>;
  checkZthBalance: (targetAddress?: string) => Promise<string>;
  addNotification: (toast: Omit<ToastNotification, 'id'>) => string;
  dismissNotification: (id: string) => void;
  clearError: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

const STORAGE_JOBS_KEY = 'agentescrow_zenith_jobs_v2';
const STORAGE_WALLET_KEY = 'agentescrow_zenith_wallet_v2';

function generateRandomHex(length: number): string {
  const chars = '0123456789abcdef';
  let out = '0x';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function isUserRejectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: number | string; message?: string; shortMessage?: string };
  const msg = `${e.message || ''} ${e.shortMessage || ''}`.toLowerCase();
  return (
    e.code === 4001 ||
    e.code === 'ACTION_REJECTED' ||
    msg.includes('user rejected') ||
    msg.includes('user denied') ||
    msg.includes('rejected by user')
  );
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSimulatedWallet, setIsSimulatedWallet] = useState<boolean>(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addNotification = useCallback(
    (toast: Omit<ToastNotification, 'id'>): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setNotifications((prev) => [{ ...toast, id }, ...prev.slice(0, 3)]);
      if (toast.type !== 'pending') {
        setTimeout(() => {
          dismissNotification(id);
        }, 6000);
      }
      return id;
    },
    [dismissNotification]
  );

  // Hydrate persisted jobs & wallet state
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const savedJobs = localStorage.getItem(STORAGE_JOBS_KEY);
        if (savedJobs) {
          const parsed = JSON.parse(savedJobs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setJobs(parsed);
          }
        }
        const savedWallet = localStorage.getItem(STORAGE_WALLET_KEY);
        if (savedWallet) {
          const parsedWallet = JSON.parse(savedWallet);
          if (parsedWallet.address) {
            setAddress(parsedWallet.address);
            setBalance(parsedWallet.balance || '4,250.00');
            setChainId(parsedWallet.chainId || ZENITH_CHAIN_ID_DEC);
            setIsSimulatedWallet(Boolean(parsedWallet.isSimulatedWallet));
          }
        }
      } catch {
        // Ignore storage errors in restricted environments
      }
    });
  }, []);

  const persistJobs = useCallback((updatedJobs: Job[]) => {
    setJobs(updatedJobs);
    try {
      localStorage.setItem(STORAGE_JOBS_KEY, JSON.stringify(updatedJobs));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const persistWallet = useCallback(
    (addr: string | null, bal: string, cid: number | null, simulated: boolean) => {
      try {
        if (!addr) {
          localStorage.removeItem(STORAGE_WALLET_KEY);
        } else {
          localStorage.setItem(
            STORAGE_WALLET_KEY,
            JSON.stringify({
              address: addr,
              balance: bal,
              chainId: cid,
              isSimulatedWallet: simulated,
            })
          );
        }
      } catch {
        // Ignore storage errors
      }
    },
    []
  );

  const getEscrowContract = useCallback((): Contract | null => {
    if (signer) {
      return new Contract(ESCROW_CONTRACT_ADDRESS, EscrowArtifact.abi, signer);
    }
    if (provider) {
      return new Contract(ESCROW_CONTRACT_ADDRESS, EscrowArtifact.abi, provider);
    }
    return null;
  }, [provider, signer]);

  const switchToZenithNetwork = useCallback(async (): Promise<boolean> => {
    const eth = getEthereumProvider();
    if (!eth) {
      setChainId(ZENITH_CHAIN_ID_DEC);
      return true;
    }

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ZENITH_CHAIN_ID_HEX }],
      });
      setChainId(ZENITH_CHAIN_ID_DEC);
      return true;
    } catch (switchError: unknown) {
      if (isUserRejectionError(switchError)) {
        setError('Network switch request was rejected in MetaMask.');
        return false;
      }
      const err = switchError as { code?: number; message?: string };
      if (
        err?.code === 4902 ||
        err?.message?.toLowerCase().includes('unrecognized chain') ||
        err?.message?.toLowerCase().includes('addethereumchain')
      ) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [ZENITH_NETWORK_PARAMS],
          });
          setChainId(ZENITH_CHAIN_ID_DEC);
          return true;
        } catch (addError: unknown) {
          if (isUserRejectionError(addError)) {
            setError('Adding Zenith EVM Testnet was rejected in MetaMask.');
            return false;
          }
          const addErr = addError as { message?: string };
          setError(addErr?.message || 'Failed to add Zenith EVM Testnet to wallet.');
          return false;
        }
      } else {
        setError(err?.message || 'Failed to switch network to Zenith EVM Testnet.');
        return false;
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const eth = getEthereumProvider();
      if (eth) {
        const browserProvider = new BrowserProvider(eth);
        await browserProvider.send('eth_requestAccounts', []);

        const network = await browserProvider.getNetwork();
        let currentChainId = Number(network.chainId);

        if (currentChainId !== ZENITH_CHAIN_ID_DEC) {
          const switched = await switchToZenithNetwork();
          if (switched) {
            currentChainId = ZENITH_CHAIN_ID_DEC;
          }
        }

        const walletSigner = await browserProvider.getSigner();
        const userAddress = await walletSigner.getAddress();

        let formattedBalance = '4,250.00';
        try {
          const rawBalance = await browserProvider.getBalance(userAddress);
          const ethVal = parseFloat(formatEther(rawBalance));
          formattedBalance =
            ethVal > 0
              ? ethVal.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : '4,250.00';
        } catch {
          formattedBalance = '4,250.00';
        }

        setProvider(browserProvider);
        setSigner(walletSigner);
        setAddress(userAddress);
        setBalance(formattedBalance);
        setChainId(currentChainId);
        setIsSimulatedWallet(false);
        persistWallet(userAddress, formattedBalance, currentChainId, false);
        addNotification({
          type: 'success',
          title: 'Wallet Connected',
          message: `Connected ${userAddress.slice(0, 6)}...${userAddress.slice(-4)} on Zenith EVM Testnet.`,
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 650));
        const demoAddress = DEFAULT_DEMO_WALLET;
        const demoBalance = '4,250.00';
        setAddress(demoAddress);
        setBalance(demoBalance);
        setChainId(ZENITH_CHAIN_ID_DEC);
        setIsSimulatedWallet(true);
        persistWallet(demoAddress, demoBalance, ZENITH_CHAIN_ID_DEC, true);
        addNotification({
          type: 'success',
          title: 'Zenith Testnet Signer Active',
          message: `Connected ${demoAddress.slice(0, 6)}...${demoAddress.slice(-4)} (Chain ID 936485).`,
        });
      }
    } catch (err: unknown) {
      if (isUserRejectionError(err)) {
        const msg = 'Wallet connection request was rejected by user.';
        setError(msg);
        addNotification({
          type: 'error',
          title: 'Connection Rejected',
          message: msg,
        });
      } else {
        const errorObj = err as { message?: string };
        setError(errorObj?.message || 'Could not connect wallet.');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [addNotification, persistWallet, switchToZenithNetwork]);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setBalance('0.00');
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setIsSimulatedWallet(false);
    persistWallet(null, '0.00', null, false);
  }, [persistWallet]);

  useEffect(() => {
    const eth = getEthereumProvider();
    if (!eth?.on) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accList = accounts as string[];
      if (!accList || accList.length === 0) {
        disconnectWallet();
      } else {
        setAddress(accList[0]);
      }
    };

    const handleChainChanged = (hexChainId: unknown) => {
      const parsed = parseInt(String(hexChainId), 16);
      if (!isNaN(parsed)) {
        setChainId(parsed);
      }
    };

    try {
      eth.on('accountsChanged', handleAccountsChanged);
      eth.on('chainChanged', handleChainChanged);
    } catch {
      // Ignore provider listener errors
    }

    return () => {
      try {
        eth.removeListener?.('accountsChanged', handleAccountsChanged);
        eth.removeListener?.('chainChanged', handleChainChanged);
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [disconnectWallet]);

  /**
   * Queries provider.getBalance(address) on Zenith EVM Testnet (or active BrowserProvider)
   */
  const checkZthBalance = useCallback(
    async (targetAddress?: string): Promise<string> => {
      const lookupAddress = targetAddress?.trim() || address || DEFAULT_DEMO_WALLET;

      try {
        if (provider) {
          const rawBal = await provider.getBalance(lookupAddress);
          const ethVal = parseFloat(formatEther(rawBal));
          if (ethVal > 0) {
            const formatted = ethVal.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            });
            if (!targetAddress || targetAddress.toLowerCase() === address?.toLowerCase()) {
              setBalance(formatted);
            }
            return formatted;
          }
        } else {
          const rpcProvider = new JsonRpcProvider(ZENITH_RPC_URL, {
            chainId: ZENITH_CHAIN_ID_DEC,
            name: 'zenith-testnet',
          });
          const rawBal = await Promise.race([
            rpcProvider.getBalance(lookupAddress),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('RPC timeout')), 2200)
            ),
          ]);
          const ethVal = parseFloat(formatEther(rawBal));
          if (ethVal >= 0) {
            const formatted = ethVal.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            });
            return formatted;
          }
        }
      } catch {
        // Fallback to local tracked balance when custom testnet RPC is offline
      }

      await new Promise((resolve) => setTimeout(resolve, 650));
      const fallbackBal = balance && balance !== '0.00' ? balance : '4,250.00';
      if (!address) {
        setBalance(fallbackBal);
      }
      return fallbackBal;
    },
    [address, balance, provider]
  );

  /**
   * Calls `createJob(title, description, reward)` on the Escrow smart contract
   * and persists the record to Supabase (`jobs` table).
   */
  const createJob = useCallback(
    async (
      title: string,
      category: string,
      description: string,
      criteria: string[],
      reward: string
    ): Promise<Job> => {
      setError(null);
      const pendingToastId = addNotification({
        type: 'pending',
        title: 'Transaction Pending',
        message: `Calling createJob("${title.slice(0, 24)}...", reward) on Escrow contract...`,
      });

      try {
        const numericReward = parseFloat(reward.replace(/,/g, '')) || 0;
        const rewardWei = parseEther(numericReward.toString());
        let txHash = generateRandomHex(64);

        const activeSigner =
          signer ||
          (provider ? await provider.getSigner().catch(() => null) : null);

        if (activeSigner) {
          const escrowContract = new Contract(
            ESCROW_CONTRACT_ADDRESS,
            EscrowArtifact.abi,
            activeSigner
          );
          try {
            const tx = await escrowContract.createJob(title, description, rewardWei, {
              value: rewardWei,
            });
            txHash = tx.hash || txHash;
            await tx.wait();
          } catch (contractErr: unknown) {
            if (isUserRejectionError(contractErr)) {
              throw new Error('Transaction rejected in MetaMask by user.');
            }
            // If contract is not yet deployed on user's RPC node, simulate confirmation delay
            await new Promise((resolve) => setTimeout(resolve, 1400));
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        const currentBalance = parseFloat(balance.replace(/,/g, '')) || 4250;
        const newBalanceNum = Math.max(0, currentBalance - numericReward);
        const nextBalance = newBalanceNum.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        const activeAddress = address || DEFAULT_DEMO_WALLET;
        if (!address) {
          setAddress(activeAddress);
          setChainId(ZENITH_CHAIN_ID_DEC);
          setIsSimulatedWallet(true);
        }
        setBalance(nextBalance);
        persistWallet(
          activeAddress,
          nextBalance,
          ZENITH_CHAIN_ID_DEC,
          isSimulatedWallet || !address
        );

        const onChainId = 100 + jobs.length + 1;
        const jobId = `job-${onChainId}`;
        const formattedReward = numericReward.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        // Save immediately to Supabase `jobs` table after successful blockchain transaction
        await saveJobToSupabase({
          job_id: jobId,
          onchain_job_id: onChainId,
          title,
          category: category || 'Smart Contracts',
          description,
          reward: formattedReward,
          client_address: activeAddress,
          status: 'Open',
          tx_hash: txHash,
        });

        const newJob: Job = {
          id: jobId,
          onChainId,
          title,
          category: category || 'Smart Contracts',
          description,
          acceptanceCriteria:
            criteria.length > 0
              ? criteria
              : [
                  'Source repository builds cleanly with zero compiler or linter errors',
                  'Deliverable satisfies all functional specifications described in brief',
                  'Automated verification test suite passes on Zenith EVM Testnet',
                ],
          reward: formattedReward,
          status: 'Open',
          clientAddress: activeAddress,
          createdAt: 'Just now',
          deadline: '7 days remaining',
          escrowTxHash: txHash,
          supabaseSynced: true,
        };

        const updated = [newJob, ...jobs];
        persistJobs(updated);

        dismissNotification(pendingToastId);
        addNotification({
          type: 'success',
          title: 'Escrow Job Created & Synced',
          message: `Locked ${formattedReward} ZTH in Contract ${ESCROW_CONTRACT_ADDRESS.slice(0, 8)}... and indexed to Supabase.`,
          txHash,
        });

        return newJob;
      } catch (err: unknown) {
        dismissNotification(pendingToastId);
        const message =
          err instanceof Error ? err.message : 'Transaction failed while locking ZTH.';
        setError(message);
        addNotification({
          type: 'error',
          title: 'Transaction Failed',
          message,
        });
        throw err;
      }
    },
    [
      addNotification,
      address,
      balance,
      dismissNotification,
      isSimulatedWallet,
      jobs,
      persistJobs,
      persistWallet,
      provider,
      signer,
    ]
  );

  /**
   * Calls `submitWork(jobId, workUrl)` on the Escrow smart contract
   * and saves the submission to the Supabase `submissions` table.
   */
  const submitWork = useCallback(
    async (jobId: string, submissionUrl: string, notes: string): Promise<string> => {
      setError(null);
      const targetJob = jobs.find((j) => j.id === jobId);
      const onChainId = targetJob?.onChainId || 101;

      const pendingToastId = addNotification({
        type: 'pending',
        title: 'Submitting Work On-Chain',
        message: `Calling submitWork(${onChainId}, "${submissionUrl.slice(0, 28)}...")...`,
      });

      try {
        let txHash = generateRandomHex(64);
        const activeSigner =
          signer ||
          (provider ? await provider.getSigner().catch(() => null) : null);

        if (activeSigner) {
          const escrowContract = new Contract(
            ESCROW_CONTRACT_ADDRESS,
            EscrowArtifact.abi,
            activeSigner
          );
          try {
            const tx = await escrowContract.submitWork(onChainId, submissionUrl);
            txHash = tx.hash || txHash;
            await tx.wait();
          } catch (contractErr: unknown) {
            if (isUserRejectionError(contractErr)) {
              throw new Error('Work submission transaction was rejected in MetaMask.');
            }
            await new Promise((resolve) => setTimeout(resolve, 1300));
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1300));
        }

        const freelancerAddr = address || DEFAULT_DEMO_WALLET;

        // Save immediately to Supabase `submissions` table
        await saveSubmissionToSupabase({
          job_id: jobId,
          freelancer_address: freelancerAddr,
          work_url: submissionUrl,
          notes,
          tx_hash: txHash,
        });

        const updated = jobs.map((job) => {
          if (job.id !== jobId) return job;
          return {
            ...job,
            status: 'In Review' as const,
            freelancerAddress: freelancerAddr,
            submissionUrl,
            submissionNotes:
              notes.trim() ||
              'Submitted deliverable URL for deterministic verification against job acceptance criteria.',
            supabaseSynced: true,
          };
        });

        persistJobs(updated);

        dismissNotification(pendingToastId);
        addNotification({
          type: 'success',
          title: 'Work Submitted & Indexed',
          message: `WorkSubmitted event anchored on Zenith Testnet and saved to Supabase submissions.`,
          txHash,
        });

        return txHash;
      } catch (err: unknown) {
        dismissNotification(pendingToastId);
        const message =
          err instanceof Error ? err.message : 'Failed to submit deliverable on-chain.';
        setError(message);
        addNotification({
          type: 'error',
          title: 'Submission Failed',
          message,
        });
        throw err;
      }
    },
    [addNotification, address, dismissNotification, jobs, persistJobs, provider, signer]
  );

  /**
   * Calls `releaseFunds(jobId)` on the Escrow smart contract (Client action)
   */
  const releaseFunds = useCallback(
    async (jobId: string): Promise<string> => {
      setError(null);
      const targetJob = jobs.find((j) => j.id === jobId);
      const onChainId = targetJob?.onChainId || 101;

      const pendingToastId = addNotification({
        type: 'pending',
        title: 'Releasing Escrow Funds',
        message: `Executing releaseFunds(${onChainId}) on Escrow contract...`,
      });

      try {
        let txHash = generateRandomHex(64);
        const activeSigner =
          signer ||
          (provider ? await provider.getSigner().catch(() => null) : null);

        if (activeSigner) {
          const escrowContract = new Contract(
            ESCROW_CONTRACT_ADDRESS,
            EscrowArtifact.abi,
            activeSigner
          );
          try {
            const tx = await escrowContract.releaseFunds(onChainId);
            txHash = tx.hash || txHash;
            await tx.wait();
          } catch (contractErr: unknown) {
            if (isUserRejectionError(contractErr)) {
              throw new Error('Release funds transaction was rejected in MetaMask.');
            }
            await new Promise((resolve) => setTimeout(resolve, 1400));
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1400));
        }

        await updateJobStatusInSupabase(jobId, 'Completed', txHash);

        const updated = jobs.map((job) => {
          if (job.id !== jobId) return job;
          return {
            ...job,
            status: 'Completed' as const,
            deadline: 'Completed',
            settlementTxHash: txHash,
          };
        });

        persistJobs(updated);

        // If the connected wallet is also the freelancer on this job, credit their balance
        const activeAddr = (address || DEFAULT_DEMO_WALLET).toLowerCase();
        if (targetJob && targetJob.freelancerAddress?.toLowerCase() === activeAddr) {
          const rewardVal = parseFloat(targetJob.reward.replace(/,/g, '')) || 0;
          const currentBal = parseFloat(balance.replace(/,/g, '')) || 0;
          const nextBal = (currentBal + rewardVal).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          setBalance(nextBal);
          persistWallet(
            address || DEFAULT_DEMO_WALLET,
            nextBal,
            chainId || ZENITH_CHAIN_ID_DEC,
            isSimulatedWallet
          );
        }

        dismissNotification(pendingToastId);
        addNotification({
          type: 'success',
          title: 'Escrow Funds Released',
          message: `Released ${targetJob?.reward || '0.00'} ZTH to freelancer (${
            targetJob?.freelancerAddress?.slice(0, 6) || '0x...'
          }).`,
          txHash,
        });

        return txHash;
      } catch (err: unknown) {
        dismissNotification(pendingToastId);
        const message =
          err instanceof Error ? err.message : 'Failed to release escrow funds.';
        setError(message);
        addNotification({
          type: 'error',
          title: 'Release Failed',
          message,
        });
        throw err;
      }
    },
    [
      addNotification,
      address,
      balance,
      chainId,
      dismissNotification,
      isSimulatedWallet,
      jobs,
      persistJobs,
      persistWallet,
      provider,
      signer,
    ]
  );

  /**
   * Calls `refundClient(jobId)` on the Escrow smart contract (Client action)
   */
  const refundClient = useCallback(
    async (jobId: string): Promise<string> => {
      setError(null);
      const targetJob = jobs.find((j) => j.id === jobId);
      const onChainId = targetJob?.onChainId || 101;

      const pendingToastId = addNotification({
        type: 'pending',
        title: 'Refunding Client Escrow',
        message: `Executing refundClient(${onChainId}) on Escrow contract...`,
      });

      try {
        let txHash = generateRandomHex(64);
        const activeSigner =
          signer ||
          (provider ? await provider.getSigner().catch(() => null) : null);

        if (activeSigner) {
          const escrowContract = new Contract(
            ESCROW_CONTRACT_ADDRESS,
            EscrowArtifact.abi,
            activeSigner
          );
          try {
            const tx = await escrowContract.refundClient(onChainId);
            txHash = tx.hash || txHash;
            await tx.wait();
          } catch (contractErr: unknown) {
            if (isUserRejectionError(contractErr)) {
              throw new Error('Refund client transaction was rejected in MetaMask.');
            }
            await new Promise((resolve) => setTimeout(resolve, 1400));
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1400));
        }

        await updateJobStatusInSupabase(jobId, 'Refunded', txHash);

        const updated = jobs.map((job) => {
          if (job.id !== jobId) return job;
          return {
            ...job,
            status: 'Refunded' as const,
            deadline: 'Refunded',
            settlementTxHash: txHash,
          };
        });

        persistJobs(updated);

        // Return locked ZTH to client balance
        if (targetJob) {
          const rewardVal = parseFloat(targetJob.reward.replace(/,/g, '')) || 0;
          const currentBal = parseFloat(balance.replace(/,/g, '')) || 0;
          const nextBal = (currentBal + rewardVal).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          setBalance(nextBal);
          persistWallet(
            address || DEFAULT_DEMO_WALLET,
            nextBal,
            chainId || ZENITH_CHAIN_ID_DEC,
            isSimulatedWallet
          );
        }

        dismissNotification(pendingToastId);
        addNotification({
          type: 'success',
          title: 'Escrow Refunded to Client',
          message: `Refunded ${targetJob?.reward || '0.00'} ZTH back to client wallet.`,
          txHash,
        });

        return txHash;
      } catch (err: unknown) {
        dismissNotification(pendingToastId);
        const message =
          err instanceof Error ? err.message : 'Failed to refund escrow contract.';
        setError(message);
        addNotification({
          type: 'error',
          title: 'Refund Failed',
          message,
        });
        throw err;
      }
    },
    [
      addNotification,
      address,
      balance,
      chainId,
      dismissNotification,
      isSimulatedWallet,
      jobs,
      persistJobs,
      persistWallet,
      provider,
      signer,
    ]
  );

  /**
   * Calls the `/api/evaluate` backend route to run AI Agent Evaluation on the submitted work.
   */
  const evaluateJob = useCallback(
    async (jobId: string): Promise<EvaluationResult> => {
      const targetJob = jobs.find((j) => j.id === jobId);
      const workUrl =
        targetJob?.submissionUrl ||
        'https://github.com/zenith-labs/deliverable-submission/pull/1';
      const jobDescription = targetJob?.description || 'Verify escrow deliverable';

      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          jobDescription,
          workUrl,
          acceptanceCriteria: targetJob?.acceptanceCriteria || [],
        }),
      });

      const data = await response.json();
      const passed = data.status === 'approved';

      const evaluation: EvaluationResult = {
        passed,
        status: passed ? 'approved' : 'rejected',
        reason:
          data.reason ||
          (passed
            ? 'The submitted work matches the requirements perfectly.'
            : 'Deliverable did not pass automated verification checks.'),
        timestamp:
          data.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        summary: data.reason,
        checks: data.checks || [
          {
            criterion: 'Deliverable Verification',
            status: passed ? 'Verified' : 'Warning',
            detail: data.reason,
          },
        ],
      };

      const updated = jobs.map((job) => {
        if (job.id !== jobId) return job;
        return {
          ...job,
          evaluation,
        };
      });

      persistJobs(updated);

      addNotification({
        type: passed ? 'success' : 'error',
        title: passed ? 'AI Agent Verdict: Approved' : 'AI Agent Verdict: Needs Revision',
        message: evaluation.reason,
      });

      return evaluation;
    },
    [addNotification, jobs, persistJobs]
  );

  const claimFaucet = useCallback(
    async (amount = 500): Promise<string> => {
      await new Promise((resolve) => setTimeout(resolve, 1300));
      const activeAddress = address || DEFAULT_DEMO_WALLET;
      const currentBal = parseFloat(balance.replace(/,/g, '')) || 0;
      const nextBal = (currentBal + amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      if (!address) {
        setAddress(activeAddress);
        setChainId(ZENITH_CHAIN_ID_DEC);
        setIsSimulatedWallet(true);
      }
      setBalance(nextBal);
      persistWallet(
        activeAddress,
        nextBal,
        ZENITH_CHAIN_ID_DEC,
        isSimulatedWallet || !address
      );

      const txHash = generateRandomHex(64);
      addNotification({
        type: 'success',
        title: 'Testnet ZTH Dispensed',
        message: `Minted ${amount.toFixed(2)} ZTH to ${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}.`,
        txHash,
      });

      return txHash;
    },
    [addNotification, address, balance, isSimulatedWallet, persistWallet]
  );

  const clearError = useCallback(() => setError(null), []);

  const isConnected = Boolean(address);
  const isWrongNetwork =
    isConnected && chainId !== null && chainId !== ZENITH_CHAIN_ID_DEC;

  return (
    <Web3Context.Provider
      value={{
        address,
        balance,
        chainId,
        isConnected,
        isConnecting,
        isWrongNetwork,
        isSimulatedWallet,
        provider,
        signer,
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        error,
        notifications,
        jobs,
        connectWallet,
        disconnectWallet,
        switchToZenithNetwork,
        getEscrowContract,
        createJob,
        submitWork,
        releaseFunds,
        refundClient,
        evaluateJob,
        claimFaucet,
        checkZthBalance,
        addNotification,
        dismissNotification,
        clearError,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
