import { Task } from '../types/task';
import { Baseline, BaselineTask, EVMMetrics, TaskEVMData, ProjectEVMSummary, EVMTrend } from '../types/progress';
import { differenceInDays, isAfter, isBefore, isEqual } from 'date-fns';

/**
 * EVM（Earned Value Management）計算ユーティリティ
 *
 * EVM指標の計算方法:
 * - PV (Planned Value): 計画値 = ベースラインコスト × 計画進捗率
 * - EV (Earned Value): 出来高 = ベースラインコスト × 実際進捗率
 * - AC (Actual Cost): 実コスト = 実際に発生したコスト
 * - CV (Cost Variance): コスト差異 = EV - AC
 * - SV (Schedule Variance): スケジュール差異 = EV - PV
 * - CPI (Cost Performance Index): コスト効率指標 = EV / AC
 * - SPI (Schedule Performance Index): スケジュール効率指標 = EV / PV
 */

/**
 * タスクのEVM指標を計算
 */
export function calculateTaskEVM(
  task: Task,
  baselineTask: BaselineTask | undefined,
  statusDate: Date = new Date()
): TaskEVMData {
  const budgetedCost = task.budgetedCost || 0;
  const actualCost = task.actualCost || 0;
  const percentComplete = task.percentComplete || 0;
  const physicalPercentComplete = task.physicalPercentComplete || percentComplete;

  // ベースライン情報
  const baselineStartDate = baselineTask?.startDate || task.plannedStartDate;
  const baselineEndDate = baselineTask?.endDate || task.plannedEndDate;
  const baselineDuration = baselineTask?.duration || task.duration;
  const baselineCost = baselineTask?.budgetedCost || budgetedCost;

  // PV計算（計画値）
  const pv = calculatePlannedValue(
    baselineStartDate,
    baselineEndDate,
    baselineCost,
    statusDate
  );

  // EV計算（出来高）
  const ev = (baselineCost * physicalPercentComplete) / 100;

  // AC（実コスト）
  const ac = actualCost;

  // ステータス判定
  const status = determineTaskStatus(pv, ev, ac, percentComplete);
  const isComplete = percentComplete >= 100;

  return {
    taskId: task.id,
    taskName: task.name,

    baselineStartDate: new Date(baselineStartDate),
    baselineEndDate: new Date(baselineEndDate),
    baselineDuration,
    baselineCost,

    plannedStartDate: new Date(task.plannedStartDate),
    plannedEndDate: new Date(task.plannedEndDate),
    plannedDuration: task.duration,
    budgetedCost,

    actualStartDate: task.actualStartDate ? new Date(task.actualStartDate) : undefined,
    actualEndDate: task.actualEndDate ? new Date(task.actualEndDate) : undefined,
    percentComplete,
    physicalPercentComplete,
    actualCost,
    remainingDuration: task.remainingDuration || 0,

    pv,
    ev,
    ac,

    status,
    isComplete,
  };
}

/**
 * 計画値（PV）を計算
 * 基準日時点での計画進捗率に基づいてPVを算出
 */
function calculatePlannedValue(
  startDate: Date,
  endDate: Date,
  budgetedCost: number,
  statusDate: Date
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const status = new Date(statusDate);

  // 基準日がタスク開始前
  if (isBefore(status, start)) {
    return 0;
  }

  // 基準日がタスク終了後またはタスク終了日と同じ
  if (isAfter(status, end) || isEqual(status, end)) {
    return budgetedCost;
  }

  // 基準日がタスク実行期間中
  const totalDuration = differenceInDays(end, start);
  const elapsedDuration = differenceInDays(status, start);

  if (totalDuration <= 0) {
    return budgetedCost;
  }

  const plannedProgress = elapsedDuration / totalDuration;
  return budgetedCost * plannedProgress;
}

/**
 * タスクのステータスを判定
 */
function determineTaskStatus(
  pv: number,
  ev: number,
  ac: number,
  percentComplete: number
): 'ahead' | 'on_track' | 'behind' | 'critical' {
  const sv = ev - pv; // スケジュール差異
  const cv = ev - ac; // コスト差異

  // 完了している場合
  if (percentComplete >= 100) {
    return cv >= 0 ? 'on_track' : 'behind';
  }

  // クリティカル（スケジュールもコストも遅延）
  if (sv < -0.1 * pv && cv < -0.1 * ac) {
    return 'critical';
  }

  // スケジュール遅延
  if (sv < -0.05 * pv) {
    return 'behind';
  }

  // スケジュール先行
  if (sv > 0.05 * pv) {
    return 'ahead';
  }

  // 正常範囲内
  return 'on_track';
}

/**
 * プロジェクト全体のEVM指標を計算
 */
export function calculateProjectEVM(
  tasks: Task[],
  baselineTasks: BaselineTask[],
  statusDate: Date = new Date()
): EVMMetrics {
  let totalPV = 0;
  let totalEV = 0;
  let totalAC = 0;
  let totalBAC = 0;

  const baselineMap = new Map<string, BaselineTask>();
  baselineTasks.forEach(bt => baselineMap.set(bt.taskId, bt));

  tasks.forEach(task => {
    const baselineTask = baselineMap.get(task.id);
    const taskEVM = calculateTaskEVM(task, baselineTask, statusDate);

    totalPV += taskEVM.pv;
    totalEV += taskEVM.ev;
    totalAC += taskEVM.ac;
    totalBAC += taskEVM.baselineCost;
  });

  // 差異計算
  const cv = totalEV - totalAC; // コスト差異
  const sv = totalEV - totalPV; // スケジュール差異

  // パフォーマンス指標計算
  const cpi = totalAC > 0 ? totalEV / totalAC : 1;
  const spi = totalPV > 0 ? totalEV / totalPV : 1;

  // 予測値計算
  const etc = cpi > 0 ? (totalBAC - totalEV) / cpi : totalBAC - totalEV;
  const eac = totalAC + etc;
  const vac = totalBAC - eac;
  const tcpi = (totalBAC - totalEV) > 0 && (totalBAC - totalAC) > 0
    ? (totalBAC - totalEV) / (totalBAC - totalAC)
    : 1;

  return {
    pv: totalPV,
    ev: totalEV,
    ac: totalAC,
    bac: totalBAC,

    cv,
    sv,

    cpi,
    spi,

    etc,
    eac,
    vac,
    tcpi,

    calculatedDate: statusDate,
  };
}

/**
 * プロジェクトのEVMサマリーを生成
 */
export function generateProjectEVMSummary(
  projectId: string,
  projectName: string,
  tasks: Task[],
  baseline: Baseline | undefined,
  statusDate: Date = new Date()
): ProjectEVMSummary {
  const baselineTasks = baseline?.tasks || [];
  const metrics = calculateProjectEVM(tasks, baselineTasks, statusDate);

  // タスク統計
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.percentComplete >= 100).length;
  const inProgressTasks = tasks.filter(t => t.percentComplete > 0 && t.percentComplete < 100).length;
  const notStartedTasks = tasks.filter(t => t.percentComplete === 0).length;

  // 進捗状況計算
  const overallProgress = totalTasks > 0
    ? tasks.reduce((sum, t) => sum + t.percentComplete, 0) / totalTasks
    : 0;

  const scheduleProgress = metrics.pv > 0 ? (metrics.ev / metrics.pv) * 100 : 0;
  const costProgress = metrics.bac > 0 ? (metrics.ev / metrics.bac) * 100 : 0;

  // ステータス判定
  const projectStatus = determineProjectStatus(metrics.cpi, metrics.spi);
  const scheduleStatus = determineScheduleStatus(metrics.spi);
  const costStatus = determineCostStatus(metrics.cpi);

  // 日付情報
  const baselineStartDate = baseline?.tasks.reduce((earliest, t) => {
    const date = new Date(t.startDate);
    return !earliest || date < earliest ? date : earliest;
  }, null as Date | null) || new Date();

  const baselineEndDate = baseline?.tasks.reduce((latest, t) => {
    const date = new Date(t.endDate);
    return !latest || date > latest ? date : latest;
  }, null as Date | null) || new Date();

  const currentStartDate = tasks.reduce((earliest, t) => {
    const date = new Date(t.plannedStartDate);
    return !earliest || date < earliest ? date : earliest;
  }, null as Date | null) || new Date();

  const currentEndDate = tasks.reduce((latest, t) => {
    const date = new Date(t.plannedEndDate);
    return !latest || date > latest ? date : latest;
  }, null as Date | null) || new Date();

  return {
    projectId,
    projectName,

    metrics,

    totalTasks,
    completedTasks,
    inProgressTasks,
    notStartedTasks,

    overallProgress,
    scheduleProgress,
    costProgress,

    projectStatus,
    scheduleStatus,
    costStatus,

    baselineStartDate,
    baselineEndDate,
    currentStartDate,
    currentEndDate,
    statusDate,
  };
}

/**
 * プロジェクト全体のステータスを判定
 */
function determineProjectStatus(cpi: number, spi: number): 'green' | 'yellow' | 'red' {
  // 両方とも良好（>= 0.95）
  if (cpi >= 0.95 && spi >= 0.95) {
    return 'green';
  }

  // どちらかが深刻（< 0.85）
  if (cpi < 0.85 || spi < 0.85) {
    return 'red';
  }

  // それ以外は注意
  return 'yellow';
}

/**
 * スケジュールステータスを判定
 */
function determineScheduleStatus(spi: number): 'ahead' | 'on_track' | 'behind' {
  if (spi > 1.05) return 'ahead';
  if (spi < 0.95) return 'behind';
  return 'on_track';
}

/**
 * コストステータスを判定
 */
function determineCostStatus(cpi: number): 'under_budget' | 'on_budget' | 'over_budget' {
  if (cpi > 1.05) return 'under_budget';
  if (cpi < 0.95) return 'over_budget';
  return 'on_budget';
}

/**
 * EVMトレンドデータを生成
 */
export function generateEVMTrend(
  tasks: Task[],
  baselineTasks: BaselineTask[],
  startDate: Date,
  endDate: Date,
  intervalDays: number = 7
): EVMTrend[] {
  const trends: EVMTrend[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const metrics = calculateProjectEVM(tasks, baselineTasks, currentDate);

    trends.push({
      date: new Date(currentDate),
      pv: metrics.pv,
      ev: metrics.ev,
      ac: metrics.ac,
      cpi: metrics.cpi,
      spi: metrics.spi,
    });

    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + intervalDays);
  }

  return trends;
}

/**
 * 問題のあるタスクを抽出
 */
export function identifyProblemTasks(
  tasks: Task[],
  baselineTasks: BaselineTask[],
  statusDate: Date = new Date()
): {
  critical: TaskEVMData[];
  behindSchedule: TaskEVMData[];
  overBudget: TaskEVMData[];
} {
  const baselineMap = new Map<string, BaselineTask>();
  baselineTasks.forEach(bt => baselineMap.set(bt.taskId, bt));

  const critical: TaskEVMData[] = [];
  const behindSchedule: TaskEVMData[] = [];
  const overBudget: TaskEVMData[] = [];

  tasks.forEach(task => {
    const baselineTask = baselineMap.get(task.id);
    const taskEVM = calculateTaskEVM(task, baselineTask, statusDate);

    if (taskEVM.status === 'critical') {
      critical.push(taskEVM);
    }

    if (taskEVM.status === 'behind' || taskEVM.status === 'critical') {
      behindSchedule.push(taskEVM);
    }

    const cv = taskEVM.ev - taskEVM.ac;
    if (cv < 0) {
      overBudget.push(taskEVM);
    }
  });

  return {
    critical: critical.sort((a, b) => (a.ev - a.pv) - (b.ev - b.pv)),
    behindSchedule: behindSchedule.sort((a, b) => (a.ev - a.pv) - (b.ev - b.pv)),
    overBudget: overBudget.sort((a, b) => (a.ev - a.ac) - (b.ev - b.ac)),
  };
}
