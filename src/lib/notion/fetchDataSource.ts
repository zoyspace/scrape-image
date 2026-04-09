// notion/fetchDataSource.ts から移動
// データソースの構造確認用スクリプト（開発用途）
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = process.env.NOTION_VERSION ?? "2025-09-03";
const NOTION_DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;

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
	if (!NOTION_API_KEY) throw new Error("NOTION_API_KEY is not set");
	if (!NOTION_DATA_SOURCE_ID)
		throw new Error("NOTION_DATA_SOURCE_ID is not set");

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
		const propWithOptions = prop as NotionProperty & {
			select?: { options: { name: string }[] };
			status?: { options: { name: string }[] };
		};
		if (prop.type === "select" && propWithOptions.select?.options) {
			const options = propWithOptions.select.options;
			console.log(
				`    options: ${options.map((o) => o.name).join(", ") || "(none)"}`,
			);
		}
		if (prop.type === "status" && propWithOptions.status?.options) {
			const options = propWithOptions.status.options;
			console.log(
				`    status options: ${options.map((o) => o.name).join(", ") || "(none)"}`,
			);
		}
	}
}

async function main() {
	console.log("Fetching Notion data source structure...");
	const ds = await fetchDataSource();
	console.log("ds", ds);
	printDataSourceStructure(ds);
}

if (import.meta.main) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
