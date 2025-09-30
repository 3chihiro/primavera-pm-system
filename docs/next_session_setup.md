# 次回開発セッション開始ガイド

## 🚀 クイックスタート手順

### 1. 環境確認・起動
```bash
# 1. プロジェクトディレクトリに移動
cd C:\Users\user\primavera-pm-system

# 2. 現在のブランチ確認
git branch
# → feature/sprint3-gantt-chart であることを確認

# 3. 開発サーバー起動
npm run dev

# 4. 新しいターミナルでElectronアプリ起動
npm run build:electron
NODE_ENV=development npx electron .
```

### 2. 動作確認
- **Webサーバー**: http://localhost:3000 でアクセス可能
- **Electronアプリ**: デスクトップアプリが起動
- **データベース**: 自動初期化完了メッセージが表示

## 🎯 次の開発タスク

### 優先度1: 3階層タイムラインヘッダーの実装
**目標**: ガントチャートの時間軸表示機能を完成

#### 作成するファイル
```bash
src/components/gantt/GanttTimeline.tsx
src/components/gantt/GanttTimelineHeader.tsx
```

#### 実装のポイント
1. **`src/utils/ganttUtils.ts`** の `generateTimelineHeader()` 関数を活用
2. **年・月・日の3階層**で時間軸を表示
3. **スクロール対応**でパフォーマンス最適化
4. **ズーム機能**に対応した設計

#### 参考実装の開始コード
```tsx
// src/components/gantt/GanttTimeline.tsx のスケルトン
import React from 'react';
import { Box } from '@mui/material';
import { TimelineHeader, TimeRange } from '../../types/gantt';
import { generateTimelineHeader } from '../../utils/ganttUtils';

interface GanttTimelineProps {
  timeRange: TimeRange;
  pixelsPerDay: number;
}

const GanttTimeline: React.FC<GanttTimelineProps> = ({
  timeRange,
  pixelsPerDay
}) => {
  const timeline = generateTimelineHeader(timeRange, 'day');

  return (
    <Box sx={{ /* スタイル */ }}>
      {/* 3階層のヘッダー表示 */}
    </Box>
  );
};

export default GanttTimeline;
```

### 優先度2: GanttView.tsx の更新
現在のプレースホルダーを実際のガントチャート表示に置き換え

### 優先度3: タスクバー描画機能
SVGを使用したタスクバーの視覚的表示

## 📚 開発リソース

### 重要な参照ファイル
- **型定義**: `src/types/gantt.ts`
- **ユーティリティ**: `src/utils/ganttUtils.ts`
- **要件仕様**: `docs/primavera_requirements_document.md`
- **進捗記録**: `docs/development_progress.md`

### 設計済み機能
- ✅ 完全な型システム（GanttTask, TimelineHeader等）
- ✅ 日付計算・変換関数群
- ✅ 階層構造管理機能
- ✅ カラースキーム・設定システム

## 🔧 開発環境詳細

### 依存関係（追加済み）
- `date-fns`: 日付操作・フォーマット
- `moment`: 追加の日付サポート
- `react-virtualized`: 仮想化（大量データ対応）

### 設定済み項目
- TypeScript設定最適化
- Redux Store（Date警告解決済み）
- Webpack開発設定（React Router対応）

## ⚡ よくある問題と解決法

### 問題1: アプリが起動しない
```bash
# Webサーバーが起動しているか確認
npm run dev

# ポートが使用中の場合
npx kill-port 3000
npm run dev
```

### 問題2: Electronアプリのエラー
```bash
# ビルドし直す
npm run build:electron
# 再起動
NODE_ENV=development npx electron .
```

### 問題3: 型エラーが発生
```bash
# 新しい型定義をチェック
npx tsc --noEmit src/types/gantt.ts src/utils/ganttUtils.ts
```

## 📊 現在の実装状況
- **Sprint 1**: ✅ 完了（基盤構築）
- **Sprint 2**: ✅ 完了（WBS・タスク管理）
- **Sprint 3**: 🚧 50%完了（ガントチャート基盤）
  - ✅ 型定義・ユーティリティ完成
  - 🎯 次: UI コンポーネント実装

## 🎯 セッション目標
**今回のセッションで目指す成果:**
1. 3階層タイムラインヘッダーの完全実装
2. ガントチャート表示の基本動作確認
3. 日本語表示・祝日対応の動作テスト

**完成時の価値:**
Oracle Primavera P6に匹敵するガントチャート表示機能の獲得

---
**開始時は必ずこのドキュメントを確認してください！**