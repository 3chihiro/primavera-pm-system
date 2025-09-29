/**
 * リソース関連の型定義
 */

export interface Resource {
  id: string;
  code: string;                 // リソースコード（例: ENG001）
  name: string;
  type: ResourceType;
  category: string;             // カテゴリ（例: "開発者", "デザイナー", "設備"）
  
  // 基本情報
  description: string;
  email?: string;
  phone?: string;
  department?: string;
  
  // コスト関連
  standardRate: number;         // 標準単価（時間単位）
  overtimeRate: number;         // 残業単価（時間単位）
  costPerUse: number;          // 使用ごとのコスト
  currency: string;
  
  // 稼働情報
  maxUnits: number;            // 最大利用可能率（100 = 100%）
  availability: ResourceAvailability[];
  
  // 割り当て情報
  allocations: ResourceAllocation[];
  
  // スキル・能力
  skills: ResourceSkill[];
  
  // その他
  isActive: boolean;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ResourceType = 
  | 'work'          // 人的リソース
  | 'material'      // 材料リソース
  | 'cost'          // コストリソース
  | 'equipment';    // 設備リソース

export interface ResourceAvailability {
  startDate: Date;
  endDate: Date;
  maxUnits: number;             // その期間での最大利用可能率
  notes?: string;
}

export interface ResourceAllocation {
  taskId: string;
  allocation: number;           // 割り当て率（0-100）
  startDate: Date;
  endDate: Date;
  plannedWork: number;          // 計画作業時間
  actualWork: number;           // 実績作業時間
  remainingWork: number;        // 残り作業時間
  cost: number;                 // 計画コスト
  actualCost: number;           // 実績コスト
}

export interface ResourceSkill {
  name: string;                 // スキル名（例: "JavaScript", "プロジェクト管理"）
  level: SkillLevel;
  certified: boolean;           // 資格・認定の有無
  notes?: string;
}

export type SkillLevel = 
  | 'beginner'      // 初級
  | 'intermediate'  // 中級
  | 'advanced'      // 上級
  | 'expert';       // エキスパート

// リソース作成用の型
export type CreateResourceData = Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'allocations'>;

// リソース更新用の型
export type UpdateResourceData = Partial<Omit<Resource, 'id' | 'createdAt'>>;

// リソースヒストグラム表示用の型
export interface ResourceHistogram {
  resourceId: string;
  resourceName: string;
  periods: ResourceHistogramPeriod[];
  totalAllocatedHours: number;
  totalAvailableHours: number;
  utilizationRate: number;      // 利用率（0-100）
  overallocationPeriods: ResourceHistogramPeriod[];  // 過負荷期間
}

export interface ResourceHistogramPeriod {
  startDate: Date;
  endDate: Date;
  allocatedHours: number;       // 割り当て時間
  availableHours: number;       // 利用可能時間
  utilizationRate: number;      // 利用率（0-100）
  isOverallocated: boolean;     // 過負荷かどうか
  tasks: {
    taskId: string;
    taskName: string;
    hours: number;
  }[];
}

// リソース使用率レポート用の型
export interface ResourceUtilizationReport {
  resourceId: string;
  resourceName: string;
  type: ResourceType;
  totalAvailableHours: number;
  totalAllocatedHours: number;
  totalActualHours: number;
  utilizationRate: number;
  efficiencyRate: number;       // 効率率（実績/計画）
  overallocationHours: number;  // 過負荷時間
  idleHours: number;           // アイドル時間
  costEfficiency: number;       // コスト効率
}

// リソース平準化用の型
export interface ResourceLevelingOptions {
  strategy: LevelingStrategy;
  priority: LevelingPriority;
  constraints: LevelingConstraint[];
  maxDelay: number;            // 最大遅延日数
  preserveConstraints: boolean; // 制約条件を保持するか
}

export type LevelingStrategy = 
  | 'minimize_duration'         // 期間最小化
  | 'balance_workload'         // 作業負荷分散
  | 'respect_priorities';      // 優先度尊重

export type LevelingPriority = 
  | 'task_priority'            // タスク優先度
  | 'resource_cost'            // リソースコスト
  | 'schedule_flexibility';    // スケジュール柔軟性

export interface LevelingConstraint {
  type: 'max_units' | 'availability' | 'skill_requirement';
  resourceId?: string;
  value: number | boolean;
}