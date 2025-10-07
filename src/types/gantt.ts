/**
 * ガントチャート関連の型定義
 */

export interface GanttChartProps {
  tasks: GanttTask[];
  timeRange: TimeRange;
  onTaskUpdate: (taskId: string, updates: Partial<GanttTask>) => void;
  onTaskDrag: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  settings: GanttSettings;
}

export interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number; // 0-100
  type: 'task' | 'milestone' | 'summary';
  level: number; // 階層レベル（0から開始）
  children?: GanttTask[];
  parentId?: string;
  dependencies: TaskDependency[];
  isExpanded?: boolean;

  // 表示用プロパティ
  color?: string;
  cssClass?: string;
  isSelected?: boolean;
  isCritical?: boolean;

  // 制約
  constraints?: TaskConstraint[];

  // リソース情報
  resources?: Array<{
    id: string;
    name: string;
    allocation: number; // 割り当て率（%）
  }>;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface GanttSettings {
  timeScale: TimeScale;
  workingDays: number[]; // 0=日曜日, 1=月曜日...
  holidays: Date[];
  colors: GanttColorScheme;
  showWeekends: boolean;
  showHolidays: boolean;
  enableDragDrop: boolean;
  enableZoom: boolean;
}

export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface GanttColorScheme {
  taskBar: string;
  progressBar: string;
  milestoneBar: string;
  summaryBar: string;
  criticalPath: string;
  weekend: string;
  holiday: string;
  today: string;
  gridLines: string;
  text: string;
}

export interface TaskDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: DependencyType;
  lag: number; // 日数でのラグ
}

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface TaskConstraint {
  id: string;
  type: ConstraintType;
  date: Date;
}

export type ConstraintType =
  | 'MUST_START_ON'
  | 'MUST_FINISH_ON'
  | 'START_NO_EARLIER_THAN'
  | 'START_NO_LATER_THAN'
  | 'FINISH_NO_EARLIER_THAN'
  | 'FINISH_NO_LATER_THAN'
  | 'AS_SOON_AS_POSSIBLE'
  | 'AS_LATE_AS_POSSIBLE';

// タイムライン関連
export interface TimelineHeader {
  level1: TimelineCell[]; // 年
  level2: TimelineCell[]; // 月
  level3: TimelineCell[]; // 日
  level4: TimelineCell[]; // 曜日
}

export interface TimelineCell {
  date: Date;
  label: string;
  width: number;
  isWeekend?: boolean;
  isHoliday?: boolean;
  isToday?: boolean;
}

// ドラッグ操作関連
export interface DragState {
  isDragging: boolean;
  taskId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  dragType: 'move' | 'resize-start' | 'resize-end' | null;
}

// ズーム関連
export interface ZoomState {
  level: number; // 1-10
  pixelsPerDay: number;
  visibleTimeRange: TimeRange;
}

// イベント関連
export interface GanttEvent {
  type: 'task-click' | 'task-double-click' | 'task-context-menu' | 'task-drag-start' | 'task-drag-end';
  taskId: string;
  event: MouseEvent;
  data?: any;
}

// レンダリング関連
export interface RenderContext {
  canvasWidth: number;
  canvasHeight: number;
  pixelsPerDay: number;
  startDate: Date;
  endDate: Date;
  rowHeight: number;
  headerHeight: number;
}

// デフォルト設定
export const DEFAULT_GANTT_COLORS: GanttColorScheme = {
  taskBar: '#4CAF50',
  progressBar: '#2E7D32',
  milestoneBar: '#FF9800',
  summaryBar: '#2196F3',
  criticalPath: '#F44336',
  weekend: '#F5F5F5',
  holiday: '#FFECB3',
  today: '#FF5722',
  gridLines: '#E0E0E0',
  text: '#333333'
};

export const DEFAULT_GANTT_SETTINGS: GanttSettings = {
  timeScale: 'day',
  workingDays: [1, 2, 3, 4, 5], // 月曜日〜金曜日
  holidays: [],
  colors: DEFAULT_GANTT_COLORS,
  showWeekends: true,
  showHolidays: true,
  enableDragDrop: true,
  enableZoom: true
};