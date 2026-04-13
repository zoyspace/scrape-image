# タスク: fetchList の型不一致の修正

`src/scraper/fetchList.ts` で定義されている引数の型が `secondPage` となっているため、`src/index.ts` で `nextPage` を渡そうとすると TypeScript エラーが発生しています。これを `nextPage` に統一して修正します。

## 完了条件
- [x] `src/scraper/fetchList.ts` の `secondPage` を `nextPage` にリネームする
- [x] `src/index.ts` でのエラーが解消されていることを確認する

## 実装計画
1. `src/scraper/fetchList.ts` の引数型および内部での変数使用箇所を `secondPage` から `nextPage` に変更する。
2. `src/index.ts` の修正が必要か再確認する。
