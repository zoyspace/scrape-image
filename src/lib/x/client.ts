import { Buffer } from "node:buffer";
import { TwitterApi } from "twitter-api-v2";

/** X (Twitter) API クライアントを生成する（呼び出しのたびに env を参照） */
function createXClient() {
	const appKey = process.env.X_APP_KEY;
	const appSecret = process.env.X_APP_SECRET;
	const accessToken = process.env.X_ACCESS_TOKEN;
	const accessSecret = process.env.X_ACCESS_SECRET;
	if (!appKey) throw new Error("X_APP_KEY is not set");
	if (!appSecret) throw new Error("X_APP_SECRET is not set");
	if (!accessToken) throw new Error("X_ACCESS_TOKEN is not set");
	if (!accessSecret) throw new Error("X_ACCESS_SECRET is not set");

	return new TwitterApi({ appKey, appSecret, accessToken, accessSecret })
		.readWrite;
}

/**
 * 指定した画像 URL を取得して、画像付きポストを行う
 */
export async function tweetWithRemoteImage(text: string, imageUrl: string) {
	const client = createXClient();

	const res = await fetch(imageUrl);
	if (!res.ok) {
		throw new Error(
			`画像の取得に失敗しました: ${res.status} ${res.statusText}`,
		);
	}

	const arrayBuffer = await res.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const mediaId = await client.v1.uploadMedia(buffer, {
		mimeType: "image/jpeg",
	});

	await client.v2.tweet({
		text,
		media: { media_ids: [mediaId] },
	});
}
