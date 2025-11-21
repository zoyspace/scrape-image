// src/notion/print-structure.ts
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = process.env.NOTION_VERSION ?? "2025-09-03";
const NOTION_DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;

if (!NOTION_API_KEY) throw new Error("NOTION_API_KEY is not set");
if (!NOTION_DATA_SOURCE_ID) throw new Error("NOTION_DATA_SOURCE_ID is not set");

type NotionProperty = {
	id: string;
	type: string;
	[name: string]: unknown;
};

type DataSourceResponse = {
	id: string;
	object: "data_source";
	database_id: string;
	title?: Array<unknown>;
	properties: Record<string, NotionProperty>;
	title_property?: {
		name: string;
		id: string;
	};
};

async function fetchDataSource(): Promise<DataSourceResponse> {
	const res = await fetch(
		`https://api.notion.com/v1/data_sources/${NOTION_DATA_SOURCE_ID}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${NOTION_API_KEY}`,
				"Notion-Version": NOTION_VERSION,
				"Content-Type": "application/json",
			},
		},
	);

	if (!res.ok) {
		const errorBody = await res.text();
		throw new Error(
			`Failed to retrieve data source: ${res.status} ${res.statusText}\n${errorBody}`,
		);
	}

	return (await res.json()) as DataSourceResponse;
}

function printDataSourceStructure(ds: DataSourceResponse) {
	console.log("=== Data Source Structure ===");
	console.log("data_source_id:", ds.id);
	console.log("database_id   :", ds.database_id);
	if (ds.title_property) {
		console.log(
			"title_property:",
			`${ds.title_property.name} (id: ${ds.title_property.id})`,
		);
	}
	console.log("");

	console.log("=== Properties ===");
	for (const [name, prop] of Object.entries(ds.properties)) {
		console.log(`- ${name}`);
		console.log(`    id  : ${prop.id}`);
		console.log(`    type: ${prop.type}`);
		// 型ごとの詳細を少しだけ表示（select の options など）
		if (prop.type === "select" && (prop as any).select?.options) {
			const options = (prop as any).select.options as { name: string }[];
			console.log(
				`    options: ${options.map((o) => o.name).join(", ") || "(none)"}`,
			);
		}
		if (prop.type === "status" && (prop as any).status?.options) {
			const options = (prop as any).status.options as { name: string }[];
			console.log(
				`    status options: ${options
					.map((o) => o.name)
					.join(", ") || "(none)"}`,
			);
		}
	}
}

async function main() {
	console.log("Fetching Notion data source structure...");
	const ds = await fetchDataSource();
	console.log("ds",ds);
	printDataSourceStructure(ds);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
