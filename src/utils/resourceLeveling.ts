import { Task } from '../types/task';
import { Resource } from '../types/resource';
import { addDays, differenceInDays } from 'date-fns';

/**
 * リソースレベリング（Resource Leveling）ユーティリティ
 * 過負荷リソースの負荷を平準化するアルゴリズム
 */

interface ResourceLoad {
  resourceId: string;
  date: Date;
  load: number; // 負荷率（%）
  tasks: string[]; // タスクID
}

interface LevelingResult {
  success: boolean;
  adjustedTasks: Array<{
    taskId: string;
    originalStart: Date;
    newStart: Date;
    delay: number;
  }>;
  overallocations: ResourceLoad[];
  message: string;
}

/**
 * リソースレベリングを実行
 */
export function performResourceLeveling(
  tasks: Task[],
  resources: Resource[],
  options: {
    strategy: 'minimize_delay' | 'balance_load' | 'critical_path_first';
    maxDelay?: number; // 最大遅延日数
    respectCriticalPath?: boolean; // クリティカルパスを尊重するか
  } = { strategy: 'minimize_delay' }
): LevelingResult {
  const { strategy, maxDelay = 30, respectCriticalPath = true } = options;

  // 過負荷を検出
  const overallocations = detectOverallocations(tasks, resources);

  if (overallocations.length === 0) {
    return {
      success: true,
      adjustedTasks: [],
      overallocations: [],
      message: '過負荷は検出されませんでした',
    };
  }

  const adjustedTasks: LevelingResult['adjustedTasks'] = [];

  // 戦略に応じてレベリングを実行
  switch (strategy) {
    case 'minimize_delay':
      return minimizeDelayLeveling(tasks, resources, overallocations, maxDelay, respectCriticalPath);

    case 'balance_load':
      return balanceLoadLeveling(tasks, resources, overallocations, maxDelay);

    case 'critical_path_first':
      return criticalPathFirstLeveling(tasks, resources, overallocations, maxDelay);

    default:
      return {
        success: false,
        adjustedTasks: [],
        overallocations,
        message: '不明なレベリング戦略です',
      };
  }
}

/**
 * 過負荷を検出
 */
function detectOverallocations(tasks: Task[], resources: Resource[]): ResourceLoad[] {
  const overallocations: ResourceLoad[] = [];
  const resourceLoads = new Map<string, Map<string, ResourceLoad>>();

  // 各リソースの日次負荷を計算
  resources.forEach(resource => {
    const dailyLoads = new Map<string, ResourceLoad>();

    resource.allocations.forEach(allocation => {
      const task = tasks.find(t => t.id === allocation.taskId);
      if (!task) return;

      const startDate = new Date(allocation.startDate);
      const endDate = new Date(allocation.endDate);
      const days = differenceInDays(endDate, startDate) + 1;

      for (let i = 0; i < days; i++) {
        const date = addDays(startDate, i);
        const dateKey = date.toISOString().split('T')[0];

        // 土日をスキップ
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        if (!dailyLoads.has(dateKey)) {
          dailyLoads.set(dateKey, {
            resourceId: resource.id,
            date,
            load: 0,
            tasks: [],
          });
        }

        const load = dailyLoads.get(dateKey)!;
        load.load += allocation.allocation;
        load.tasks.push(allocation.taskId);
      }
    });

    // 過負荷（100%超）を検出
    dailyLoads.forEach(load => {
      if (load.load > resource.maxUnits) {
        overallocations.push(load);
      }
    });

    resourceLoads.set(resource.id, dailyLoads);
  });

  return overallocations;
}

/**
 * 遅延最小化戦略
 */
function minimizeDelayLeveling(
  tasks: Task[],
  resources: Resource[],
  overallocations: ResourceLoad[],
  maxDelay: number,
  respectCriticalPath: boolean
): LevelingResult {
  const adjustedTasks: LevelingResult['adjustedTasks'] = [];
  const tasksCopy = [...tasks];

  // 過負荷を日付順にソート
  const sortedOverallocations = overallocations.sort((a, b) =>
    a.date.getTime() - b.date.getTime()
  );

  for (const overallocation of sortedOverallocations) {
    // 過負荷に関連するタスクを取得
    const involvedTasks = overallocation.tasks
      .map(taskId => tasksCopy.find(t => t.id === taskId))
      .filter((t): t is Task => t !== undefined);

    if (involvedTasks.length === 0) continue;

    // クリティカルパスを除外
    const nonCriticalTasks = respectCriticalPath
      ? involvedTasks.filter(t => !t.cpm?.isCritical)
      : involvedTasks;

    if (nonCriticalTasks.length === 0) continue;

    // 優先度が低いタスクから遅延
    const taskToDelay = nonCriticalTasks.sort((a, b) => {
      const priorityOrder = { lowest: 0, low: 1, normal: 2, high: 3, highest: 4 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })[0];

    // タスクを1日遅延
    const originalStart = new Date(taskToDelay.plannedStartDate);
    const newStart = addDays(originalStart, 1);
    const delay = 1;

    // 最大遅延を超えないかチェック
    const totalDelay = adjustedTasks
      .filter(adj => adj.taskId === taskToDelay.id)
      .reduce((sum, adj) => sum + adj.delay, 0) + delay;

    if (totalDelay <= maxDelay) {
      taskToDelay.plannedStartDate = newStart;
      taskToDelay.plannedEndDate = addDays(
        new Date(taskToDelay.plannedEndDate),
        delay
      );

      adjustedTasks.push({
        taskId: taskToDelay.id,
        originalStart,
        newStart,
        delay,
      });
    }
  }

  return {
    success: true,
    adjustedTasks,
    overallocations: detectOverallocations(tasksCopy, resources),
    message: `${adjustedTasks.length}件のタスクを調整しました`,
  };
}

/**
 * 負荷分散戦略
 */
function balanceLoadLeveling(
  tasks: Task[],
  resources: Resource[],
  overallocations: ResourceLoad[],
  maxDelay: number
): LevelingResult {
  const adjustedTasks: LevelingResult['adjustedTasks'] = [];

  // TODO: より高度な負荷分散アルゴリズムを実装
  // 現在は遅延最小化と同じロジックを使用

  return minimizeDelayLeveling(tasks, resources, overallocations, maxDelay, false);
}

/**
 * クリティカルパス優先戦略
 */
function criticalPathFirstLeveling(
  tasks: Task[],
  resources: Resource[],
  overallocations: ResourceLoad[],
  maxDelay: number
): LevelingResult {
  const adjustedTasks: LevelingResult['adjustedTasks'] = [];

  // クリティカルパスのタスクは遅延させず、他のタスクを調整
  return minimizeDelayLeveling(tasks, resources, overallocations, maxDelay, true);
}

/**
 * レベリング結果のサマリーを生成
 */
export function generateLevelingSummary(result: LevelingResult): {
  totalAdjustments: number;
  totalDelay: number;
  remainingOverallocations: number;
  successRate: number;
} {
  const totalAdjustments = result.adjustedTasks.length;
  const totalDelay = result.adjustedTasks.reduce((sum, adj) => sum + adj.delay, 0);
  const remainingOverallocations = result.overallocations.length;
  const successRate = result.success && remainingOverallocations === 0 ? 100 :
    Math.max(0, 100 - (remainingOverallocations * 10));

  return {
    totalAdjustments,
    totalDelay,
    remainingOverallocations,
    successRate,
  };
}

/**
 * 過負荷リソースの分析
 */
export function analyzeResourceOverallocation(
  tasks: Task[],
  resources: Resource[]
): Array<{
  resourceId: string;
  resourceName: string;
  overallocationDays: number;
  maxOverload: number;
  averageOverload: number;
}> {
  const analysis: Array<{
    resourceId: string;
    resourceName: string;
    overallocationDays: number;
    maxOverload: number;
    averageOverload: number;
  }> = [];

  const overallocations = detectOverallocations(tasks, resources);

  resources.forEach(resource => {
    const resourceOverallocations = overallocations.filter(
      o => o.resourceId === resource.id
    );

    if (resourceOverallocations.length > 0) {
      const maxOverload = Math.max(...resourceOverallocations.map(o => o.load));
      const averageOverload =
        resourceOverallocations.reduce((sum, o) => sum + o.load, 0) /
        resourceOverallocations.length;

      analysis.push({
        resourceId: resource.id,
        resourceName: resource.name,
        overallocationDays: resourceOverallocations.length,
        maxOverload,
        averageOverload,
      });
    }
  });

  return analysis.sort((a, b) => b.overallocationDays - a.overallocationDays);
}
