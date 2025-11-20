import * as cheerio from "cheerio";
import { toSQLiteDateTime } from "./utils/toSQLiteDateTime.ts";

export async function fetchBodyImageUrls({
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
	const selectors = bodySelectors;

	const html = await fetch(articleUrl).then((res) => res.text());
	const $ = cheerio.load(html);
	const imageUrls: string[] = [];

	// ブログ本文のセレクタを特定する（例: div.blog-body）
	const memberName = $(selectors.memberName)
		.text()
		.replace("公式ブログ", "")
		.trim();
	const postedAtRaw = $(selectors.postedAt).text().trim();
	const postedAt = toSQLiteDateTime(postedAtRaw);
	const blogBody = $(selectors.articleImages);

	// 本文内のすべての画像を取得
	blogBody.each((_, el) => {
		const src = $(el).attr("src") ?? "";
		if (!src) return;
		// 絶対URLに変換
		const absoluteUrl = src.startsWith("http") ? src : `${baseUrl}${src}`;
		imageUrls.push(absoluteUrl);
	});

	return { memberName, imageUrls, postedAt };
}

// if (import.meta.main) await fetchBodyImageUrls("https://www.hinatazaka46.com/s/official/diary/detail/66587?ima=0000&cd=member");
