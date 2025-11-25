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

	console.log("\n--- Query 2");
	const q2 = await client.execute({
		sql: `EXPLAIN QUERY PLAN SELECT urlId
      FROM posts
      WHERE groupName = :groupName
        AND urlId IN (:id0,:id1,:id2,:id3,:id4,:id5,:id6,:id7,:id8,:id9,:id10,:id11)`,
		args: {
			groupName,
			id0: 29179,
			id1: 29280,
			id2: 29706,
			id3: 29807,
			id4: 29913,
			id5: 29914,
			id6: 29915,
			id7: 29916,
			id8: 29917,
			id9: 29918,
			id10: 29919,
			id11: 29920,
		},
	});
	console.log(q2.rows);
}

main();
