/**
 * ベースライン関連の型定義
 */

export interface Baseline {
  id: string;
  projectId: string;
  name: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  tasks: BaselineTask[];
}

export interface BaselineTask {
  id: string;
  baselineId: string;
  taskId: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  budgetedCost: number;
}

export interface CreateBaselineData {
  projectId: string;
  name: string;
  description?: string;
  createdBy?: string;
  tasks: CreateBaselineTaskData[];
}

export interface CreateBaselineTaskData {
  taskId: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  budgetedCost: number;
}

export interface BaselineSummary {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  tasksCount: number;
  totalBudget: number;
  totalDuration: number;
}
