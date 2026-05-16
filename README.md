# Make it a Quote 画像生成API

このリポジトリは、TypeScriptで書かれた「Make it a Quote」画像生成APIです。

## 例

![](assets/sample.png)
このコードで稼働しているサーバー達※無料枠での稼働

- [https://makeit-a66a.onrender.com/](https://makeit-a66a.onrender.com/)

# 動作確認環境

- node: `v24.15.0`
- yarn: `v1.22.22`

## 使い方

以下のコマンドを実行して依存関係をインストールします。

```bash
yarn
```

サーバーを起動するには、以下のコマンドを実行します。

```bash
yarn start
```

POSTリクエストを`http://localhost:3000/`に送信する。

```bash
curl -X POST -H "Content-Type: application/json" -d "{\"text\": \"Hello, World!\",\"name\":\"\",\"id\":\"\"}" --output makeit.png http://localhost:3000/
```

※makeit.pngに画像が保存されます

## API パラメータ一覧

| フィールド | 型      | 初期値                                         | 説明                                                     |
| ---------- | ------- | ---------------------------------------------- | -------------------------------------------------------- |
| text       | string  | "Text"                                         | テキスト                                                 |
| icon       | string  | [assets/dummy_icon.png](assets/dummy_icon.png) | アイコンのURLもしくはdataURL                             |
| name       | string  | "name"                                         | テキストの下に表示されます                               |
| id         | string  | "id"                                           | 名前の下に表示されます                                   |
| debug      | boolean | false                                          | デバッグモードのフラグ                                   |
| markdown   | boolean | true                                           | Discordマークダウンにそって描画するか                    |
| direction  | string  | "left"                                         | テキストの方向（left, right）                            |
| color      | string  | "white"                                        | 背景色                                                   |
| tcolor     | string  | "black"                                        | テキストカラー                                           |
| format     | string  | "png"                                          | 画像フォーマット （png, jpg, jpeg, webp, raw, pdf, svg） |

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
- [SourGummy-Medium](https://fonts.google.com/specimen/Sour+Gummy)

## 貢献

歓迎してます！！！

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。詳細については、[LICENSE](./LICENSE)ファイルを参照してください。

## コンタクト

質問や提案がある場合は、[issues](https://github.com/nikkorinyuki/makeit/issues)セクションに投稿してください。
