# Firestoreを使った管理画面サンプル

## インストール

ライブラリのインストール

```
$ yarn install
```

テストデータの作成

1. 秘密鍵ファイルを`firebasekey.json`としてディレクトリ直下に保存
2. `yarn initdata`を実行すると`members`コレクションが生成される（同名のコレクションがある場合はリセットされるので注意）

Firebaseの環境設定ファイルを追加

`.env`にFirebaseClientSDKで使用する環境設定を追加（`.env-examle`をベースに）

### ローカルの実行

```sh
$ yarn start
```
`/.dist`をルートディレクトリとしてローカルサーバを立てる

---

## プロダクションビルド

```bash
$ yarn production
```

上記コマンドを入力後 `/dist` フォルダにアセットが生成される
