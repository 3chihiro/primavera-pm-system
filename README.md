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

## 📊 開発状況（2025年10月13日時点）
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
  - 4階層タイムラインヘッダー（年・月・日・曜日）
  - タスクバー描画（通常タスク、マイルストーン、サマリータスク）
  - 休日表示と色分けシステム（日本の祝日対応）
  - ズーム・スクロール機能
  - グリッド線表示
  - 進捗バー表示

- ✅ **Sprint 4**: CPMスケジューリング（完了）
  - クリティカルパス計算
  - フロート計算（Total Float/Free Float）
  - 依存関係の完全実装（FS/SS/FF/SF）
  - 制約条件対応（8種類）

- ✅ **Sprint 5**: リソース管理（完了）
  - リソース定義・管理
  - リソース配分とレベリング
  - 利用率グラフ・ヒストグラム
  - タスクリソース割り当て

- ✅ **Sprint 6**: 進捗管理・EVM（完了）
  - 進捗入力機能
  - ベースライン管理
  - EVM指標計算（PV/EV/AC/CPI/SPI等）
  - EVMトレンドグラフ

- ✅ **Sprint 7**: レポート・エクスポート機能（完了）
  - Excel/CSVエクスポート
  - PDFレポート生成
  - プリセットレポート（6種類）
  - ガントチャートPDF出力

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

## 🎉 全Sprint完了
全7つのSprintが完了しました！本格的なプロジェクト管理システムとして以下の機能を実装：
- プロジェクト・タスク管理
- ガントチャート（Oracle Primavera P6レベル）
- CPMスケジューリング
- リソース管理・レベリング
- 進捗管理・EVM分析
- レポート・エクスポート機能

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

### プロジェクト管理
- ✅ プロジェクト作成・編集・削除
- ✅ WBS（作業分解構造）階層管理
- ✅ タスク依存関係（FS/SS/FF/SF）
- ✅ 制約条件（8種類）

### ガントチャート
- ✅ 4階層タイムラインヘッダー（年・月・日・曜日）
- ✅ タスクバー描画（通常/マイルストーン/サマリー）
- ✅ 日本の祝日表示・休日マスク
- ✅ ズーム・スクロール機能
- ✅ クリティカルパス表示
- ✅ リソースインジケーター

### CPM & リソース管理
- ✅ クリティカルパス計算
- ✅ フロート計算（Total/Free）
- ✅ リソース定義・配分
- ✅ リソースレベリング
- ✅ リソース使用率分析
- ✅ リソースヒストグラム

### 進捗管理・EVM
- ✅ ベースライン管理
- ✅ 進捗入力機能
- ✅ EVM指標計算（PV/EV/AC/CPI/SPI/EAC等）
- ✅ EVMトレンドグラフ
- ✅ ダッシュボード表示

### レポート・エクスポート
- ✅ Excel/CSVエクスポート
- ✅ PDFレポート生成
- ✅ プリセットレポート（6種類）
  - 全タスク一覧
  - クリティカルパスタスク
  - リソース使用率レポート
  - EVM進捗ダッシュボード
  - ガントチャートPDF
  - プロジェクトサマリー

## 📦 使用ライブラリ
- **xlsx**: Excelファイル生成
- **jspdf**: PDF生成
- **jspdf-autotable**: PDFテーブル生成
- **html2canvas**: ガントチャートPDF化
- **recharts**: グラフ描画
- **date-fns**: 日付処理
- **react-virtualized**: 仮想化（大量データ対応）

---
**開発完了**: 全7 Sprintの実装が完了しました。本格的なプロジェクト管理システムとして利用可能です。

