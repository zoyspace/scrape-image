import { getBlogImagesFlow } from "./core/manager.ts";
import { hinatazaka, nogizaka, sakurazaka } from "./shared/constants/group.ts";
import { closeClient, getClient } from "./services/database/client.ts";
import { insertArticlesToNotion } from "./services/notion/to-notion-api.ts";
import { xMain } from "./services/twitter/x-main.ts";
import type { ArticleWithImageType } from "./shared/types/types.ts";

async function main() {
	getClient();

	const hinataResult = await getBlogImagesFlow(hinatazaka);
	const nogizakaResult = await getBlogImagesFlow(nogizaka);
	const sakurazakaResult = await getBlogImagesFlow(sakurazaka);

	closeClient();

	const newArticles: ArticleWithImageType[] = [
		...hinataResult,
		...nogizakaResult,
		...sakurazakaResult,
	];

	if (newArticles.length > 0) {
		const sortedArticles = [...newArticles].sort((a, b) =>
			b.postedAt > a.postedAt ? -1 : 1,
		);
		await insertArticlesToNotion(sortedArticles);
	} else {
		console.log("No new articles to process.");
	}

    getClient();
    await xMain();
    closeClient();
}

main().catch((err) => {
	console.error("Critical error in main flow:", err);
	process.exit(1);
});
