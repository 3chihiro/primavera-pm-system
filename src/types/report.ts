// レポート関連の型定義

export type ReportType =
  | 'task_list'           // タスク一覧
  | 'gantt_chart'         // ガントチャート
  | 'resource_usage'      // リソース使用率
  | 'evm_progress'        // EVM進捗
  | 'project_summary'     // プロジェクトサマリー
  | 'baseline_comparison' // ベースライン比較
  | 'critical_path'       // クリティカルパス
  | 'custom';             // カスタムレポート

export type ExportFormat = 'excel' | 'csv' | 'pdf';

export interface ReportConfig {
  id?: string;
  name: string;
  type: ReportType;
  format: ExportFormat;
  projectId: number;
  filters?: ReportFilters;
  columns?: string[];
  createdAt?: string;
  createdBy?: string;
}

export interface ReportFilters {
  // 日付フィルター
  startDate?: Date;
  endDate?: Date;

  // タスクフィルター
  taskStatus?: ('not_started' | 'in_progress' | 'completed' | 'on_hold')[];
  isCritical?: boolean;
  milestoneOnly?: boolean;

  // リソースフィルター
  resourceIds?: number[];
  resourceTypes?: ('labor' | 'material' | 'equipment' | 'cost')[];

  // WBSレベルフィルター
  wbsLevels?: number[];

  // 進捗フィルター
  progressMin?: number;
  progressMax?: number;
}

export interface ExportOptions {
  fileName?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  paperSize?: 'a4' | 'a3' | 'letter';
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
}

// Excelエクスポート用のシート定義
export interface ExcelSheet {
  name: string;
  headers: string[];
  data: any[][];
  columnWidths?: number[];
}

// PDFレポートのセクション定義
export interface PDFSection {
  title: string;
  type: 'table' | 'chart' | 'text' | 'image';
  content: any;
}

// レポートテンプレート
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  format: ExportFormat;
  defaultFilters?: ReportFilters;
  defaultColumns?: string[];
  isSystem?: boolean;
}

// プリセットレポート定義
export const PRESET_REPORTS: ReportTemplate[] = [
  {
    id: 'task-list-all',
    name: '全タスク一覧',
    description: 'プロジェクトの全タスクをエクスポート',
    type: 'task_list',
    format: 'excel',
    defaultColumns: [
      'taskCode',
      'taskName',
      'startDate',
      'endDate',
      'duration',
      'progress',
      'status',
      'resources',
    ],
    isSystem: true,
  },
  {
    id: 'critical-path-tasks',
    name: 'クリティカルパスタスク',
    description: 'クリティカルパス上のタスクのみ',
    type: 'critical_path',
    format: 'excel',
    defaultFilters: {
      isCritical: true,
    },
    isSystem: true,
  },
  {
    id: 'resource-utilization',
    name: 'リソース使用率レポート',
    description: 'リソースの使用率と過負荷状況',
    type: 'resource_usage',
    format: 'pdf',
    isSystem: true,
  },
  {
    id: 'evm-dashboard',
    name: 'EVM進捗ダッシュボード',
    description: 'EVM指標と進捗トレンド',
    type: 'evm_progress',
    format: 'pdf',
    isSystem: true,
  },
  {
    id: 'gantt-chart-export',
    name: 'ガントチャートPDF',
    description: 'ガントチャートをPDF出力',
    type: 'gantt_chart',
    format: 'pdf',
    isSystem: true,
  },
  {
    id: 'project-summary',
    name: 'プロジェクトサマリー',
    description: 'プロジェクト全体の概要レポート',
    type: 'project_summary',
    format: 'pdf',
    isSystem: true,
  },
];

// レポート生成ステータス
export interface ReportGenerationStatus {
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress: number;
  message?: string;
  error?: string;
  filePath?: string;
}
