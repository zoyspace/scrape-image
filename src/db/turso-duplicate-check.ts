import { getClient } from "./db-client.ts";

// SQLite 系はバインド変数数に上限(既定999)があります。安全のため分割実行します。	
function chunk<T>(arr: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		out.push(arr.slice(i, i + size));
	}
	return out;
}

// postsテーブルの (groupName, urlId) のUNIQUE制約あり。
export async function duplicateCheckTurso(
	groupName: string,
	inputUrlIds: number[],
): Promise<number[]> {
	const client = getClient();

	// 変数上限に余裕を見て1クエリあたり 500 件に分割
	const CHUNK_SIZE = 500;

	const existingSet = new Set<number>();

	for (const ids of chunk(inputUrlIds, CHUNK_SIZE)) {
		// 動的プレースホルダ（:id0, :id1, ...）を生成
		// :によってバインド変数として扱われる。sqliteでは、:は特殊の意味を持つ。
		const names = ids.map((_, i) => `:id${i}`);
		const sql = `
      SELECT urlId
      FROM posts
      WHERE groupName = :groupName
        AND urlId IN (${names.join(",")})
    `;

		const args: Record<string, number | string> = {
			":groupName": groupName,
		};
		ids.forEach((v, i) => {
			args[`:id${i}`] = v;
		});
		// {`:groupName`: groupName, `:id0`: ids[0], `:id1`: ids[1], ... }

		const res = await client.execute({ sql, args: args });
		// rows:[{0:10234,length:1,urlId:10234},{1:10235,length:1,urlId:10235},]
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
	if (inputUrlIds.length === notFound.length)
		console.log(groupName, "⚠️最新記事取得漏れの可能性があります!!!");

	return notFound;
}
