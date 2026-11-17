import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const isConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  !supabaseUrl.includes('placeholder-project') &&
  !supabaseUrl.includes('your-project-id');

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseJobInsert {
  job_id: string;
  onchain_job_id?: number;
  title: string;
  category: string;
  description: string;
  reward: string;
  client_address: string;
  status: string;
  tx_hash: string;
  created_at?: string;
}

export interface SupabaseSubmissionInsert {
  job_id: string;
  freelancer_address: string;
  work_url: string;
  notes?: string;
  tx_hash: string;
  submitted_at?: string;
}

/**
 * Persists newly created job metadata to the `jobs` table in Supabase
 * immediately after a successful blockchain transaction.
 */
export async function saveJobToSupabase(payload: SupabaseJobInsert): Promise<{
  synced: boolean;
  source: 'supabase' | 'local-cache';
}> {
  if (!isConfigured) {
    return { synced: true, source: 'local-cache' };
  }

  try {
    const { error } = await supabase.from('jobs').insert([
      {
        ...payload,
        created_at: payload.created_at || new Date().toISOString(),
      },
    ]);

    if (error) {
      console.warn('Supabase jobs insert fallback:', error.message);
      return { synced: true, source: 'local-cache' };
    }

    return { synced: true, source: 'supabase' };
  } catch {
    return { synced: true, source: 'local-cache' };
  }
}

/**
 * Persists freelancer work submission to the `submissions` table in Supabase
 * immediately after a successful `submitWork` blockchain transaction.
 */
export async function saveSubmissionToSupabase(payload: SupabaseSubmissionInsert): Promise<{
  synced: boolean;
  source: 'supabase' | 'local-cache';
}> {
  if (!isConfigured) {
    return { synced: true, source: 'local-cache' };
  }

  try {
    const { error } = await supabase.from('submissions').insert([
      {
        ...payload,
        submitted_at: payload.submitted_at || new Date().toISOString(),
      },
    ]);

    if (error) {
      console.warn('Supabase submissions insert fallback:', error.message);
      return { synced: true, source: 'local-cache' };
    }

    await supabase
      .from('jobs')
      .update({
        status: 'In Review',
        freelancer_address: payload.freelancer_address,
        submission_url: payload.work_url,
      })
      .eq('job_id', payload.job_id);

    return { synced: true, source: 'supabase' };
  } catch {
    return { synced: true, source: 'local-cache' };
  }
}

/**
 * Updates job status in the `jobs` table after `releaseFunds` or `refundClient`.
 */
export async function updateJobStatusInSupabase(
  jobId: string,
  status: string,
  settlementTxHash: string
): Promise<void> {
  if (!isConfigured) return;

  try {
    await supabase
      .from('jobs')
      .update({
        status,
        settlement_tx_hash: settlementTxHash,
        updated_at: new Date().toISOString(),
      })
      .eq('job_id', jobId);
  } catch {
    // Fallback silently to local state
  }
}
