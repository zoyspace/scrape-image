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

export function makeUrlList(maxPag: number, newPage: string, nextPage: string) {
	const urlList = [newPage];
	maxPag > 1 && urlList.push(nextPage);
	for (let i = 2; i < maxPag; i++) {
		urlList.push(nextPage.replace("page=1", `page=${i}`));
	}
	return urlList;
}

export async function getBlogImages(param: SakamichiType) {
	const start = Date.now();
	const limit = pLimit(3);
	const {
		groupName,
		baseUrl,
		newPage,
		nextPage,
		newListSelectors,
		bodySelectors,
	} = param;
	const maxPag = 3;
	const urlList = makeUrlList(maxPag, newPage, nextPage);

	const blogList: ArticleType[] = [];
	for (const [index, url] of urlList.entries()) {
		console.log(url);

		const newBlogs: ArticleType[] = await fetchList({
			groupName,
			baseUrl,
			newPage,
			newListSelectors,
		});
		const urlIdList = newBlogs.map((blog) => blog.urlId);
		const notFoundIds = await duplicateCheck(groupName, urlIdList);
		blogList.push(
			...newBlogs.filter((item) => notFoundIds.includes(item.urlId)),
		);

		if (notFoundIds.length === urlIdList.length) {
			if (index === urlList.length - 1) {
				console.warn(groupName, "⚠️最新記事取得漏れの可能性があります!!!");
				process.exitCode = 1; // GitHub Actions でエラー通知をトリガーする
			} 
		}else break;
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
	const sortedArticles = newArticles.toSorted((a, b) =>
		a.postedAt.localeCompare(b.postedAt),
	);
	await insertPosts(groupName, sortedArticles);

	const end = Date.now();
	console.info(
		`${groupName} Completed processing in ${(end - start) / 1000} seconds`,
	);
	return sortedArticles;
}

if (import.meta.main) {
	getClient();
	const hinataResult = await getBlogImages(hinatazaka);
	const nogizakaResult = await getBlogImages(nogizaka);
	const sakurazakaResult = await getBlogImages(sakurazaka);
	closeClient();

	// const _newArticles: ArticleWithImageType[] = [
	// 	...hinataResult,
	// 	...nogizakaResult,
	// 	...sakurazakaResult,
	// ];
}
