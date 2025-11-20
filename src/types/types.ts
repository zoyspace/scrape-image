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

