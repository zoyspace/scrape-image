import { expect, test } from "bun:test";
import { mkdir } from "node:fs/promises";
import { sakurazaka } from "../src/config/groups.ts";
import { fetchList } from "../src/scraper/fetchList.ts";

const outputDirectory = new URL("./output/", import.meta.url);
const outputPath = new URL("./output/sakurazaka-new-page.html", import.meta.url);

test("sakurazakaの新着記事一覧とHTMLを出力する", async () => {
	const response = await fetch(sakurazaka.newPage);
	expect(response.ok).toBe(true);

	const html = await response.text();
	await mkdir(outputDirectory, { recursive: true });
	await Bun.write(outputPath, html);

	const result = await fetchList(sakurazaka);
	console.log(JSON.stringify(result, null, 2));

	expect(result.length).toBeGreaterThan(0);
});
