import { getClient } from "./client.ts";

/**
 * DB の最大 urlId との比較による高速な重複チェック。
 * urlId が ID の連番に近いサイトに有効。
 * @see duplicateCheck.ts の IN句ベースの実装と比較して使い分ける。
 */
export async function duplicateCheckMax(
	groupName: string,
	inputUrlIds: number[],
): Promise<number[]> {
	const client = getClient();
	const existingSet = new Set<number>();

	if (inputUrlIds.length > 0) {
		const sql =
			"SELECT max(urlId) as maxId FROM posts WHERE groupName = :groupName";
		const maxRes = await client.execute({
			sql,
			args: { ":groupName": groupName },
		});
		const maxUrlId = Number(maxRes.rows[0]?.maxId ?? 0);

		for (const inputUrlId of inputUrlIds) {
			if (inputUrlId <= maxUrlId) existingSet.add(inputUrlId);
		}
	}

	const notFound = inputUrlIds.filter((id) => !existingSet.has(id));
	console.log(
		`${groupName} Duplicate check found:${existingSet.size}, not found:${notFound.length}.`,
	);
	if (inputUrlIds.length === notFound.length) {
		console.warn(
			groupName,
			"⚠️最新記事取得漏れの可能性があります!!!",
			inputUrlIds.join(","),
		);
		process.exitCode = 1;
	}

	return notFound;
}
