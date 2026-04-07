import pLimit from "p-limit";
import { hinatazaka, nogizaka, sakurazaka } from "./constants/group.ts";
import { closeClient, getClient } from "./db/turso-client.ts";
import { duplicateCheckTurso } from "./db/turso-duplicate-check.ts";
import { insertPostsTurso } from "./db/turso-insert.ts";
import { fetchBodyImageUrls } from "./fetchBody.ts";
import { fetchNewArticleList } from "./fetchNew.ts";
import { insertArticlesToNotion } from "./notion/to-notion-api.ts";
import type {
	ArticleType,
	ArticleWithImageType,
	SakamichiType,
} from "./types/types.ts";
import { xMain } from "./x-api/x-main.ts";

export async function getBlogImages(param: SakamichiType) {
	const start = Date.now();
	const limit = pLimit(3);
	const {
		groupName,
		baseUrl,
		newPage,
		secondPage,
		newListSelectors,
		bodySelectors,
	} = param;
	console.info(`${groupName} Fetching new articles for ...`);

	const newBlogs: ArticleType[] = await fetchNewArticleList({
		groupName,
		baseUrl,
		newPage,
		newListSelectors,
	});

	const urlIdList = newBlogs.map((blog) => blog.urlId);
	// const notFoundTurso = await duplicateCheckTurso(groupName, urlIdList);
	const notFoundTurso = await duplicateCheckTurso(groupName, urlIdList);
	const blogList = newBlogs.filter((item) =>
		notFoundTurso.includes(item.urlId),
	);
	if (notFoundTurso.length === 0) {
		const newBlogs2: ArticleType[] = await fetchNewArticleList({
			groupName,
			baseUrl,
			secondPage,
			newListSelectors,
		});

		const urlIdList2 = newBlogs2.map((blog) => blog.urlId);
		// const notFoundTurso = await duplicateCheckTurso(groupName, urlIdList);
		const notFoundTurso2 = await duplicateCheckTurso(groupName, urlIdList2);
		const blogList2 = newBlogs.filter((item) =>
			notFoundTurso2.includes(item.urlId),
		);
		if (notFoundTurso2.length === 0) {
			console.warn(
				groupName,
				"⚠️最新記事取得漏れの可能性があります!!!",
				urlIdList2.join(","),
			);
			process.exitCode = 1; // github actions でエラー処理を実行(LINE通知)
		}
		blogList.push(...blogList2);
	}

	const newArticles: ArticleWithImageType[] = await Promise.all(
		blogList.map((Article: ArticleType) =>
			limit(async () => {
				const { title, articleUrl, urlId } = Article;
				const { memberName, imageUrls, postedAt } = await fetchBodyImageUrls({
					articleUrl,
					baseUrl,
					bodySelectors,
				});
				return {
					memberName,
					imageUrls,
					postedAt,
					groupName,
					title,
					articleUrl,
					urlId,
				};
			}),
		),
	);

	await insertPostsTurso(groupName, newArticles);

	const end = Date.now();
	console.info(
		`${groupName} Completed processing in ${(end - start) / 1000} seconds`,
	);
	return newArticles;
}

if (import.meta.main) {
	getClient();
	const hinataResult = await getBlogImages(hinatazaka);
	const nogizakaResult = await getBlogImages(nogizaka);
	const sakurazakaResult = await getBlogImages(sakurazaka);
	closeClient();

	const newArticles: ArticleWithImageType[] = [
		...hinataResult,
		...nogizakaResult,
		...sakurazakaResult,
	];
	const sortedArticles = [...newArticles].sort((a, b) =>
		b.postedAt > a.postedAt ? -1 : 1,
	);

	// await insertArticlesToNotion(sortedArticles);

	// getClient();
	// await xMain();
	// closeClient();
}
