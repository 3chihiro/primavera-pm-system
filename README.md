# Primavera PM System

Oracle Primavera P6風デスクトップ専用プロジェクト管理システム

## 🎯 プロジェクト概要
本格的なプロジェクト管理システム。Oracle Primavera P6の機能性を維持しながら、UX/UIを大幅に改善したデスクトップ専用アプリケーション。

## 🛠️ 技術スタック
- **フロントエンド**: Electron + React + TypeScript
- **データベース**: SQLite（ローカルストレージ）
- **UI フレームワーク**: Material-UI
- **状態管理**: Redux Toolkit
- **日付処理**: date-fns
- **仮想化**: react-virtualized

## 📊 開発状況（2025年10月4日時点）
- ✅ **Sprint 1**: 基盤構築完了
  - Electron + React + TypeScript 環境
  - SQLite データベース + 完全スキーマ
  - Material-UI レイアウト
  - Redux Toolkit 状態管理

- ✅ **Sprint 2**: WBS・タスク管理完了
  - プロジェクト CRUD 機能
  - 基本的なWBS表示
  - ダッシュボード実装

- ✅ **Sprint 3**: ガントチャート機能（完了）
  - ✅ 3階層タイムラインヘッダー（年・月・日）
  - ✅ タスクバー描画（通常タスク、マイルストーン、サマリータスク）
  - ✅ 休日表示と色分けシステム（日本の祝日対応）
  - ✅ ズーム・スクロール機能
  - ✅ グリッド線表示
  - ✅ 進捗バー表示

- 🎯 **Sprint 4**: CPMスケジューリング（次の開発対象）
  - クリティカルパス計算
  - フロート計算
  - 依存関係の完全実装
  - 制約条件対応

## 🚀 セットアップ

### 開発環境起動
```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev    # → http://localhost:3000

# Electronアプリ起動（別ターミナル）
npm run build:electron
NODE_ENV=development npx electron .
```

### ブランチ構成
- `master`: メインブランチ
- `develop`: 開発統合ブランチ
- `feature/sprint3-gantt-chart`: 現在の開発ブランチ

## 📚 ドキュメント
- 📋 **要件仕様書**: `docs/primavera_requirements_document.md`
- 📈 **開発進捗記録**: `docs/development_progress.md`
- 🚀 **次回開始ガイド**: `docs/next_session_setup.md`

## 🎯 次回開発継続ポイント（Sprint 4）
1. **CPMアルゴリズム実装** - クリティカルパス計算の実装
2. **依存関係の完全実装** - FS/SS/FF/SF タイプ対応
3. **制約条件対応** - Must Start On, ASAP, ALAP 等の実装

## 🏗️ アーキテクチャ
```
src/
├── components/         # UIコンポーネント
│   ├── gantt/         # ガントチャート関連
│   ├── wbs/           # WBS管理
│   ├── dashboard/     # ダッシュボード
│   └── ...
├── types/             # TypeScript型定義
├── utils/             # ユーティリティ関数
├── store/             # Redux状態管理
├── database/          # SQLiteスキーマ
└── ...
```

## 🎉 主な実装済み機能
- ✅ プロジェクト作成・管理
- ✅ WBS（作業分解構造）表示
- ✅ データベース連携
- ✅ Material-UI ベースUI
- ✅ **ガントチャート完全実装**
  - 3階層タイムラインヘッダー
  - タスクバー描画（通常/マイルストーン/サマリー）
  - 日本の祝日表示
  - ズーム・スクロール機能
  - グリッド線と色分けシステム

---
**開発者**: 次回継続時は `docs/next_session_setup.md` を参照してください。

