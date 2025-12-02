import { getClient } from "./turso-client.ts";

export async function duplicateCheckTurso(
	groupName: string,
	inputUrlIds: number[],
): Promise<number[]> {
	const client = getClient();

	const existingSet = new Set<number>();

	if (inputUrlIds.length > 0) {
		const names = inputUrlIds.map((_, i) => `:id${i}`);
		const sql = `SELECT urlId FROM posts WHERE groupName = :groupName AND urlId 
			IN (${names.join(",")})`;

		const args: Record<string, number | string> = {
			":groupName": groupName,
		};
		inputUrlIds.forEach((v, i) => {
			args[`:id${i}`] = v;
		});

		const res = await client.execute({ sql, args });
		for (const row of res.rows) {
			const urlId = row.urlId;
			const v = Number(urlId);
			if (Number.isFinite(v)) existingSet.add(v);
		}
	}

	// 見つからなかった id を返す
	const notFound = inputUrlIds.filter((id) => !existingSet.has(id));
	console.log(
		`${groupName} Duplicate check found:${existingSet.size}, not found:${notFound.length}.`,
	);
	if (inputUrlIds.length === notFound.length){
		console.warn(groupName, "⚠️最新記事取得漏れの可能性があります!!!",inputUrlIds.join(","));
		process.exitCode = 1; // github actions でエラー処理を実行(LINE通知)
	}

	return notFound;
}
