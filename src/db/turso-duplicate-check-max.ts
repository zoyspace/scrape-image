import { getClient } from "./turso-client.ts";

export async function duplicateCheckTursoMax(
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

	// 見つからなかった id を返す
	const notFound = inputUrlIds.filter((id) => !existingSet.has(id));
	console.log(
		`${groupName} Duplicate check found:${existingSet.size}, not found:${notFound.length}.`,
	);
	if (inputUrlIds.length === notFound.length)
		console.log(groupName, "⚠️最新記事取得漏れの可能性があります!!!");

	return notFound;
}
