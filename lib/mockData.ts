export type JobStatus = 'Open' | 'In Review' | 'Completed' | 'Refunded';

export interface EvaluationResult {
  passed: boolean;
  status: 'approved' | 'rejected';
  reason: string;
  timestamp: string;
  txHash?: string;
  summary: string;
  checks: {
    criterion: string;
    status: 'Verified' | 'Warning';
    detail: string;
  }[];
}

export interface Job {
  id: string;
  onChainId: number;
  title: string;
  category: string;
  description: string;
  acceptanceCriteria: string[];
  reward: string; // in ZTH
  status: JobStatus;
  clientAddress: string;
  freelancerAddress?: string;
  createdAt: string;
  deadline: string;
  escrowTxHash: string;
  settlementTxHash?: string;
  submissionUrl?: string;
  submissionNotes?: string;
  evaluation?: EvaluationResult;
  supabaseSynced?: boolean;
}

export const DEFAULT_DEMO_WALLET = '0x71C95911E9a5D330f4D621842EC243EE134389A4';

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-101',
    onChainId: 101,
    title: 'Zero-Knowledge State Proof Verifier in Solidity',
    category: 'Smart Contracts',
    description:
      'Implement a gas-optimized Groth16 proof verifier contract targeted for the Zenith EVM execution layer. The contract must validate batched state transition proofs under 210,000 gas per call and include comprehensive Foundry fuzz tests covering malformed calldata and field overflow edge cases.',
    acceptanceCriteria: [
      'Solidity 0.8.24 implementation with custom errors and assembly pairing checks',
      'Gas benchmark report showing < 210,000 gas for single proof verification',
      '100% branch coverage across unit and stateless fuzz test suites',
    ],
    reward: '1,450.00',
    status: 'In Review',
    clientAddress: DEFAULT_DEMO_WALLET,
    freelancerAddress: '0xD42c91E73a05F82b6104E9A1c3870B5f19E2a408',
    createdAt: '2 hours ago',
    deadline: '5 days remaining',
    escrowTxHash: '0x4b91e83f20c9a4d17739e20f84a2039c11d08a49c0021f8e765a3190f12a8c31',
    submissionUrl: 'https://github.com/zenith-labs/zk-groth16-verifier/pull/8',
    submissionNotes:
      'Implemented BN254 pairing precompile wrapper in Yul assembly; single proof verification averages 184,200 gas.',
    evaluation: {
      passed: true,
      status: 'approved',
      reason: 'The submitted work matches the requirements perfectly.',
      timestamp: '2026-11-16 19:15:42 UTC',
      summary:
        'The submitted work matches the requirements perfectly. Ready for client on-chain releaseFunds(101) execution.',
      checks: [
        {
          criterion: 'Deliverable Endpoint & Artifact Resolution',
          status: 'Verified',
          detail: 'PR #8 resolved cleanly with zero compiler warnings under Solidity 0.8.24.',
        },
        {
          criterion: 'Gas Benchmark & Fuzz Suite Verification',
          status: 'Verified',
          detail: 'Average gas cost measured at 184,200 gas (< 210,000 threshold).',
        },
      ],
    },
  },
  {
    id: 'job-102',
    onChainId: 102,
    title: 'Sub-Millisecond RPC Indexer for Escrow Events',
    category: 'Backend & Indexing',
    description:
      'Build a fault-tolerant event indexer in TypeScript/Node.js or Rust that subscribes to Zenith Testnet block headers and indexes JobCreated, WorkSubmitted, and FundsReleased events into a normalized relational schema with automatic chain reorg handling up to 64 blocks.',
    acceptanceCriteria: [
      'Deterministic block cursor persistence and automatic backfill on restart',
      'Reorg detection via parentHash validation with atomic rollback',
      'GraphQL or REST query endpoint returning filtered escrow ledger histories',
    ],
    reward: '920.00',
    status: 'In Review',
    clientAddress: '0x3F19a0B4c89E21d64095c7A310e829D4b72E601A',
    freelancerAddress: DEFAULT_DEMO_WALLET,
    createdAt: '1 day ago',
    deadline: '2 days remaining',
    escrowTxHash: '0x9f30d72a18c4b5e26618d39f72b1948d22e19b58d1132e7f854b2081e03b9d42',
    submissionUrl: 'https://github.com/zenith-labs/escrow-event-indexer/pull/14',
    submissionNotes:
      'Implemented cursor-based block ingestion with 64-block sliding window reorg protection and sub-15ms PostgreSQL upsert pipeline.',
  },
  {
    id: 'job-103',
    onChainId: 103,
    title: 'Account Abstraction Paymaster SDK in TypeScript',
    category: 'SDK & Tooling',
    description:
      'Develop a lightweight TypeScript client library compatible with ethers.js v6 that constructs ERC-4337 UserOperations for sponsored ZTH gas execution during freelance deliverable submissions. Must support deterministic gas estimation and custom bundler endpoints.',
    acceptanceCriteria: [
      'Full TypeScript strict-mode types and zero runtime external dependencies beyond ethers v6',
      'Support for Zenith Testnet (Chain ID 936485) entryPoint and paymaster contracts',
      'Integration test script demonstrating gasless submitWork execution',
    ],
    reward: '680.00',
    status: 'Open',
    clientAddress: DEFAULT_DEMO_WALLET,
    createdAt: '6 hours ago',
    deadline: '4 days remaining',
    escrowTxHash: '0x2c84f19e37b2a6c45509e18d63c0837e33f20c69e2243f9a943c1072d94c7e53',
  },
  {
    id: 'job-104',
    onChainId: 104,
    title: 'Orderbook Liquidity Depth Chart & WebSocket Feed',
    category: 'Frontend Engineering',
    description:
      'Create a high-frequency financial depth visualizer component in React and HTML5 Canvas capable of rendering 500+ bid/ask ticks at 60fps without React state re-render bottlenecks. Includes reconnect backoff and snapshot-plus-delta state synchronization.',
    acceptanceCriteria: [
      'Zero layout shift and strict tabular numeral alignment across price levels',
      'WebSocket delta buffer handling out-of-order sequence numbers gracefully',
      'Responsive dark-mode inspection crosshair with cumulative ZTH volume readout',
    ],
    reward: '540.00',
    status: 'Completed',
    clientAddress: '0x1E94b7D28a64C30f5921A8d430e264F7b80C391E',
    freelancerAddress: DEFAULT_DEMO_WALLET,
    createdAt: '4 days ago',
    deadline: 'Completed',
    escrowTxHash: '0x7a12c94b05d8e3f14492b07c51d9726f44a31d70f3354a8b032d0961c85d6f64',
    settlementTxHash: '0x5e83a10d94f2b7c63381a96b40c8615e55b42e81a4465b9c121e9850b74e5a75',
    submissionUrl: 'https://github.com/zenith-labs/orderbook-depth-canvas/releases/tag/v1.0.2',
    submissionNotes:
      'Delivered offscreen canvas renderer with ring-buffer delta reconciliation and full unit tests.',
    evaluation: {
      passed: true,
      status: 'approved',
      reason: 'The submitted work matches the requirements perfectly.',
      timestamp: '2026-11-15 18:42:10 UTC',
      txHash: '0x5e83a10d94f2b7c63381a96b40c8615e55b42e81a4465b9c121e9850b74e5a75',
      summary:
        'Repository structure, build integrity, and acceptance criteria verified. Canvas rendering loop maintains 60fps under 1,000 simulated L2 updates/sec with deterministic sequence gap recovery.',
      checks: [
        {
          criterion: 'Repository & Build Accessibility',
          status: 'Verified',
          detail: 'Release tag v1.0.2 resolves cleanly; TypeScript strict build passes with zero warnings.',
        },
        {
          criterion: '60fps Canvas & Delta Sync Implementation',
          status: 'Verified',
          detail: 'RequestAnimationFrame loop decoupled from React state; sequence gap buffer verified.',
        },
        {
          criterion: 'Test Suite & Coverage Verification',
          status: 'Verified',
          detail: '28/28 Vitest assertions passing across snapshot reconciliation edge cases.',
        },
      ],
    },
  },
  {
    id: 'job-105',
    onChainId: 105,
    title: 'Cross-Chain Escrow Bridge Adapter Security Audit',
    category: 'Security & Auditing',
    description:
      'Perform a line-by-line security review of our lock-and-mint escrow bridge adapter connecting Zenith EVM Testnet to Ethereum Sepolia. Focus on replay protection across chain forks, signature malleability, and timelock emergency withdrawal invariants.',
    acceptanceCriteria: [
      'Structured markdown audit report classifying findings by severity and likelihood',
      'Foundry PoC exploit tests for any medium, high, or critical vulnerabilities',
      'Verification of EIP-712 domain separator and nonce invalidation logic',
    ],
    reward: '2,100.00',
    status: 'Open',
    clientAddress: '0x5D72a9C31e80B46f1930E5b840f381D9c62A410B',
    freelancerAddress: DEFAULT_DEMO_WALLET,
    createdAt: '14 hours ago',
    deadline: '7 days remaining',
    escrowTxHash: '0x8d23f05c16e9a4b23371c08d62e0837a55b42e81f4465b9c121e9850b74e5a86',
  },
  {
    id: 'job-106',
    onChainId: 106,
    title: 'Deterministic Deliverable Hash Attestation CLI',
    category: 'SDK & Tooling',
    description:
      'Build a cross-platform CLI tool that packages a freelancer code repository into a reproducible tar archive, computes its SHA-256 and IPFS CIDv1 digest, and signs an EIP-191 attestation payload ready for on-chain escrow verification.',
    acceptanceCriteria: [
      'Identical SHA-256 output across Linux and macOS regardless of file mtime metadata',
      'Automatic exclusion of .git, node_modules, and build artifacts via .escrowignore',
      'Direct integration with Zenith Testnet RPC for one-command work submission',
    ],
    reward: '420.00',
    status: 'Completed',
    clientAddress: DEFAULT_DEMO_WALLET,
    freelancerAddress: '0x9B41e8C52f70D19a3842F6c150d392A6e71B804C',
    createdAt: '3 days ago',
    deadline: 'Completed',
    escrowTxHash: '0x1f04e82b93d7c5a12260b97e41d9615b66c53f92a5576c0d232f0961c85d6b97',
    settlementTxHash: '0x3a92d14c80e1f4b71190c83a52e0714d88b12a03c6681b9e410d7320a19f4e11',
    submissionUrl: 'https://github.com/zenith-labs/attestation-cli/releases/tag/v0.4.0',
    submissionNotes: 'Cross-platform tar header normalization verified on Ubuntu and macOS.',
    evaluation: {
      passed: true,
      status: 'approved',
      reason: 'The submitted work matches the requirements perfectly.',
      timestamp: '2026-11-14 14:20:05 UTC',
      txHash: '0x3a92d14c80e1f4b71190c83a52e0714d88b12a03c6681b9e410d7320a19f4e11',
      summary: 'Deterministic SHA-256 digest verified across POSIX and Darwin builds.',
      checks: [
        {
          criterion: 'Reproducible Archive Digest',
          status: 'Verified',
          detail: 'SHA-256 outputs match byte-for-byte across Linux and macOS runners.',
        },
      ],
    },
  },
];

export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
