import { Buffer } from "node:buffer";
import { TwitterApi } from "twitter-api-v2";

const IMAGE_URL = "https://cdn.hinatazaka46.com/files/14/diary/official/member/moblog/202512/mobF5EZgm.jpg";
// Bun は .env を自動ロードするので Bun.env から読むのが素直
const client = new TwitterApi({
  appKey: process.env.X_APP_KEY!,
  appSecret: process.env.X_APP_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_SECRET!,
}).readWrite;

/**
 * 指定した画像URLを取得して、画像付きポストを行う
 */
export async function tweetWithRemoteImage(text: string,imageUrl: string=IMAGE_URL) {
  // 1. 画像を取得
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(
      `画像の取得に失敗しました: ${res.status} ${res.statusText}`,
    );
  }

  // 2. ArrayBuffer -> Node/Bun の Buffer に変換
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 3. v1.1 の media/upload をラップしたヘルパーでアップロード
  //    最新ドキュメントでも uploadMedia(パス or Buffer, { mimeType }) パターンが推奨されている
  //    ref: README & 各種チュートリアル :contentReference[oaicite:4]{index=4}
  const mediaId = await client.v1.uploadMedia(buffer, {
    mimeType: "image/jpeg", // PNGなら "image/png" などに変更
  });

  // 4. v2 の POST /2/tweets で、media_ids を添付してポスト
  const tweet = await client.v2.tweet({
    text,
    media: { media_ids: [mediaId] },
  });

  // console.log("投稿完了:", tweet.data);
}


async function postTextOnly() {
  const client = new TwitterApi({
    appKey: process.env.X_APP_KEY!,
    appSecret: process.env.X_APP_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  }).readWrite;

  const res = await client.v2.tweet({
    text: "これは Free プランから投稿されたテキストのみの投稿です 🚀",
  });

  console.log("Tweet 作成:", res);
}

// await postTextOnly();
// tweetWithRemoteImage(IMAGE_URL, "URL から画像を取ってきてポスト ✨");

 

