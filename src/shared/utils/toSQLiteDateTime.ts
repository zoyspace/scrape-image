
//  * 日時文字列を SQLite 形式 (YYYY-MM-DD HH:MM:SS) に変換する関数
//  * 例: "2025.1.7 20:5" → "2025-01-07 20:05"
//  * 例: "2025/1/7 20:5" → "2025-01-07 20:05"
//  * 例: "2025/1/7".     → "2025-01-07 00:00"


export function toSQLiteDateTime(before: string): string {

  const match = before.match(/^(\d{4})[./](\d{1,2})[./](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
  if (!match) {
    console.warn(`⚠️ toSQLiteDateTime: Invalid date format: ${before}`);
    throw new Error(`Invalid date format: ${before}`);
  }

  const [, year = "", month = "", day = "", hour = "00", minute = "00"] = match;
  // 0埋めして整形
  const formatted = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  return formatted;
}

// --- テスト例 ---
// console.log(toSQLiteDateTime("2025.1.7 20:5"));
// => "2025-01-07 20:05"
