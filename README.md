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

## 📊 開発状況（2025年9月30日時点）
- ✅ **Sprint 1**: 基盤構築完了
  - Electron + React + TypeScript 環境
  - SQLite データベース + 完全スキーマ
  - Material-UI レイアウト
  - Redux Toolkit 状態管理

- ✅ **Sprint 2**: WBS・タスク管理完了
  - プロジェクト CRUD 機能
  - 基本的なWBS表示
  - ダッシュボード実装

- 🚧 **Sprint 3**: ガントチャート機能（50%完了）
  - ✅ 完全な型定義システム
  - ✅ 高度なユーティリティ関数群
  - ✅ 3階層タイムライン生成機能
  - 🎯 次: UI コンポーネント実装

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

## 🎯 次回開発継続ポイント
1. **3階層タイムラインヘッダー実装** (`src/components/gantt/GanttTimeline.tsx`)
2. **ガントチャート表示更新** (`src/components/gantt/GanttView.tsx`)
3. **タスクバー描画機能** (`src/components/gantt/GanttTaskBar.tsx`)

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
- ✅ ガントチャート基盤（型定義・計算関数）

---
**開発者**: 次回継続時は `docs/next_session_setup.md` を参照してください。

