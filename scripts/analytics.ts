/**
 * DB の統計確認スクリプト（開発用）
 * 実行: bun run scripts/analytics.ts
 */

const ORG = "default";
const DB = "sakamichi";

async function tursoStats() {
	const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
	if (!TURSO_AUTH_TOKEN) throw new Error("TURSO_AUTH_TOKEN is not set");

	const res = await fetch(
		`https://api.turso.tech/v1/organizations/${ORG}/databases/${DB}/stats`,
		{
			headers: {
				Authorization: `Bearer ${TURSO_AUTH_TOKEN}`,
			},
		},
	);

	if (!res.ok) throw new Error(`Turso stats error: ${res.status}`);

	const data = (await res.json()) as {
		top_queries: Array<{
			query: string;
			rows_read: number;
			rows_written: number;
		}>;
	};

	for (const q of data.top_queries) {
		console.log(
			`rows_read=${q.rows_read}, rows_written=${q.rows_written}, query=${q.query}`,
		);
	}
}

if (import.meta.main) {
	tursoStats().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
