import { getClient } from "./client.ts";

export async function main1() {
	const client = getClient();
	const sql = `
      SELECT count(id)
      FROM posts
    `;
	const res = await client.execute(sql);
	console.log(res);
	console.log(res.rows);
	console.log(res.rows[0]);
}
export async function main2() {
	const client = getClient();
	const sql = `
      SELECT MAX(urlId) FROM posts where groupName = "乃木坂46";

    `;
	const res = await client.execute(sql);
	console.log(res.rows);
}

const ORG = "default";
const DB = "sakamichi";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
export async function main() {
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

	// rows_read が多すぎるクエリを探す
	for (const q of data.top_queries) {
		console.log(
			`rows_read=${q.rows_read}, rows_written=${q.rows_written}, query=${q.query}`,
		);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
