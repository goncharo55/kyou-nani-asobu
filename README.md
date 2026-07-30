# 今日ナニ遊ぶ？(仮)

友達の人数・今日の気分・使える時間・予算を選ぶだけで、今日みんなで遊べるSteamゲームを5本だけ提案するサイト。
自分で条件を絞って探したい人向けに、チェックボックス式のブラウズ画面も用意している。

## 現状(MVP)でできること

- `/` トップページ
- `/quiz` 4問の診断フロー(人数[1人(ソロ)〜6人以上]→気分→時間→予算)→ `/result` で当日固定のおすすめ5本を表示
- `/browse` 自分で人数・気分・時間・予算をチェックボックスで組み合わせて絞り込む一覧(ゲーム名検索・ページネーション付き)
- `/games/[appid]` ゲーム個別ページ(SEO・将来の広告枠用)
- `data/games.json` に964本のゲームデータ(手動選定36本 + 自動発見928本)
- 日本語(`/ja/...`)・英語(`/en/...`)のロケール別ルーティング。接続元の国情報(Vercelデプロイ時)またはブラウザ言語から自動判定し、ヘッダーの言語切り替えセレクタで手動変更も可能

## 多言語対応(i18n)について

`next-intl`を使ったロケール別ルーティング(`src/app/[locale]/...`)。

- **UI文言**: `src/messages/ja.json` / `src/messages/en.json` に完全翻訳済み。新しい言語を追加する場合は「`routing.ts`のlocalesに追加」+「対応する`messages/*.json`を書く」だけでよい
- **言語判定の優先順位**: ①ユーザーがヘッダーのセレクタで明示的に選択(Cookie保存) → ②接続元の国情報(`x-vercel-ip-country`ヘッダー。Vercelにデプロイした場合のみ有効) → ③ブラウザのAccept-Language → ④既定値(日本語)
  - 国→言語の対応表は `src/middleware.ts`(Next.js 16では`proxy.ts`)の`COUNTRY_TO_LOCALE`。今は日本→`ja`のみ登録、それ以外は英語にフォールバックする設定。ここに追記するだけで対応国を増やせる
- **Steamへの再取得は発生しない設計**: appdetailsは`l=japanese`で1回だけ取得しており、UI文言はSteamと無関係に管理している。ゲームの`shortDescription`(説明文)は取得した言語のまま(Steamが日本語ローカライズしていないタイトルは英語のまま)表示される。これを各言語に翻訳してキャッシュする仕組み(DeepL等)は次のステップとして保留中(下記「データの既知の限界」参照)

## 「何人で遊ぶ？」(ソロ対応)について

「みんなで」だけでなく一人プレイしたい人にも対応するため、人数の選択肢に「1人」を追加した。

- `scripts/add-singleplayer-flag.mjs`: 各ゲームがSteamの「シングルプレイヤー」カテゴリ(id=2)を持っているかを追加取得するマイグレーション(既存964件に対して一度実行済み。964件中882件がソロ対応と判定)
- 今後の`discover-and-build.mjs` / `fetch-curated-games.mjs`の実行では、この情報を最初から取得するようになっている(マイグレーションは初回だけでよい)
- 「1人」を選んだ場合は`coop.singlePlayer === true`のゲームのみ表示する(`matchesFilters`, `src/lib/games.ts`)

## データ収集について

2段階のパイプラインになっている。

### 1. 手動選定タイア(`verified: true`)

- `scripts/curated-seed.mjs` : 人手で選んだ「みんなで遊べる有名タイトル」のリスト(appid・気分タグ・目安プレイ時間・**実際の対応人数**)
- `scripts/fetch-curated-games.mjs` : 上記リストを元にSteam公式 `appdetails` API から画像・価格・説明・カテゴリを取得
  ```bash
  npm run data:curated
  ```
- 対応人数・プレイ時間は実際のゲーム内容に基づく正確な値(例: Golf With Your Friendsは最大12人、Among Usは4〜15人)

### 2. 自動発見タイア(`verified: false`)

- `scripts/discover-and-build.mjs` : 手動リストだけでは「知ってるゲームばかり」になってしまうため、以下の手順で**知名度は高くないが質は担保されている**ゲームを大規模に自動発見する
  ```bash
  npm run data:discover              # 候補6000件を評価(既定値)
  node scripts/discover-and-build.mjs 3200 12   # 候補上限・カテゴリごとのページ数を指定
  ```
  1. 候補収集は2系統: (a) 協力/マルチ/対戦の各カテゴリを複数のソート順(レビュー順・新着順・人気順)でページング、(b) 気分ごとの検索キーワード(例: "horror co-op", "cozy co-op")での検索。両方とも`store.steampowered.com/search/results`(公式検索フロントエンド)を使用
  2. 各候補を `appreviews` API でチェックし、**レビュー300件以上 かつ 高評価率75%以上**のものだけ採用(品質ゲート。無名だが質の低いゲームを弾く)
  3. `appdetails` で type=game かつ協力/マルチカテゴリ持ちのものだけ最終採用
  4. `mood-classifier.mjs`(ジャンル+説明文のキーワードマッチ、EN/JP対応)で気分タグを推定
  5. 既存の`data/games.json`(手動選定+これまでの自動発見分)は保持したまま、新規に見つかった分だけ追加。**差分実行**なので同じappidを何度も評価し直さない
- 自動発見タイアは対応人数を暫定値(2〜4人)にしている(Steam APIに正確な人数データが無いため)。ゲーム詳細ページに「対応人数は暫定値」の注記を表示している
- 50件処理するごとに`data/games.json`へ途中経過を保存するため、数十分〜1時間規模のバッチが中断しても採用済み分は残る

品質の閾値(レビュー300件・高評価率75%)は`scripts/discover-and-build.mjs`内の`QUALITY_MIN_REVIEWS`/`QUALITY_MIN_POSITIVE_RATIO`で調整可能。閾値を上げるほど有名タイトル寄りに、下げるほど無名タイトルも混ざりやすくなる。

- `scripts/fetch-steam-data.mjs` : 上記2つを作る前の試作版(参考用、実運用では使っていない)

**SteamSpyは使っていない**: Cloudflareのボット判定(403)でブロックされており、突破する行為は避けたため、Steam公式のストアフロントAPI(`search/results` / `appreviews` / `appdetails`)のみで完結する設計にしている。

**レート制限について**: Steamの検索APIは短時間に集中アクセスすると429(Too Many Requests)を返すことがある。`discover-and-build.mjs`は429を検知すると5秒→10秒→…と待機して自動リトライする。1000本規模のバッチは数十分〜1時間程度かかる想定。

### データの既知の限界

- 自動発見タイアの`estimatedSessionMinutes`(プレイ時間の目安)と`minPlayers`/`maxPlayers`(対応人数)はSteam APIに存在しない項目のため暫定値(2〜4人)。将来的にはHowLongToBeat等の外部データに置き換えたい
- `moodTags`(気分)は`mood-classifier.mjs`によるジャンル+説明文のキーワードマッチ(自動発見タイア)または人手判断(手動選定タイア)。1000本規模になるとキーワード分類の精度には限界があるため、質の担保はあくまでレビュー数/高評価率のフィルタが主。より精度を上げるなら`shortDescription`をLLM(Claude Haiku等)に分類させる案が安価(1本あたり数銭程度)で精度も出やすいが、API課金が発生するため導入は要判断
- ゲームの説明文(`shortDescription`)はSteamが日本語ローカライズしていないタイトルの場合、英語のまま表示される(UIのロケールを英語に切り替えても、この文章自体はSteamから取得した言語のまま変わらない)。DeepL等での翻訳キャッシュ導入は保留中で、導入すればこの制限は解消できる
- 価格は常に日本円(¥)表示。ロケールを英語にしても通貨は変わらない(地域別価格を出すには`cc=`パラメータを変えてSteamから再取得する必要があり、翻訳と同様「言語ごとに再取得」のコストがかかるため、現時点ではスコープ外としている)

## 今後の自動更新について(新作の定期追加)

現状は手元で`npm run data:update`を手動実行する想定。差分実行に対応しているので、定期的に回せば新しく人気が出たゲームや新作が自動で追加されていく。完全に無人で回すには:

1. コードをGitHubリポジトリにpush
2. GitHub Actionsの`schedule`(cron)で`npm run data:update`を週1回実行
3. `data/games.json`に差分があれば自動コミット → Vercel/Cloudflare Pagesが自動で再デプロイ

実装にはGitHubリポジトリ化が前提。

## ホスティング / SEO / コストについての方針

**構成案(低コスト優先)**:

| 項目 | 推奨 | 理由 |
|---|---|---|
| フレームワーク | Next.js (App Router) | SSG/SSRでSEOに強く、`generateMetadata`・`sitemap.ts`・`robots.ts`が標準搭載 |
| ホスティング | Vercel無料枠 or Cloudflare Pages | 個人トラフィック規模なら無料枠で十分。静的+一部動的(`/result`,`/browse`)构成でも問題なく動く |
| データ更新 | GitHub Actions cron → 再デプロイ | サーバー常時稼働が不要。実行時のみ課金/無料枠消化 |
| 画像 | Steam CDN直リンク(`next/image`の`unoptimized`) | 自前で画像を持たないので配信コストがかからない |
| 広告 | 現時点では未実装 | Google AdSenseはサイト審査・アカウント発行が必要で、ユーザー本人の作業が必要なため。ある程度コンテンツ(ゲーム数・PV)が育ってから申請するのが通りやすい |

**SEO観点で今回やったこと**:
- ページごとの`generateMetadata`(タイトル・description・OGP)
- `/result?players=...&mood=...` のようなクエリ付きURLで「3人・怖い・1時間・無料のおすすめ」的なロングテール検索に対応できる形にした
- ゲーム個別ページ(`/games/[appid]`)を`generateStaticParams`で静的生成し、個別ゲーム名での検索流入も狙える形にした
- `sitemap.ts` / `robots.ts` で自動生成

**まだやっていない(次のステップ)**:
- 実際のドメイン取得・Vercel/Cloudflareへのデプロイ(要ユーザー判断)
- 構造化データ(JSON-LD)の付与
- AdSense等の広告タグ導入(サイトが育ってから)
- GitHub Actionsでの自動収集・自動デプロイの実装(要GitHubリポジトリ化)

## 開発

```bash
npm install
npm run dev       # http://localhost:3000
npm run build
```
