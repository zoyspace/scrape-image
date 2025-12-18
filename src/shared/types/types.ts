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

// turso insert
export type InsertPostInput = {
	memberName: string;
	title: string;
	articleUrl: string;
	postedAt: string; // "YYYY-MM-DD HH:MM:SS"
	urlId: number;
	groupName: string;
	imageUrls: string[];
};

export type InsertResult = {
	postInserted: number;
	imageInserted: number;
	postUpsertedIds: number[];
};
export type LibSQLExecuteResult = {
	columns: string[];
	columnTypes: string[];
	rows: Record<string, unknown>[];
	rowsAffected: number; // 必須
	lastInsertRowid?: bigint; // INSERT 時のみ
	toJSON: () => unknown;
};
export type NotionRow = {
  id: number;
  group: string;
  member: string | null;
  title: string | null;
  blog: string;
  image: string | null;
  postedAt: string | null;   // "YYYY-MM-DD HH:MM:SS"
  from:string;
};
