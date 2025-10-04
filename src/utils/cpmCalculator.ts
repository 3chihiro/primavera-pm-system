/**
 * CPM（Critical Path Method）スケジューリング計算ユーティリティ
 *
 * このモジュールは、プロジェクトスケジューリングのための
 * クリティカルパス法（CPM）の計算を行います。
 */

import { Task, TaskDependency, DependencyType, ConstraintType } from '../types/task';

/**
 * CPM計算結果の型定義
 */
export interface CPMResult {
  taskId: string;
  earlyStart: Date;
  earlyFinish: Date;
  lateStart: Date;
  lateFinish: Date;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
}

/**
 * タスクネットワーク解析用の内部データ構造
 */
interface TaskNode {
  task: Task;
  earlyStart: Date | null;
  earlyFinish: Date | null;
  lateStart: Date | null;
  lateFinish: Date | null;
  totalFloat: number;
  freeFloat: number;
  predecessors: string[];
  successors: string[];
}

/**
 * CPMスケジューリング計算のメインクラス
 */
export class CPMCalculator {
  private tasks: Task[];
  private taskNodes: Map<string, TaskNode>;
  private projectStartDate: Date;

  constructor(tasks: Task[], projectStartDate: Date) {
    this.tasks = tasks;
    this.projectStartDate = projectStartDate;
    this.taskNodes = new Map();
    this.initializeTaskNodes();
  }

  /**
   * タスクノードを初期化
   */
  private initializeTaskNodes(): void {
    // タスクノードの作成
    for (const task of this.tasks) {
      this.taskNodes.set(task.id, {
        task,
        earlyStart: null,
        earlyFinish: null,
        lateStart: null,
        lateFinish: null,
        totalFloat: 0,
        freeFloat: 0,
        predecessors: task.dependencies.map(d => d.predecessorId),
        successors: []
      });
    }

    // 後続タスク（successors）の設定
    for (const task of this.tasks) {
      for (const dep of task.dependencies) {
        const predecessorNode = this.taskNodes.get(dep.predecessorId);
        if (predecessorNode) {
          predecessorNode.successors.push(task.id);
        }
      }
    }
  }

  /**
   * CPM計算を実行（Forward Pass → Backward Pass → Float計算）
   */
  public calculate(): CPMResult[] {
    this.forwardPass();
    this.backwardPass();
    this.calculateFloats();

    return this.getResults();
  }

  /**
   * Forward Pass: 最早開始日・最早終了日の計算
   * プロジェクト開始から順に、各タスクの最も早く開始・終了できる日付を計算
   */
  private forwardPass(): void {
    // トポロジカルソート（依存関係順に処理するため）
    const sortedTaskIds = this.topologicalSort();

    for (const taskId of sortedTaskIds) {
      const node = this.taskNodes.get(taskId);
      if (!node) continue;

      const task = node.task;

      // 最早開始日の計算
      let earlyStart = this.projectStartDate;

      // 先行タスクの制約を考慮
      for (const dep of task.dependencies) {
        const predecessorNode = this.taskNodes.get(dep.predecessorId);
        if (!predecessorNode || !predecessorNode.earlyFinish) continue;

        const constraintDate = this.calculateDependencyDate(
          predecessorNode,
          dep.type,
          dep.lag,
          'forward'
        );

        if (constraintDate > earlyStart) {
          earlyStart = constraintDate;
        }
      }

      // 制約条件を考慮
      earlyStart = this.applyConstraints(task, earlyStart, 'forward');

      // 最早終了日の計算
      const earlyFinish = this.addWorkingDays(earlyStart, task.duration);

      node.earlyStart = earlyStart;
      node.earlyFinish = earlyFinish;
    }
  }

  /**
   * Backward Pass: 最遅開始日・最遅終了日の計算
   * プロジェクト終了から逆算して、各タスクの最も遅く開始・終了できる日付を計算
   */
  private backwardPass(): void {
    // プロジェクト終了日を取得（全タスクの最遅終了日）
    const projectEndDate = this.getProjectEndDate();

    // トポロジカルソートの逆順で処理
    const sortedTaskIds = this.topologicalSort().reverse();

    for (const taskId of sortedTaskIds) {
      const node = this.taskNodes.get(taskId);
      if (!node || !node.earlyFinish) continue;

      const task = node.task;

      // 最遅終了日の初期値はプロジェクト終了日
      let lateFinish = projectEndDate;

      // 後続タスクの制約を考慮
      if (node.successors.length > 0) {
        lateFinish = new Date(8640000000000000); // Max date

        for (const successorId of node.successors) {
          const successorNode = this.taskNodes.get(successorId);
          if (!successorNode || !successorNode.lateStart) continue;

          const successorTask = successorNode.task;
          const dependency = successorTask.dependencies.find(
            d => d.predecessorId === taskId
          );

          if (dependency) {
            const constraintDate = this.calculateDependencyDate(
              successorNode,
              dependency.type,
              dependency.lag,
              'backward'
            );

            if (constraintDate < lateFinish) {
              lateFinish = constraintDate;
            }
          }
        }
      }

      // 制約条件を考慮
      lateFinish = this.applyConstraints(task, lateFinish, 'backward');

      // 最遅開始日の計算
      const lateStart = this.subtractWorkingDays(lateFinish, task.duration);

      node.lateStart = lateStart;
      node.lateFinish = lateFinish;
    }
  }

  /**
   * フロート（余裕期間）の計算
   */
  private calculateFloats(): void {
    for (const [taskId, node] of this.taskNodes) {
      if (!node.earlyStart || !node.lateStart || !node.earlyFinish || !node.lateFinish) {
        continue;
      }

      // Total Float = LS - ES または LF - EF
      const totalFloat = this.getWorkingDaysDifference(
        node.earlyStart,
        node.lateStart
      );

      // Free Float: このタスクを遅らせても後続タスクに影響しない日数
      let freeFloat = totalFloat;

      for (const successorId of node.successors) {
        const successorNode = this.taskNodes.get(successorId);
        if (!successorNode || !successorNode.earlyStart) continue;

        const float = this.getWorkingDaysDifference(
          node.earlyFinish,
          successorNode.earlyStart
        );

        if (float < freeFloat) {
          freeFloat = float;
        }
      }

      node.totalFloat = totalFloat;
      node.freeFloat = Math.max(0, freeFloat);
    }
  }

  /**
   * 依存関係に基づく日付計算
   */
  private calculateDependencyDate(
    relatedNode: TaskNode,
    depType: DependencyType,
    lag: number,
    direction: 'forward' | 'backward'
  ): Date {
    let baseDate: Date;

    if (direction === 'forward') {
      // Forward Pass: 先行タスクから後続タスクの開始日を計算
      switch (depType) {
        case 'FS': // Finish to Start
          baseDate = relatedNode.earlyFinish!;
          break;
        case 'SS': // Start to Start
          baseDate = relatedNode.earlyStart!;
          break;
        case 'FF': // Finish to Finish
          baseDate = relatedNode.earlyFinish!;
          break;
        case 'SF': // Start to Finish
          baseDate = relatedNode.earlyStart!;
          break;
        default:
          baseDate = relatedNode.earlyFinish!;
      }
      return this.addWorkingDays(baseDate, lag);
    } else {
      // Backward Pass: 後続タスクから先行タスクの終了日を計算
      switch (depType) {
        case 'FS': // Finish to Start
          baseDate = relatedNode.lateStart!;
          break;
        case 'SS': // Start to Start
          baseDate = relatedNode.lateStart!;
          break;
        case 'FF': // Finish to Finish
          baseDate = relatedNode.lateFinish!;
          break;
        case 'SF': // Start to Finish
          baseDate = relatedNode.lateFinish!;
          break;
        default:
          baseDate = relatedNode.lateStart!;
      }
      return this.subtractWorkingDays(baseDate, lag);
    }
  }

  /**
   * 制約条件の適用
   */
  private applyConstraints(
    task: Task,
    calculatedDate: Date,
    direction: 'forward' | 'backward'
  ): Date {
    if (!task.constraints || task.constraints.length === 0) {
      return calculatedDate;
    }

    let constrainedDate = calculatedDate;

    for (const constraint of task.constraints) {
      switch (constraint.type) {
        case 'MSO': // Must Start On
          if (direction === 'forward') {
            constrainedDate = constraint.date;
          }
          break;

        case 'MFO': // Must Finish On
          if (direction === 'backward') {
            constrainedDate = constraint.date;
          }
          break;

        case 'SNET': // Start No Earlier Than
          if (direction === 'forward' && constraint.date > constrainedDate) {
            constrainedDate = constraint.date;
          }
          break;

        case 'SNLT': // Start No Later Than
          if (direction === 'forward' && constraint.date < constrainedDate) {
            constrainedDate = constraint.date;
          }
          break;

        case 'FNET': // Finish No Earlier Than
          if (direction === 'backward' && constraint.date > constrainedDate) {
            constrainedDate = constraint.date;
          }
          break;

        case 'FNLT': // Finish No Later Than
          if (direction === 'backward' && constraint.date < constrainedDate) {
            constrainedDate = constraint.date;
          }
          break;

        case 'ASAP': // As Soon As Possible (デフォルト動作)
        case 'ALAP': // As Late As Possible
          // これらは計算ロジック自体で考慮される
          break;
      }
    }

    return constrainedDate;
  }

  /**
   * トポロジカルソート（依存関係順にタスクをソート）
   */
  private topologicalSort(): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string): void => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) {
        // 循環依存を検出
        console.warn(`Circular dependency detected involving task: ${taskId}`);
        return;
      }

      visiting.add(taskId);
      const node = this.taskNodes.get(taskId);

      if (node) {
        for (const predecessorId of node.predecessors) {
          visit(predecessorId);
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);
      sorted.push(taskId);
    };

    for (const taskId of this.taskNodes.keys()) {
      visit(taskId);
    }

    return sorted;
  }

  /**
   * プロジェクト終了日を取得（全タスクの最早終了日の最大値）
   */
  private getProjectEndDate(): Date {
    let maxDate = this.projectStartDate;

    for (const node of this.taskNodes.values()) {
      if (node.earlyFinish && node.earlyFinish > maxDate) {
        maxDate = node.earlyFinish;
      }
    }

    return maxDate;
  }

  /**
   * 作業日を加算（週末・祝日を除く）
   * 簡易版: 土日のみ除外（祝日対応は後で追加可能）
   */
  private addWorkingDays(startDate: Date, days: number): Date {
    const result = new Date(startDate);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);

      // 土日をスキップ
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    return result;
  }

  /**
   * 作業日を減算（週末・祝日を除く）
   */
  private subtractWorkingDays(endDate: Date, days: number): Date {
    const result = new Date(endDate);
    let subtractedDays = 0;

    while (subtractedDays < days) {
      result.setDate(result.getDate() - 1);

      // 土日をスキップ
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        subtractedDays++;
      }
    }

    return result;
  }

  /**
   * 2つの日付間の作業日数を計算
   */
  private getWorkingDaysDifference(startDate: Date, endDate: Date): number {
    if (endDate < startDate) return 0;

    let count = 0;
    const current = new Date(startDate);

    while (current < endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * CPM計算結果を取得
   */
  private getResults(): CPMResult[] {
    const results: CPMResult[] = [];

    for (const [taskId, node] of this.taskNodes) {
      if (!node.earlyStart || !node.earlyFinish || !node.lateStart || !node.lateFinish) {
        continue;
      }

      results.push({
        taskId,
        earlyStart: node.earlyStart,
        earlyFinish: node.earlyFinish,
        lateStart: node.lateStart,
        lateFinish: node.lateFinish,
        totalFloat: node.totalFloat,
        freeFloat: node.freeFloat,
        isCritical: node.totalFloat === 0
      });
    }

    return results;
  }

  /**
   * クリティカルパスを取得（Total Float = 0のタスクのチェーン）
   */
  public getCriticalPath(): string[] {
    const criticalTasks: string[] = [];

    for (const [taskId, node] of this.taskNodes) {
      if (node.totalFloat === 0) {
        criticalTasks.push(taskId);
      }
    }

    return criticalTasks;
  }
}

/**
 * タスク配列に対してCPM計算を実行するヘルパー関数
 */
export function calculateCPM(tasks: Task[], projectStartDate: Date): CPMResult[] {
  const calculator = new CPMCalculator(tasks, projectStartDate);
  return calculator.calculate();
}

/**
 * クリティカルパスを取得するヘルパー関数
 */
export function getCriticalPath(tasks: Task[], projectStartDate: Date): string[] {
  const calculator = new CPMCalculator(tasks, projectStartDate);
  calculator.calculate();
  return calculator.getCriticalPath();
}
