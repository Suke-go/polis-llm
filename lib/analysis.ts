import { sql, JsonValue } from './db';

export type StatementResult = {
  statementId: string;
  textJa: string;
  agreeRate: number;
  disagreeRate: number;
  passRate: number;
};

export type AnalysisResultsPayload = {
  sessionId: string;
  statements: StatementResult[];
  // Reserved for future PCA / clustering fields.
  // participantCoordinates?: Array<{ participantId: string; x: number; y: number; clusterId?: number }>;
};

/**
 * Run simple per-statement vote aggregation for a session and upsert into analysis_results.
 *
 * This is deliberately kept separate from the API layer so that future
 * PCA / clustering steps can extend this function (or compose it) without
 * touching route handlers.
 */
export async function runSimpleVoteAnalysis(
  sessionId: string,
): Promise<AnalysisResultsPayload> {
  if (!sessionId) {
    throw new Error('sessionId is required');
  }

  // Aggregate votes per statement.
  // We join from statements to votes so statements with zero votes are still included.
  type VoteAggregateRow = {
    statement_id: string;
    text_ja: string;
    total_votes: number | null;
    agree_count: number | null;
    disagree_count: number | null;
    pass_count: number | null;
  };

  const { rows } = await sql<VoteAggregateRow>`
    SELECT
      s.id AS statement_id,
      s.text_ja,
      COUNT(v.*) AS total_votes,
      SUM(CASE WHEN v.vote = 1 THEN 1 ELSE 0 END) AS agree_count,
      SUM(CASE WHEN v.vote = -1 THEN 1 ELSE 0 END) AS disagree_count,
      SUM(CASE WHEN v.vote = 0 THEN 1 ELSE 0 END) AS pass_count
    FROM statements s
    LEFT JOIN votes v
      ON v.statement_id = s.id
    WHERE s.session_id = ${sessionId}
      AND s.selected_for_voting = TRUE
    GROUP BY s.id, s.text_ja
    ORDER BY s.id
  `;

  const statements: StatementResult[] = rows.map((row: VoteAggregateRow) => {
    const total = Number(row.total_votes ?? 0);
    const agree = Number(row.agree_count ?? 0);
    const disagree = Number(row.disagree_count ?? 0);
    const pass = Number(row.pass_count ?? 0);

    if (total <= 0) {
      return {
        statementId: row.statement_id,
        textJa: row.text_ja,
        agreeRate: 0,
        disagreeRate: 0,
        passRate: 0,
      };
    }

    return {
      statementId: row.statement_id,
      textJa: row.text_ja,
      agreeRate: agree / total,
      disagreeRate: disagree / total,
      passRate: pass / total,
    };
  });

  const payload: AnalysisResultsPayload = {
    sessionId,
    statements,
  };

  // Persist into analysis_results as JSONB.
  // Table definition (expected):
  //   CREATE TABLE analysis_results (
  //     session_id UUID PRIMARY KEY,
  //     results_json JSONB NOT NULL,
  //     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  //   );
  const resultsJson: JsonValue = statements.map((s) => ({
    statementId: s.statementId,
    textJa: s.textJa,
    agreeRate: s.agreeRate,
    disagreeRate: s.disagreeRate,
    passRate: s.passRate,
  }));

  // Convert to JSON string for JSONB insertion
  const resultsJsonString = JSON.stringify(resultsJson);

  await sql`
    INSERT INTO analysis_results (session_id, results_json)
    VALUES (${sessionId}, ${resultsJsonString}::jsonb)
    ON CONFLICT (session_id)
    DO UPDATE SET
      results_json = EXCLUDED.results_json,
      updated_at = NOW()
  `;

  return payload;
}

/**
 * Load existing analysis_results for a session, if present.
 * Returns null when no record exists yet.
 */
export async function getSimpleVoteAnalysis(
  sessionId: string,
): Promise<StatementResult[] | null> {
  if (!sessionId) {
    throw new Error('sessionId is required');
  }

  const { rows } = await sql<{
    results_json: JsonValue | null;
  }>`
    SELECT results_json
    FROM analysis_results
    WHERE session_id = ${sessionId}
    LIMIT 1
  `;

  if (!rows[0]?.results_json) {
    return null;
  }

  const raw = rows[0].results_json as any;
  if (!Array.isArray(raw)) {
    return null;
  }

  // Perform a minimal runtime shape check / normalization.
  return raw.map((item: any): StatementResult => ({
    statementId: String(item.statementId),
    textJa: String(item.textJa ?? ''),
    agreeRate: Number(item.agreeRate ?? 0),
    disagreeRate: Number(item.disagreeRate ?? 0),
    passRate: Number(item.passRate ?? 0),
  }));
}


