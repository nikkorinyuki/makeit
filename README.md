# Make it a Quote 画像生成API

このリポジトリは、TypeScriptで書かれた「Make it a Quote」画像生成APIです。

## 例

![](https://informalmakeitaquote.glitch.me/)
このコードで稼働しているサーバー達※無料枠での稼働

- ~~[https://informalmakeitaquote.glitch.me/](https://informalmakeitaquote.glitch.me/)~~
- [https://makeit-a66a.onrender.com/](https://makeit-a66a.onrender.com/)

# **⚠️注意** 
動作確認は `node v16.12` で行っています。

## 使い方

以下のコマンドを実行して依存関係をインストールします。

```bash
npm install
```

サーバーを起動するには、以下のコマンドを実行します。

```bash
npm start
```

APIエンドポイントにリクエストを送信して画像を生成します。

- ブラウザ等で[`http://localhost:3000/`](http://localhost:3000/)にアクセスする。(GET)

- POSTリクエストを`http://localhost:3000/`に送信する。
   ```bash
   curl -X POST -H "Content-Type: application/json" -d "{\"text\": \"Hello, World!\",\"name\":\"\",\"id\":\"\"}" --output makeit.png http://localhost:3000/
   ```
   ※makeit.pngに画像が保存されます

## API パラメータ一覧

| フィールド | 型      | POST | GET  | 任意の場合の初期値                             | 説明                                                       |
| ---------- | ------- | ---- | ---- | ---------------------------------------------- | ---------------------------------------------------------- |
| text       | string  | 必須 | 任意 | "Text"                                         | テキスト                                                   |
| icon       | string  | 任意 | 任意 | [assets/dummy_icon.png](assets/dummy_icon.png) | アイコンのURLもしくはdataURL                               |
| name       | string  | 必須 | 任意 | "name"                                         | テキストの下に表示されます                                 |
| id         | string  | 必須 | 任意 | "id"                                           | 名前の下に表示されます                                     |
| debug      | boolean | 任意 | 任意 | false                                          | デバッグモードのフラグ                                     |
| markdown   | boolean | 任意 | 任意 | true                                           | Discordマークダウンにそって描画するか                      |
| direction  | string  | 任意 | 任意 | "left"                                         | テキストの方向（left, right）                              |
| color      | string  | 任意 | 任意 | "white"                                        | 背景色                                                     |
| tcolor     | string  | 任意 | 任意 | "black"                                        | テキストカラー                                             |
| format     | string  | 任意 | 任意 | "png"                                          | 画像フォーマット （png, jpeg, webp, tiff, avif, svg, raw） |

## 環境変数

以下の環境変数を設定する必要があります：

- `PORT`: サーバーがリスンするポート番号 (デフォルト: 3000)

## 使用フォント

- [NotoSansCanadianAboriginal-Bold](https://fonts.google.com/noto/specimen/Noto+Sans+Canadian+Aboriginal)
- [NotoSansJP-Medium](https://fonts.google.com/noto/specimen/Noto+Sans+JP)
- [NotoSansKR-Medium](https://fonts.google.com/noto/specimen/Noto+Sans+KR)
- [NotoSansMath-Regular](https://fonts.google.com/noto/specimen/Noto+Sans+Math)
- [NotoSansSC-Medium](https://fonts.google.com/noto/specimen/Noto+Sans+SC)
- [PopGothicCjkJp-Bold](https://github.com/max32002/pop-gothic/blob/master/CJK%20JP/PopGothicCjkJp-Bold.ttf)
- [SourGummy-Thin](https://fonts.google.com/specimen/Sour+Gummy)

## 貢献

歓迎してます！！！

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。詳細については、[LICENSE](./LICENSE)ファイルを参照してください。

## コンタクト

質問や提案がある場合は、[issues](https://github.com/nikkorinyuki/makeit/issues)セクションに投稿してください。
