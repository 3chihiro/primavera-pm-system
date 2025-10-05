import { Resource, ResourceHistogram, ResourceHistogramPeriod } from '../types/resource';
import { Task } from '../types/task';
import { addDays, differenceInDays, startOfDay, format } from 'date-fns';

/**
 * リソース使用率計算ユーティリティ
 */

/**
 * リソースヒストグラムを生成
 */
export function generateResourceHistogram(
  resource: Resource,
  tasks: Task[],
  startDate: Date,
  endDate: Date,
  periodType: 'day' | 'week' | 'month' = 'week'
): ResourceHistogram {
  const periods = generatePeriods(startDate, endDate, periodType);
  const histogramPeriods: ResourceHistogramPeriod[] = [];

  let totalAllocatedHours = 0;
  let totalAvailableHours = 0;

  for (const period of periods) {
    const periodStart = period.start;
    const periodEnd = period.end;

    // この期間での利用可能時間を計算
    const availableHours = calculateAvailableHours(
      resource,
      periodStart,
      periodEnd
    );

    // この期間での割り当て時間を計算
    const { allocatedHours, taskBreakdown } = calculateAllocatedHours(
      resource,
      tasks,
      periodStart,
      periodEnd
    );

    const utilizationRate = availableHours > 0
      ? Math.round((allocatedHours / availableHours) * 100)
      : 0;

    const isOverallocated = allocatedHours > availableHours;

    histogramPeriods.push({
      startDate: periodStart,
      endDate: periodEnd,
      allocatedHours,
      availableHours,
      utilizationRate,
      isOverallocated,
      tasks: taskBreakdown,
    });

    totalAllocatedHours += allocatedHours;
    totalAvailableHours += availableHours;
  }

  const overallUtilizationRate = totalAvailableHours > 0
    ? Math.round((totalAllocatedHours / totalAvailableHours) * 100)
    : 0;

  const overallocationPeriods = histogramPeriods.filter(p => p.isOverallocated);

  return {
    resourceId: resource.id,
    resourceName: resource.name,
    periods: histogramPeriods,
    totalAllocatedHours,
    totalAvailableHours,
    utilizationRate: overallUtilizationRate,
    overallocationPeriods,
  };
}

/**
 * 期間を生成
 */
function generatePeriods(
  startDate: Date,
  endDate: Date,
  periodType: 'day' | 'week' | 'month'
): Array<{ start: Date; end: Date }> {
  const periods: Array<{ start: Date; end: Date }> = [];
  let currentDate = startOfDay(startDate);
  const finalDate = startOfDay(endDate);

  while (currentDate <= finalDate) {
    let periodEnd: Date;

    switch (periodType) {
      case 'day':
        periodEnd = currentDate;
        break;
      case 'week':
        periodEnd = addDays(currentDate, 6);
        if (periodEnd > finalDate) {
          periodEnd = finalDate;
        }
        break;
      case 'month':
        periodEnd = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );
        if (periodEnd > finalDate) {
          periodEnd = finalDate;
        }
        break;
    }

    periods.push({
      start: currentDate,
      end: periodEnd,
    });

    // 次の期間へ
    switch (periodType) {
      case 'day':
        currentDate = addDays(currentDate, 1);
        break;
      case 'week':
        currentDate = addDays(currentDate, 7);
        break;
      case 'month':
        currentDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          1
        );
        break;
    }
  }

  return periods;
}

/**
 * 期間内の利用可能時間を計算
 */
function calculateAvailableHours(
  resource: Resource,
  startDate: Date,
  endDate: Date
): number {
  const days = differenceInDays(endDate, startDate) + 1;

  // 基本: 1日8時間、週5日稼働として計算
  const workDaysPerWeek = 5;
  const hoursPerDay = 8;

  // 実際の稼働日数を計算（土日を除く）
  let workDays = 0;
  let currentDate = startOfDay(startDate);

  for (let i = 0; i < days; i++) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // 土日以外
      workDays++;
    }
    currentDate = addDays(currentDate, 1);
  }

  // リソースの最大稼働率を考慮
  const availableHours = workDays * hoursPerDay * (resource.maxUnits / 100);

  return availableHours;
}

/**
 * 期間内の割り当て時間を計算
 */
function calculateAllocatedHours(
  resource: Resource,
  tasks: Task[],
  startDate: Date,
  endDate: Date
): {
  allocatedHours: number;
  taskBreakdown: Array<{ taskId: string; taskName: string; hours: number }>;
} {
  let totalHours = 0;
  const taskBreakdown: Array<{ taskId: string; taskName: string; hours: number }> = [];

  // このリソースが割り当てられているタスクを抽出
  const allocations = resource.allocations || [];

  for (const allocation of allocations) {
    const task = tasks.find(t => t.id === allocation.taskId);
    if (!task) continue;

    // タスクの期間とヒストグラム期間の重なりを計算
    const taskStart = new Date(allocation.startDate);
    const taskEnd = new Date(allocation.endDate);

    // 重なりがあるかチェック
    if (taskEnd < startDate || taskStart > endDate) {
      continue; // 重なりなし
    }

    // 重なり期間を計算
    const overlapStart = taskStart > startDate ? taskStart : startDate;
    const overlapEnd = taskEnd < endDate ? taskEnd : endDate;
    const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;

    // タスクの総作業日数
    const taskDays = differenceInDays(taskEnd, taskStart) + 1;

    // この期間での作業時間を按分計算
    const plannedWork = allocation.plannedWork || 0;
    const periodWork = taskDays > 0 ? (plannedWork * overlapDays) / taskDays : 0;

    totalHours += periodWork;
    taskBreakdown.push({
      taskId: task.id,
      taskName: task.name,
      hours: Math.round(periodWork * 10) / 10,
    });
  }

  return {
    allocatedHours: Math.round(totalHours * 10) / 10,
    taskBreakdown,
  };
}

/**
 * リソース使用率を計算
 */
export function calculateResourceUtilization(
  resource: Resource,
  tasks: Task[],
  startDate: Date,
  endDate: Date
): {
  utilizationRate: number;
  totalAllocatedHours: number;
  totalAvailableHours: number;
  overallocationHours: number;
} {
  const availableHours = calculateAvailableHours(resource, startDate, endDate);
  const { allocatedHours } = calculateAllocatedHours(resource, tasks, startDate, endDate);

  const utilizationRate = availableHours > 0
    ? Math.round((allocatedHours / availableHours) * 100)
    : 0;

  const overallocationHours = Math.max(0, allocatedHours - availableHours);

  return {
    utilizationRate,
    totalAllocatedHours: allocatedHours,
    totalAvailableHours: availableHours,
    overallocationHours,
  };
}

/**
 * 複数リソースの使用率サマリーを生成
 */
export function generateResourceUtilizationSummary(
  resources: Resource[],
  tasks: Task[],
  startDate: Date,
  endDate: Date
): Array<{
  resourceId: string;
  resourceName: string;
  utilizationRate: number;
  allocatedHours: number;
  availableHours: number;
  isOverallocated: boolean;
}> {
  return resources.map(resource => {
    const utilization = calculateResourceUtilization(
      resource,
      tasks,
      startDate,
      endDate
    );

    return {
      resourceId: resource.id,
      resourceName: resource.name,
      utilizationRate: utilization.utilizationRate,
      allocatedHours: utilization.totalAllocatedHours,
      availableHours: utilization.totalAvailableHours,
      isOverallocated: utilization.overallocationHours > 0,
    };
  });
}
