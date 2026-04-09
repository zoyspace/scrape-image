import type {
	InsertPostInput,
	InsertResult,
	LibSQLExecuteResult,
} from "../types/index.ts";
import { getClient } from "./client.ts";

export async function insertPosts(
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
			// posts を UPSERT して id を取得（ON CONFLICT DO NOTHING ... RETURNING）
			const postRes: LibSQLExecuteResult = await tx.execute({
				sql: `INSERT INTO posts (groupName, memberName, title, urlId, articleUrl, postedAt)
          VALUES (:groupName, :memberName, :title, :urlId, :articleUrl, :postedAt)
          ON CONFLICT(groupName, urlId) DO NOTHING
          RETURNING id;`,
				args: {
					":groupName": p.groupName,
					":memberName": p.memberName,
					":title": p.title,
					":urlId": p.urlId,
					":articleUrl": p.articleUrl,
					":postedAt": p.postedAt,
				},
			});

			const postId = Number(postRes.rows[0]?.id);
			postIds.push(postId);

			// rowsAffected で実際に挿入された件数を加算（DO NOTHING 時は 0）
			postInserted += postRes.rowsAffected;

			if (p.imageUrls?.length) {
				// libSQL batch で往復回数を削減
				const imgResults = await tx.batch(
					p.imageUrls.map((url) => ({
						sql: `INSERT INTO images (postId, memberName, postedAt, imageUrl)
               			VALUES (:postId, :memberName, :postedAt, :imageUrl)
               			ON CONFLICT(postId, imageUrl) DO NOTHING;`,
						args: {
							":postId": postId,
							":memberName": p.memberName,
							":postedAt": p.postedAt,
							":imageUrl": url,
						},
					})),
				);
				for (const imgRes of imgResults) {
					imageInserted += imgRes.rowsAffected;
				}
			}
		}

		console.log(
			groupName,
			"postInserted:",
			postInserted,
			"imageInserted:",
			imageInserted,
		);
		await tx.commit();
		return { postInserted, imageInserted, postUpsertedIds: postIds };
	} catch (err) {
		await tx.rollback();
		throw err;
	}
}

/** 接続確認用 ping */
export async function ping(): Promise<boolean> {
	const client = getClient();
	const r = await client.execute("SELECT 1 as ok");
	return r.rows[0]?.ok === 1;
}
