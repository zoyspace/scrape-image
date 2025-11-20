export type ArticleType = {
	title: string;
	articleUrl: string;
	postedAt: string;
	urlId: number;
};

export type ArticleWithImageType = {
	memberName: string;
	postedAt: string;
	articleUrl: string;
	title: string;
	urlId: number;
	groupName: string;
	imageUrls: string[];
};

export type SakamichiType = {
	groupName: string;
	baseUrl: string;
	newPages: string;
	secondPage?: string;
	newListSelectors: {
		cards: string;
		title: string;
		url: string;
		date: string;
	};
	bodySelectors: {
		memberName: string;
		articleImages: string;
		postedAt: string;
		title: string;
	};
};
export const hinatazaka: SakamichiType = {
	groupName: "日向坂46",
	baseUrl: "https://www.hinatazaka46.com",
	newPages: "https://www.hinatazaka46.com/s/official/diary/member",
	newListSelectors: {
		cards: "ul.p-blog-top__list > li.p-blog-top__item",
		title: ".c-blog-top__title",
		url: "a",
		date: ".c-blog-top__date",
	},
	bodySelectors: {
		memberName: "div.c-blog-article__name > a",
		articleImages: ".c-blog-article__text img[src]",
		postedAt: ".c-blog-article__date > time",
		title: ".c-blog-article__title",
	},
};
