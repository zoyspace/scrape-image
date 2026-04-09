import type { ArticleWithImageType } from "../../types/index.ts";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = process.env.NOTION_VERSION;
const NOTION_DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;

/**
 * ArticleWithImageType 1件を Notion に登録する
 */
async function createNotionPage(
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
			Title: {
				title: [{ type: "text", text: { content: pageTitle } }],
			},
			postedAt: {
				rich_text: [{ type: "text", text: { content: article.postedAt } }],
			},
			member: {
				rich_text: [{ type: "text", text: { content: article.memberName } }],
			},
			group: {
				rich_text: [{ type: "text", text: { content: article.groupName } }],
			},
			blogTitle: {
				rich_text: [{ type: "text", text: { content: article.title } }],
			},
			from: {
				select: { name: "GitHub" },
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
 * ArticleWithImageType[] をまとめて Notion に登録する
 */
export async function insertArticlesToNotion(articles: ArticleWithImageType[]) {
	console.log("Inserting notion pages", articles.length);
	for (const article of articles) {
		console.log("notion page", article.memberName, article.postedAt);
		for (const [i, imageUrl] of article.imageUrls.entries()) {
			const indexStr = String(i + 1).padStart(2, "0");
			await createNotionPage(article, imageUrl, indexStr);
			await Bun.sleep(330); // Rate limit: 3 requests/sec
		}
	}
}
