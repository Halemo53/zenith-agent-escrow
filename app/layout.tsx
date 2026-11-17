import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/context/Web3Context';
import Navbar from '@/components/Navbar';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'AgentEscrow | Zenith EVM Testnet Freelance Escrow',
  description:
    'Trustless freelance escrow and automated deliverable verification built on Zenith EVM Testnet (Chain ID 936485).',
  openGraph: {
    title: 'AgentEscrow | Zenith EVM Testnet Freelance Escrow',
    description:
      'Trustless freelance escrow and automated deliverable verification built on Zenith EVM Testnet (Chain ID 936485).',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentEscrow | Zenith EVM Testnet Freelance Escrow',
    description:
      'Trustless freelance escrow and automated deliverable verification built on Zenith EVM Testnet (Chain ID 936485).',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const walletGuardScript = `
    (function() {
      if (typeof window === 'undefined') return;
      try {
        var origDefineProperty = Object.defineProperty;
        Object.defineProperty = function(target, prop, descriptor) {
          if (target === window && (prop === 'ethereum' || prop === 'solana' || prop === 'phantom')) {
            try {
              var safeDescriptor = Object.assign({}, descriptor, { configurable: true });
              return origDefineProperty.call(Object, target, prop, safeDescriptor);
            } catch (err) {
              return target;
            }
          }
          try {
            return origDefineProperty.call(Object, target, prop, descriptor);
          } catch (err) {
            if (err && err.message && err.message.indexOf('Cannot redefine property') !== -1) {
              return target;
            }
            throw err;
          }
        };
      } catch (e) {}

      window.addEventListener('error', function(event) {
        var msg = (event && event.message) ? String(event.message) : '';
        var file = (event && event.filename) ? String(event.filename) : '';
        if (
          msg.indexOf('Cannot redefine property: ethereum') !== -1 ||
          msg.indexOf('Cannot redefine property') !== -1 ||
          file.indexOf('evmAsk.js') !== -1 ||
          file.indexOf('chrome-extension://') !== -1
        ) {
          event.stopImmediatePropagation();
          event.preventDefault();
          return false;
        }
      }, true);

      window.addEventListener('unhandledrejection', function(event) {
        var reason = event && event.reason ? String(event.reason.message || event.reason) : '';
        if (
          reason.indexOf('Cannot redefine property: ethereum') !== -1 ||
          reason.indexOf('evmAsk.js') !== -1
        ) {
          event.stopImmediatePropagation();
          event.preventDefault();
          return false;
        }
      }, true);
    })();
  `;

  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable} dark`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: walletGuardScript }} />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#09090b] font-sans text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200 flex flex-col"
      >
        <Web3Provider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 bg-[#09090b] px-6 py-8 text-xs text-zinc-400">
            <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-zinc-200">AgentEscrow Protocol</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>Non-custodial milestone settlement on Zenith EVM Testnet</span>
              </div>
              <div className="flex items-center gap-4 font-mono text-[11px] tabular-nums">
                <span>Contract: 0x7F4e...a250</span>
                <span aria-hidden="true">·</span>
                <span>Chain ID: 936485</span>
              </div>
            </div>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
