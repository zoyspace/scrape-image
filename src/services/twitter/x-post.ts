import {
	hinatazaka,
	nogizaka,
	sakurazaka,
} from "../../shared/constants/group.ts";
import type { ArticleWithImageType } from "../../shared/types/types.ts";
import { tweetWithRemoteImage } from "./x-api.ts";

const { groupName: nogizakaGroupName } = nogizaka;
const { groupName: hinatazakaGroupName } = hinatazaka;
const { groupName: sakurazakaGroupName } = sakurazaka;
const marks: Record<string, string> = {
	[nogizakaGroupName]: "🟣",
	[hinatazakaGroupName]: "🩵",
	[sakurazakaGroupName]: "🌸",
};

export async function xPost(input: ArticleWithImageType) {
	const { memberName, imageUrls, postedAt, groupName, articleUrl } = input;
	const memberNameWithoutSpace = memberName.replace(" ", "");

	const groupNameWithMark = marks[groupName]
		? `${marks[groupName]}${groupName}${marks[groupName]}`
		: groupName;

	const postText = [
		`${groupNameWithMark} ${memberNameWithoutSpace}`,
		postedAt,
		articleUrl,
	]
		.filter(Boolean)
		.join("\n");

	let postImage: string | undefined;
	if (imageUrls.length > 1) {
		postImage = imageUrls[1];
	} else if (imageUrls.length === 1) {
		postImage = imageUrls[0];
	}
	if (!postImage) {
		console.log("No image found");
		return;
	}
	await tweetWithRemoteImage(postText, postImage);
	console.log("X投稿完了:", memberName);
}
