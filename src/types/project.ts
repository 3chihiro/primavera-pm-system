/**
 * プロジェクト関連の型定義
 */

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: ProjectStatus;
  priority: ProjectPriority;
  manager: string;
  budget: number;
  actualCost: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
  // 進捗関連
  progress: {
    plannedValue: number;        // PV: Planned Value (計画価値)
    earnedValue: number;         // EV: Earned Value (獲得価値)
    actualCost: number;          // AC: Actual Cost (実績コスト)
    schedulePerformanceIndex: number;  // SPI: Schedule Performance Index
    costPerformanceIndex: number;      // CPI: Cost Performance Index
    scheduleVariance: number;    // SV: Schedule Variance
    costVariance: number;        // CV: Cost Variance
  };
  // ベースライン
  baseline: {
    startDate: Date;
    endDate: Date;
    budget: number;
    createdAt: Date;
    createdBy: string;
  } | null;
}

export type ProjectStatus = 
  | 'planning'      // 計画中
  | 'active'        // 実行中
  | 'on_hold'       // 保留中
  | 'completed'     // 完了
  | 'cancelled';    // 中止

export type ProjectPriority = 
  | 'low'           // 低
  | 'normal'        // 通常
  | 'high'          // 高
  | 'critical';     // 緊急

export interface ProjectSettings {
  // カレンダー設定
  workingDays: WeekDay[];
  workingHours: {
    start: string;  // "09:00"
    end: string;    // "18:00"
  };
  holidays: Date[];
  
  // 通貨設定
  currency: string;
  currencyFormat: {
    symbol: string;
    position: 'before' | 'after';
    decimalPlaces: number;
  };
  
  // 表示設定
  dateFormat: string;          // "YYYY-MM-DD"
  timeFormat: '12h' | '24h';
  firstDayOfWeek: WeekDay;
  
  // スケジュール設定
  autoSchedule: boolean;
  criticalPath: boolean;
  resourceLeveling: boolean;
  
  // EVM設定
  evmEnabled: boolean;
  baselineRequired: boolean;
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// プロジェクト作成用の型（IDや日時は自動生成されるため除外）
export type CreateProjectData = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress'> & {
  progress?: Partial<Project['progress']>;
};

// プロジェクト更新用の型
export type UpdateProjectData = Partial<Omit<Project, 'id' | 'createdAt'>>;

// プロジェクト一覧表示用の軽量版
export interface ProjectSummary {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: Date;
  endDate: Date;
  progress: {
    percentage: number;
    schedulePerformanceIndex: number;
    costPerformanceIndex: number;
  };
  manager: string;
  tasksCount: number;
  budgetUtilization: number;
}