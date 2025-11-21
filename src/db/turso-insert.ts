import { getClient } from "./turso-client.ts";
import type { InsertPostInput } from "../types/types.ts";
import type { InsertResult } from "../types/types.ts";
import type { LibSQLExecuteResult } from "../types/types.ts";


// libSQL/Turso のトランザクションで UPSERT + 画像の一括投入
export async function insertPostsTurso(
	groupName: string,
	insertData: InsertPostInput[],
): Promise<InsertResult> {
	const client = getClient();

	if (!Array.isArray(insertData) || insertData.length === 0) {
		return { postInserted: 0, imageInserted: 0, postUpsertedIds: [] };
	}

	const tx = await client.transaction("write");
	try {
		let postInserted = 0;
		let imageInserted = 0;
		const postIds: number[] = [];

		for (const p of insertData) {
			// 1) posts を UPSERT して id を取得（SQLite 互換の ON CONFLICT DO UPDATE ... RETURNING）
			const postRes: LibSQLExecuteResult = await tx.execute({
				sql: `
          INSERT INTO posts (groupName, memberName, title, urlId, articleUrl, postedAt)
          VALUES (:groupName, :memberName, :title, :urlId, :articleUrl, :postedAt)
          ON CONFLICT(groupName, urlId) DO NOTHING
          RETURNING id;
        `,
				args: {
					":groupName": p.groupName,
					":memberName": p.memberName,
					":title": p.title,
					":urlId": p.urlId,
					":articleUrl": p.articleUrl,
					":postedAt": p.postedAt,
				},
			});
			// console.log("postRes:", postRes);
			// {
			//     columns: [ "id" ],
			//     columnTypes: [ "INTEGER" ],
			//     rows: [
			//       {
			//         "0": 81,
			//         length: 1,
			//         id: 81,
			//       }
			//     ],
			//     rowsAffected: 1,
			//     lastInsertRowid: 81n,
			//     toJSON: [Function: toJSON],
			// }

			const postId = Number(postRes.rows[0]?.id);
			// if (!Number.isFinite(postId)) {
			//   throw new Error("Failed to obtain post id");
			// }
			postIds.push(postId);

			postInserted += 1;

			if (p.imageUrls?.length) {
				// libSQL は batch をサポート（2024以降）しているので、まとめて実行して往復回数を減らす。
				const imgResults = await tx.batch(
					p.imageUrls.map((url) => ({
						sql: `
              INSERT INTO images (postId, memberName, postedAt, imageUrl)
              VALUES (:postId, :memberName, :postedAt, :imageUrl)
              ON CONFLICT(postId, imageUrl) DO NOTHING;
            `,
						args: {
							":postId": postId,
							":memberName": p.memberName,
							":postedAt": p.postedAt,
							":imageUrl": url,
						},
					})),
				);
				// console.log("imgResults:", imgResults);
				//       imgResults: [
				// ResultSetImpl {
				//   columns: [],
				//   columnTypes: [],
				//   rows: [],
				//   rowsAffected: 1,
				//   lastInsertRowid: 297n,
				//   toJSON: [Function: toJSON],
				// }, ResultSetImpl {
				//   columns: [],
				//   columnTypes: [],
				//   rows: [],
				//   rowsAffected: 1,
				//   lastInsertRowid: 298n,
				//   toJSON: [Function: toJSON],
				// }, ResultSetImpl
				// rowsAffected は挿入時 1、重複時 0
				for (const imgRes of imgResults) {
					imageInserted += imgRes.rowsAffected;
				}
				// imageInserted += imgResults.map(r => r.rowsAffected ?? 0).reduce((a, b) => a + b, 0);
			}
		}
		console.log(groupName, "postInserted:", postInserted, "imageInserted:", imageInserted);
		await tx.commit();
		return { postInserted, imageInserted, postUpsertedIds: postIds };
	} catch (err) {
		await tx.rollback();
		throw err;
	}
}

// 単一 DB への ping
export async function ping(): Promise<boolean> {
	const client = getClient();

	const r = await client.execute("SELECT 1 as ok");
	return r.rows[0]?.ok === 1;
}
