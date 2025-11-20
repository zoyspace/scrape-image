import type { SakamichiType } from "../types/types";

export const nogizaka: SakamichiType = {
	groupName: "乃木坂46",
	baseUrl: "https://www.nogizaka46.com",
	newPages: "https://www.nogizaka46.com/s/n46/diary/MEMBER/list",
	newListSelectors: {
		cards: ".bl--card", // 各ブログカード要素
		title: ".bl--card__ttl", // ブログタイトル
		url: "", // 記事ページへのリンク
		date: ".bl--card__date", // 投稿日時
	},

	bodySelectors: {
		memberName: "a.m--allhd__ja__a.hv--op",
		articleImages: ".bd--edit img[src]",
		postedAt: "p.bd--hd__date.a--tx.js-tdi",
		title: "p.bl--card__ttl",
	},
};

export const sakurazaka: SakamichiType = {
	groupName: "櫻坂46",
	baseUrl: "https://www.sakurazaka46.com",
	newPages: "https://sakurazaka46.com/s/s46/diary/blog/list?ima=0000",
	newListSelectors: {
		cards: "ul.com-blog-part.box4.fxpc > li.box", // 各ブログカード要素
		title: ".date-title .title", // ブログタイトル
		url: "a", // 記事ページへのリンク
		date: ".date-title .date", // 投稿日時
	},

	bodySelectors: {
		memberName: "div.com-hero-title > .inner",
		articleImages: "div.box-article img[src]",
		postedAt: ".blog-foot > .txt > .date",
		title: ".inner.title-wrap >  .title",
	},
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
