import * as cheerio from "cheerio";
import { toSQLiteDateTime } from "../utils/date.ts";

export async function fetchDetail({
	articleUrl,
	baseUrl,
	bodySelectors,
}: {
	articleUrl: string;
	baseUrl: string;
	bodySelectors: {
		memberName: string;
		articleImages: string;
		postedAt: string;
		title: string;
	};
}): Promise<{ memberName: string; imageUrls: string[]; postedAt: string }> {
	const html = await fetch(articleUrl).then((res) => res.text());
	const $ = cheerio.load(html);
	const imageUrls: string[] = [];

	const memberName = $(bodySelectors.memberName)
		.text()
		.replace("公式ブログ", "")
		.trim();
	const postedAtRaw = $(bodySelectors.postedAt).text().trim();
	const postedAt = toSQLiteDateTime(postedAtRaw);
	const blogBody = $(bodySelectors.articleImages);

	blogBody.each((_, el) => {
		const src = $(el).attr("src") ?? "";
		if (!src) return;
		// 絶対URLに変換
		const absoluteUrl = src.startsWith("http") ? src : `${baseUrl}${src}`;
		imageUrls.push(absoluteUrl);
	});

	return { memberName, imageUrls, postedAt };
}
