/**
 * 進捗管理・EVM関連の型定義
 */

// ベースライン情報
export interface Baseline {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy?: string;
  tasks: BaselineTask[];
}

// ベースラインタスク
export interface BaselineTask {
  id: string;
  baselineId: string;
  taskId: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  budgetedCost: number;
}

// 進捗入力データ
export interface ProgressUpdate {
  taskId: string;
  percentComplete: number; // 0-100
  physicalPercentComplete: number; // 0-100（実際の進捗）
  actualStartDate?: Date;
  actualEndDate?: Date;
  remainingDuration: number;
  actualCost: number;
  notes?: string;
  updateDate: Date;
}

// EVM指標
export interface EVMMetrics {
  // 基本値
  pv: number; // Planned Value（計画値）
  ev: number; // Earned Value（出来高）
  ac: number; // Actual Cost（実コスト）
  bac: number; // Budget at Completion（完成時総予算）

  // 差異
  cv: number; // Cost Variance（コスト差異）= EV - AC
  sv: number; // Schedule Variance（スケジュール差異）= EV - PV

  // パフォーマンス指標
  cpi: number; // Cost Performance Index（コスト効率指標）= EV / AC
  spi: number; // Schedule Performance Index（スケジュール効率指標）= EV / PV

  // 予測値
  etc: number; // Estimate to Complete（完成までの見積もり）
  eac: number; // Estimate at Completion（完成時総コスト見積もり）
  vac: number; // Variance at Completion（完成時コスト差異）= BAC - EAC
  tcpi: number; // To-Complete Performance Index（残作業効率指標）

  // 日付
  calculatedDate: Date;
}

// タスクEVM情報
export interface TaskEVMData {
  taskId: string;
  taskName: string;

  // ベースライン情報
  baselineStartDate: Date;
  baselineEndDate: Date;
  baselineDuration: number;
  baselineCost: number;

  // 計画情報
  plannedStartDate: Date;
  plannedEndDate: Date;
  plannedDuration: number;
  budgetedCost: number;

  // 実績情報
  actualStartDate?: Date;
  actualEndDate?: Date;
  percentComplete: number;
  physicalPercentComplete: number;
  actualCost: number;
  remainingDuration: number;

  // EVM指標
  pv: number;
  ev: number;
  ac: number;

  // ステータス
  status: 'ahead' | 'on_track' | 'behind' | 'critical';
  isComplete: boolean;
}

// プロジェクトEVMサマリー
export interface ProjectEVMSummary {
  projectId: string;
  projectName: string;

  // 全体指標
  metrics: EVMMetrics;

  // タスク統計
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;

  // 進捗状況
  overallProgress: number; // 全体進捗率（%）
  scheduleProgress: number; // スケジュール進捗率（%）
  costProgress: number; // コスト進捗率（%）

  // ステータス
  projectStatus: 'green' | 'yellow' | 'red';
  scheduleStatus: 'ahead' | 'on_track' | 'behind';
  costStatus: 'under_budget' | 'on_budget' | 'over_budget';

  // 日付情報
  baselineStartDate: Date;
  baselineEndDate: Date;
  currentStartDate: Date;
  currentEndDate: Date;
  statusDate: Date; // 基準日

  // トレンドデータ
  trends?: EVMTrend[];
}

// EVMトレンドデータ
export interface EVMTrend {
  date: Date;
  pv: number;
  ev: number;
  ac: number;
  cpi: number;
  spi: number;
}

// 進捗レポート設定
export interface ProgressReportConfig {
  includeBaseline: boolean;
  includeEVM: boolean;
  includeCriticalPath: boolean;
  includeResourceUtilization: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  groupBy?: 'wbs' | 'resource' | 'status' | 'priority';
  sortBy?: 'name' | 'progress' | 'cv' | 'sv' | 'startDate';
  sortOrder?: 'asc' | 'desc';
}

// 進捗ダッシュボードデータ
export interface ProgressDashboardData {
  summary: ProjectEVMSummary;
  criticalTasks: TaskEVMData[];
  behindScheduleTasks: TaskEVMData[];
  overBudgetTasks: TaskEVMData[];
  upcomingMilestones: TaskEVMData[];
  recentUpdates: ProgressUpdate[];
}
