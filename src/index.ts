import pLimit from "p-limit";
import { hinatazaka, nogizaka, sakurazaka } from "./config/groups.ts";
import { closeClient, getClient } from "./db/client.ts";
import { duplicateCheck } from "./db/duplicateCheck.ts";
import { insertPosts } from "./db/repository.ts";
import { fetchDetail } from "./scraper/fetchDetail.ts";
import { fetchList } from "./scraper/fetchList.ts";
import type {
	ArticleType,
	ArticleWithImageType,
	SakamichiType,
} from "./types/index.ts";

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

	const newBlogs: ArticleType[] = await fetchList({
		groupName,
		baseUrl,
		newPage,
		newListSelectors,
	});

	const urlIdList = newBlogs.map((blog) => blog.urlId);
	const notFoundIds = await duplicateCheck(groupName, urlIdList);
	const blogList = newBlogs.filter((item) => notFoundIds.includes(item.urlId));

	if (notFoundIds.length === 0) {
		const newBlogs2: ArticleType[] = await fetchList({
			groupName,
			baseUrl,
			secondPage,
			newListSelectors,
		});

		const urlIdList2 = newBlogs2.map((blog) => blog.urlId);
		const notFoundIds2 = await duplicateCheck(groupName, urlIdList2);
		const blogList2 = newBlogs2.filter((item) =>
			notFoundIds2.includes(item.urlId),
		);
		if (notFoundIds2.length === 0) {
			console.warn(
				groupName,
				"⚠️最新記事取得漏れの可能性があります!!!",
				urlIdList2.join(","),
			);
			process.exitCode = 1; // GitHub Actions でエラー通知をトリガーする
		}
		blogList.push(...blogList2);
	}

	const newArticles: ArticleWithImageType[] = await Promise.all(
		blogList.map((article: ArticleType) =>
			limit(async () => {
				const { title, articleUrl, urlId } = article;
				const { memberName, imageUrls, postedAt } = await fetchDetail({
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

	await insertPosts(groupName, newArticles);

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

	const _newArticles: ArticleWithImageType[] = [
		...hinataResult,
		...nogizakaResult,
		...sakurazakaResult,
	];
}
