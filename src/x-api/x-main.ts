import type { ArticleWithImageType } from "../types/types.ts";
import { xPost } from "./x-post.ts";
import { getClient, closeClient } from "../db/turso-client.ts";

export async function xMain() {
	console.log("X投稿開始");
	const client = getClient();
	const sqlForSelect = `
    SELECT * FROM posts
    WHERE isXPosted = 0
    ORDER BY postedAt ASC
    LIMIT 10
    `;

	const sqlForUpdate = `
    UPDATE posts
    SET isXPosted = 1
    WHERE id = :id
    `;
	const articlesRaw = await client.execute(sqlForSelect);
	const articles: (ArticleWithImageType & { id: number })[] =
		articlesRaw.rows.map((row) => ({
			id: row.id as number,
			groupName: row.groupName as string,
			memberName: row.memberName as string,
			title: row.title as string,
			articleUrl: row.articleUrl as string,
			urlId: row.urlId as number,
			postedAt: row.postedAt as string,
			imageUrls: [],
		}));
	const ids = articles.map(() => `?`);
	const sqlForImageSelect = `
    SELECT * FROM images
    WHERE postId IN (${ids.join(",")})
    `;
	const args: number[] = [];
	ids.forEach((_, i) => {
		if (!articles[i]) return;
		args.push(articles[i].id);
	});

	const imageRaw = await client.execute(sqlForImageSelect, args);
	const imageList = imageRaw.rows.map((row) => ({
		postId: row.postId as number,
		imageUrl: row.imageUrl as string,
	}));

	articles.forEach((article) => {
		article.imageUrls.push(
			...imageList
				.filter((image) => image.postId === article.id)
				.map((image) => image.imageUrl),
		);
	});

	for (const article of articles) {
		try {
			await xPost(article);
			await client.execute({ sql: sqlForUpdate, args: { id: article.id } });

		} catch (error) {
			console.error("xPostでエラーが発生しました", {
				articleId: article.id,
				urlId: article.urlId,
				groupName: article.groupName,
				error,
			});

			if ((error as unknown as { code: number }).code === 429) {
				console.error(
					"レートリミット(429)に達したため、残りの記事の投稿をスキップします。",
				);
			}
			break;
		}
	}
	closeClient();
}


if (import.meta.main) {
	await xMain();
}
