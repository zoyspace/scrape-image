import { type Client, createClient } from "@libsql/client";

const URL = process.env.TURSO_DATABASE_URL;
const TOKEN = process.env.TURSO_AUTH_TOKEN;

let _client: Client | null = null;

/**
 * シングルトンのDBクライアントを返す。
 * 複数回呼び出しても同じクライアントを返す（シングルトンパターン）。
 */
export function getClient(): Client {
	if (!TOKEN) throw new Error("TURSO_AUTH_TOKEN is not set");
	if (!URL) throw new Error("TURSO_DATABASE_URL is not set");

	if (_client) return _client;
	_client = createClient({ url: URL, authToken: TOKEN });
	return _client;
}

export function closeClient() {
	if (_client) {
		_client.close();
		_client = null;
	}
}
