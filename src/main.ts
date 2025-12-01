import pLimit from "p-limit";

import { hinatazaka, nogizaka, sakurazaka } from "./constants/group.ts";
import { closeClient, getClient } from "./db/turso-client.ts";
import { duplicateCheckTursoMax } from "./db/turso-duplicate-check-max.ts";
import { insertPostsTurso } from "./db/turso-insert.ts";
import { fetchBodyImageUrls } from "./fetchBody.ts";
import { fetchNewArticleList } from "./fetchNew.ts";
import { insertArticlesToNotion } from "./notion/to-notion-api.ts";
import type {
	ArticleType,
	ArticleWithImageType,
	SakamichiType,
} from "./types/types.ts";

export async function getBlogImages(param: SakamichiType) {
	const start = Date.now();
	const limit = pLimit(3); // 最大5並列
	const { groupName, baseUrl, newPages, newListSelectors, bodySelectors } =
		param;
	console.info(`${groupName} Fetching new articles for ...`);

	const newBlogs: ArticleType[] = await fetchNewArticleList({
		groupName,
		baseUrl,
		newPages,
		newListSelectors,
	});

	const urlIdList = newBlogs.map((blog) => blog.urlId);
	// const notFoundTurso = await duplicateCheckTurso(groupName, urlIdList);
	const notFoundTurso = await duplicateCheckTursoMax(groupName, urlIdList);
	const blogList = newBlogs.filter((item) =>
		notFoundTurso.includes(item.urlId),
	);

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

	const newArticles = [...hinataResult, ...nogizakaResult, ...sakurazakaResult];
	await insertArticlesToNotion(newArticles);
}
