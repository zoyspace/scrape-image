import { TwitterApi } from "twitter-api-v2";

async function tweetWithRemoteImage() {
  const client = new TwitterApi({
    appKey: process.env.X_APP_KEY!,
    appSecret: process.env.X_APP_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  }).readWrite;

  const imageUrl = "https://cdn.hinatazaka46.com/files/14/diary/official/member/moblog/202512/mobF5EZgm.jpg";

  // Bun の fetch は標準 fetch と同じ
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error("画像の取得に失敗しました");

  const buffer = Buffer.from(await res.arrayBuffer());

  const mediaId = await client.v1.uploadMedia(buffer, {
    mimeType: "image/jpeg",
  }); 

  await client.v2.tweet({
    text: "URL から画像を取ってきてポスト ✨",
    media: { media_ids: [mediaId] },
  });
}
