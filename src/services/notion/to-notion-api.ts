// src/notion/insert-articles.ts
import type { ArticleWithImageType } from "../../shared/types/types.ts";

// 環境変数
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = process.env.NOTION_VERSION; // あなたの環境に合わせて
const NOTION_DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;

/**
 * ArticleWithImageType 1件を Notion に登録する
 */
async function createNotionPageFromArticle(
	article: ArticleWithImageType,
	imageUrl: string,
	indexStr: string,
) {
	if (!NOTION_API_KEY) throw new Error("NOTION_API_KEY is not set");
	if (!NOTION_DATA_SOURCE_ID)
		throw new Error("NOTION_DATA_SOURCE_ID is not set");
	if (!NOTION_VERSION) throw new Error("NOTION_VERSION is not set");

	const pageTitle = `${article.memberName} #${article.urlId} image${indexStr}`;

	const body = {
		parent: {
			type: "data_source_id",
			data_source_id: NOTION_DATA_SOURCE_ID,
		},
		properties: {
			// ページタイトル
			Title: {
				title: [{ type: "text", text: { content: pageTitle } }],
			},
			// DB構造に合わせた各列
			postedAt: {
				rich_text: [
					{
						type: "text",
						text: {
							content: article.postedAt,
						},
					},
				],
			},

			member: {
				rich_text: [
					{
						type: "text",
						text: {
							content: article.memberName,
						},
					},
				],
			},
			group: {
				rich_text: [
					{
						type: "text",
						text: {
							content: article.groupName,
						},
					},
				],
			},
			blogTitle: {
				rich_text: [
					{
						type: "text",
						text: {
							content: article.title,
						},
					},
				],
			},
			from: {
				select: {
					name: "GitHub", // data source の options に存在する値
				},
			},
			blog: {
				type: "url",
				url: article.articleUrl,
			},
			image: {
				type: "url",
				url: imageUrl,
			},
		},
	};

	const res = await fetch("https://api.notion.com/v1/pages", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${NOTION_API_KEY}`,
			"Content-Type": "application/json",
			"Notion-Version": NOTION_VERSION,
		},
		body: JSON.stringify(body),
	});

	const data = await res.json().catch(async () => ({ raw: await res.text() }));

	if (!res.ok) {
		console.error("Failed to create page:", JSON.stringify(data, null, 2));
		throw new Error(
			`Notion API error: ${res.status} ${res.statusText} - ${(data as { message?: string })?.message ?? ""}`,
		);
	}
	return data;
}

/**
 * ArticleWithImageType[] をまとめて登録する
 */
export async function insertArticlesToNotion(articles: ArticleWithImageType[]) {
	for (const article of articles) {
		console.log("Inserting notion page", article.memberName);
		for (const [i, imageUrl] of article.imageUrls.entries()) {
			const indexStr = String(i + 1).padStart(2, "0");

			await createNotionPageFromArticle(article, imageUrl, indexStr);
			await Bun.sleep(330); // Rate limit: 3 requests per second
		}
	}
}

// ---------------------
// 実行サンプル
// ---------------------

// const testArticle: ArticleWithImageType[] = [
// 	{
// 		memberName: "山下美月",
// 		postedAt: "2025-11-21 10:30:00",
// 		articleUrl: "https://www.nogizaka46.com/s/n46/diary/detail/123456",
// 		title: "久しぶりのブログ更新です！",
// 		urlId: 123456,
// 		groupName: "乃木坂46",
// 		imageUrls: [
// 			"https://img.nogizaka46.com/blog/mizuki_yamashita/0000/01.jpg",
// 			"https://img.nogizaka46.com/blog/mizuki_yamashita/0000/02.jpg",
// 		],
// 	},
// ];

// async function main() {
// 	await insertArticlesToNotion(testArticle);
// }

// main().catch((err) => {
// 	console.error(err);
// 	process.exit(1);
// });
