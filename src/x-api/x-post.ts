import type {ArticleWithImageType} from "../types/types.ts";
import { tweetWithRemoteImage } from "./x-api.ts";

export async function xPost(input: ArticleWithImageType) {
    const {memberName, imageUrls, postedAt, groupName, title, articleUrl} = input;
    const postText = [`${memberName} / ${groupName}`,postedAt,title,articleUrl,].filter(Boolean) // 空文字や undefined を自動で除外
    .join("\n");
    const postImage = imageUrls.length > 1 ? imageUrls[1] : imageUrls.length === 1 ? imageUrls[0] : null;
    if (!postImage) {
        console.log("No image found");
        return;
    }
    await tweetWithRemoteImage(postText, postImage);
}
