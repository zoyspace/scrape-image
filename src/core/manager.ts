import pLimit from "p-limit";
import { PostRepository } from "../services/database/repository.ts";
import type {
	ArticleType,
	ArticleWithImageType,
	SakamichiType,
} from "../shared/types/types.ts";
import { fetchBodyImageUrls } from "./scraper/body-scraper.ts";
import { fetchNewArticleList } from "./scraper/list-scraper.ts";

/**
 * 特定のグループのブログ記事をスクレイピングし、データベースに保存する一連の結果を返します。
 */
export async function getBlogImagesFlow(
	param: SakamichiType,
): Promise<ArticleWithImageType[]> {
	const start = Date.now();
	const limit = pLimit(3);
	const { groupName, baseUrl, newPages, newListSelectors, bodySelectors } =
		param;
	const repository = new PostRepository();

	console.info(`${groupName} Fetching new articles...`);

	const newBlogs: ArticleType[] = await fetchNewArticleList({
		groupName,
		baseUrl,
		newPages,
		newListSelectors,
	});

	if (newBlogs.length === 0) {
		return [];
	}

	const urlIdList = newBlogs.map((blog) => blog.urlId);
	const notFoundTurso = await repository.filterNewPosts(groupName, urlIdList);
	const blogList = newBlogs.filter((item) =>
		notFoundTurso.includes(item.urlId),
	);

	const newArticles: ArticleWithImageType[] = await Promise.all(
		blogList.map((article: ArticleType) =>
			limit(async () => {
				const { title, articleUrl, urlId } = article;
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

	if (newArticles.length > 0) {
		await repository.insertPosts(groupName, newArticles);
	}

	const end = Date.now();
	console.info(
		`${groupName} Completed processing in ${(end - start) / 1000} seconds`,
	);
	return newArticles;
}
