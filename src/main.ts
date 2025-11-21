import pLimit from "p-limit";
import { duplicateCheckTurso } from "./db/turso-duplicate-check.ts";
import { insertPostsTurso } from "./db/turso-insert.ts";
import type {
	ArticleType,
	ArticleWithImageType,
	SakamichiType,
} from "./types/types.ts";
import { hinatazaka, nogizaka, sakurazaka } from "./constants/group.ts";
import { fetchBodyImageUrls } from "./fetchBody.ts";
import { fetchNewArticleList } from "./fetchNew.ts";
import {insertArticlesToNotion} from "./notion/to-notion-api.ts"


export async function getBlogImages(param: SakamichiType) {
	const start = Date.now();
	const limit = pLimit(2); // 最大5並列
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
	const notFoundTurso = await duplicateCheckTurso(groupName, urlIdList);
	const blogList = newBlogs.filter((item) => notFoundTurso.includes(item.urlId));

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

	await insertPostsTurso(groupName,newArticles);
	await insertArticlesToNotion(newArticles);

	const end = Date.now();
	console.info(
		`${groupName} Completed processing in ${(end - start) / 1000} seconds`,
	);
}

if (import.meta.main) {
	await getBlogImages(hinatazaka);
	await getBlogImages(nogizaka);
	await getBlogImages(sakurazaka);
}
