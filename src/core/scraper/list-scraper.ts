import * as cheerio from "cheerio";
import type { ArticleType } from "../../shared/types/types.ts";
import { toSQLiteDateTime } from "../../shared/utils/toSQLiteDateTime.ts";

export async function fetchNewArticleList({
	groupName,
	baseUrl,
	newPages,
	newListSelectors,
}: {
	groupName: string;
	baseUrl: string;
	newPages: string;
	newListSelectors: { cards: string; title: string; url: string; date: string };
}): Promise<ArticleType[]> {
	const results: ArticleType[] = [];
	const pattern = /detail\/(\d+)/;
	const res = await fetch(newPages);
	if (!res.ok) {
		throw new Error(`HTTP Error: ${res.status}`);
	}

	const html = await res.text();
	const $ = cheerio.load(html);
	const cards = $(newListSelectors.cards);
	if (cards.length === 0) {
		console.warn("⚠️ No articles found. Check selector or page structure.");
	}

	cards.each((_, el) => {
		const title = $(el).find(newListSelectors.title).text().trim();

		const partUrl = newListSelectors.url
			? ($(el).find(newListSelectors.url).attr("href") ?? "")
			: $(el).attr("href");
		if (!partUrl) {
			console.warn(`⚠️ Invalid url : ${partUrl}`);
			throw new Error(`Invalid url : ${partUrl}`);
		}

		const articleUrl = baseUrl + partUrl;
		const postedAtRaw = $(el).find(newListSelectors.date).text().trim();
		const postedAt = toSQLiteDateTime(postedAtRaw);
		const re = articleUrl.match(pattern);
		const urlId = Number(re?.[1]) || 0;

		results.push({ title, articleUrl, postedAt, urlId });
	});

	console.log(`${groupName} found ${results.length} articles`);
	return results;
}

// if (import.meta.main) { await fetchNewArticleList(); }
