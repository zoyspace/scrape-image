import * as cheerio from "cheerio";
import type { ArticleType } from "../types/index.ts";
import { toSQLiteDateTime } from "../utils/date.ts";

export async function fetchList({
	groupName,
	baseUrl,
	newPage,
	nextPage,
	newListSelectors,
}: {
	groupName: string;
	baseUrl: string;
	newPage?: string;
	nextPage?: string;
	newListSelectors: { cards: string; title: string; url: string; date: string };
}): Promise<ArticleType[]> {
	const results: ArticleType[] = [];
	const pattern = /detail\/(\d+)/;
	const targetUrl = newPage || nextPage;
	if (!targetUrl) {
		throw new Error("No new page URL provided");
	}

	const res = await fetch(targetUrl);
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

	console.log(`${groupName} ${results.length} articles`);
	return results;
}
