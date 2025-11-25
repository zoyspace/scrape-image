import { getClient } from "./turso-client.ts";

async function main() {
	const client = getClient();
	const groupName = "乃木坂46";

	console.log("--- Query 1: MAX(urlId) ---");
	const q1 = await client.execute({
		sql: `EXPLAIN QUERY PLAN SELECT MAX(urlId) FROM posts WHERE groupName = ?`,
		args: [groupName],
	});
	console.log(q1.rows);

	console.log("\n--- Query 2: ORDER BY id DESC LIMIT 1 ---");
	const q2 = await client.execute({
		sql: `EXPLAIN QUERY PLAN SELECT * FROM posts WHERE groupName = ? ORDER BY id DESC LIMIT 1`,
		args: [groupName],
	});
	console.log(q2.rows);
}

main();
