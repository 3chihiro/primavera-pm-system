/**
 * タスク（アクティビティ）関連の型定義
 */

export interface Task {
  id: string;
  projectId: string;
  parentId: string | null;      // 親タスクのID（階層構造用）
  wbsCode: string;              // Work Breakdown Structure コード（例: 1.2.3）
  name: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  
  // スケジュール関連
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  duration: number;             // 期間（日数）
  remainingDuration: number;    // 残り期間（日数）
  
  // 進捗関連
  percentComplete: number;      // 完了率（0-100）
  physicalPercentComplete: number; // 物理的完了率
  
  // リソース関連
  assignedResources: TaskResourceAssignment[];
  
  // 依存関係
  dependencies: TaskDependency[];
  
  // コスト関連
  budgetedCost: number;
  actualCost: number;
  remainingCost: number;
  
  // その他
  sortOrder: number;            // 表示順序
  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // CPM（クリティカルパス法）関連
  cpm: {
    earlyStart: Date;           // 最早開始日
    earlyFinish: Date;          // 最早終了日
    lateStart: Date;            // 最遅開始日
    lateFinish: Date;           // 最遅終了日
    totalFloat: number;         // トータルフロート（日数）
    freeFloat: number;          // フリーフロート（日数）
    isCritical: boolean;        // クリティカルパス上かどうか
  };
  
  // 制約条件
  constraints: TaskConstraint[];
}

export type TaskType = 
  | 'summary'       // サマリータスク（親タスク）
  | 'task'          // 通常タスク
  | 'milestone';    // マイルストーン

export type TaskStatus = 
  | 'not_started'   // 未開始
  | 'in_progress'   // 進行中
  | 'completed'     // 完了
  | 'on_hold'       // 保留
  | 'cancelled';    // キャンセル

export type TaskPriority = 
  | 'lowest'        // 最低
  | 'low'           // 低
  | 'normal'        // 通常
  | 'high'          // 高
  | 'highest';      // 最高

export interface TaskResourceAssignment {
  resourceId: string;
  allocation: number;           // 割り当て率（0-100）
  startDate: Date;
  endDate: Date;
  cost: number;
  actualCost: number;
}

export interface TaskDependency {
  predecessorId: string;        // 先行タスクID
  type: DependencyType;
  lag: number;                  // ラグ（日数、負の値の場合はリード）
}

export type DependencyType = 
  | 'FS'            // Finish to Start（終了-開始）
  | 'SS'            // Start to Start（開始-開始）
  | 'FF'            // Finish to Finish（終了-終了）
  | 'SF';           // Start to Finish（開始-終了）

export interface TaskConstraint {
  type: ConstraintType;
  date: Date;
}

export type ConstraintType = 
  | 'ASAP'          // As Soon As Possible（可能な限り早く）
  | 'ALAP'          // As Late As Possible（可能な限り遅く）
  | 'MSO'           // Must Start On（指定日に開始）
  | 'MFO'           // Must Finish On（指定日に終了）
  | 'SNET'          // Start No Earlier Than（指定日以降に開始）
  | 'SNLT'          // Start No Later Than（指定日以前に開始）
  | 'FNET'          // Finish No Earlier Than（指定日以降に終了）
  | 'FNLT';         // Finish No Later Than（指定日以前に終了）

// タスク作成用の型
export type CreateTaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'cpm'> & {
  cpm?: Partial<Task['cpm']>;
};

// タスク更新用の型
export type UpdateTaskData = Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>;

// WBS階層表示用の型
export interface TaskHierarchy extends Task {
  children: TaskHierarchy[];
  level: number;                // 階層レベル（0が最上位）
  isExpanded: boolean;          // 展開状態
}

// ガントチャート表示用の型
export interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  percentComplete: number;
  dependencies: string[];      // 依存するタスクのID配列
  isCritical: boolean;
  level: number;
  isExpanded: boolean;
  type: TaskType;
}