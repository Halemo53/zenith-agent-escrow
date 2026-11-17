import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobDescription, workUrl } = body as {
      jobDescription?: string;
      workUrl?: string;
    };

    if (!jobDescription || !workUrl) {
      return NextResponse.json(
        {
          status: 'rejected',
          reason: 'Missing job description or deliverable URL for evaluation.',
        },
        { status: 400 }
      );
    }

    // Simulate 3-second autonomous AI Agent repository & specification analysis
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 80% approval rate simulation (unless URL explicitly contains "fail" or "invalid")
    const forceFail =
      workUrl.toLowerCase().includes('fail') || workUrl.toLowerCase().includes('invalid');
    const isApproved = !forceFail && Math.random() < 0.8;

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

    if (isApproved) {
      return NextResponse.json({
        status: 'approved',
        reason: 'The submitted work matches the requirements perfectly.',
        timestamp,
        checks: [
          {
            criterion: 'Deliverable Endpoint & Artifact Resolution',
            status: 'Verified',
            detail: `Target artifact (${workUrl}) resolved cleanly with valid commit integrity.`,
          },
          {
            criterion: 'Technical Specification & Invariant Audit',
            status: 'Verified',
            detail:
              'Static analysis and test runner assertions match the contract acceptance criteria.',
          },
          {
            criterion: 'Escrow Release Eligibility',
            status: 'Verified',
            detail: 'Approved for on-chain releaseFunds(jobId) execution by client.',
          },
        ],
      });
    } else {
      return NextResponse.json({
        status: 'rejected',
        reason:
          'Automated verification detected incomplete test coverage or unmet specification invariants in the submitted deliverable. Please address the findings and re-submit.',
        timestamp,
        checks: [
          {
            criterion: 'Deliverable Endpoint & Artifact Resolution',
            status: 'Verified',
            detail: `Target artifact (${workUrl}) resolved and cloned into verification sandbox.`,
          },
          {
            criterion: 'Technical Specification & Invariant Audit',
            status: 'Warning',
            detail:
              'Edge-case assertions or benchmark thresholds did not meet the required threshold.',
          },
        ],
      });
    }
  } catch {
    return NextResponse.json(
      {
        status: 'rejected',
        reason: 'Evaluation service encountered a malformed request payload.',
      },
      { status: 500 }
    );
  }
}
