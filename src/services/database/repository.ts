import type {
	InsertPostInput,
	InsertResult,
	LibSQLExecuteResult,
} from "../../shared/types/types.ts";
import { getClient } from "./client.ts";

export class PostRepository {
	private client = getClient();

	/**
	 * 記事と画像をデータベースに挿入（または更新）します。
	 */
	async insertPosts(
		groupName: string,
		insertData: InsertPostInput[],
	): Promise<InsertResult> {
		if (!Array.isArray(insertData) || insertData.length === 0) {
			return { postInserted: 0, imageInserted: 0, postUpsertedIds: [] };
		}

		const tx = await this.client.transaction("write");
		try {
			let postInserted = 0;
			let imageInserted = 0;
			const postIds: number[] = [];

			for (const p of insertData) {
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
				postInserted += 1;

				if (p.imageUrls?.length) {
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

	/**
	 * 指定された urlId のリストの中から、まだデータベースに存在しないものを返します。
	 */
	async filterNewPosts(
		groupName: string,
		inputUrlIds: number[],
	): Promise<number[]> {
		if (inputUrlIds.length === 0) return [];

		const existingSet = new Set<number>();
		const names = inputUrlIds.map((_, i) => `:id${i}`);
		const sql = `SELECT urlId FROM posts WHERE groupName = :groupName AND urlId IN (${names.join(",")})`;

		const args: Record<string, number | string> = {
			":groupName": groupName,
		};
		inputUrlIds.forEach((v, i) => {
			args[`:id${i}`] = v;
		});

		const res = await this.client.execute({ sql, args });
		for (const row of res.rows) {
			const v = Number(row.urlId);
			if (Number.isFinite(v)) existingSet.add(v);
		}

		const notFound = inputUrlIds.filter((id) => !existingSet.has(id));
		console.log(
			`${groupName} Duplicate check found:${existingSet.size}, not found:${notFound.length}.`,
		);

		if (inputUrlIds.length === notFound.length) {
			console.warn(
				groupName,
				"⚠️最新記事取得漏れの可能性があります!!!",
				inputUrlIds.join(","),
			);
			process.exitCode = 1;
		}

		return notFound;
	}

	/**
	 * 最大の urlId を使用して重複チェックを行います。
	 */
	async filterNewPostsByMaxId(
		groupName: string,
		inputUrlIds: number[],
	): Promise<number[]> {
		if (inputUrlIds.length === 0) return [];

		const sql =
			"SELECT max(urlId) as maxId FROM posts WHERE groupName = :groupName";
		const maxRes = await this.client.execute({
			sql,
			args: { ":groupName": groupName },
		});
		const maxUrlId = Number(maxRes.rows[0]?.maxId ?? 0);

		const notFound = inputUrlIds.filter((id) => id > maxUrlId);
		const foundCount = inputUrlIds.length - notFound.length;

		console.log(
			`${groupName} Duplicate check (MaxId) found:${foundCount}, not found:${notFound.length}.`,
		);

		if (inputUrlIds.length === notFound.length) {
			console.warn(
				groupName,
				"⚠️最新記事取得漏れの可能性があります!!!",
				inputUrlIds.join(","),
			);
			process.exitCode = 1;
		}

		return notFound;
	}

	/**
	 * データベースへの接続確認を行います。
	 */
	async ping(): Promise<boolean> {
		const r = await this.client.execute("SELECT 1 as ok");
		return r.rows[0]?.ok === 1;
	}
}
