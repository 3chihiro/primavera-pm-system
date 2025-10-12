import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { Project, CreateProjectData, UpdateProjectData } from '../types/project';
import { Task, CreateTaskData, UpdateTaskData } from '../types/task';
import { Resource, CreateResourceData, UpdateResourceData } from '../types/resource';
import { Baseline, BaselineTask, ProgressUpdate, TaskEVMData, EVMMetrics } from '../types/progress';

/**
 * SQLiteデータベースサービスクラス
 * プロジェクト管理システムのデータベース操作を統括
 */
export class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    // ユーザーデータディレクトリにデータベースファイルを配置
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'primavera_pm.db');
  }

  /**
   * データベースの初期化
   */
  public async initialize(): Promise<void> {
    try {
      // データベースディレクトリが存在しない場合は作成
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // データベース接続を開く
      this.db = new Database(this.dbPath);
      
      // WALモードを有効化（パフォーマンス向上）
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000000');
      this.db.pragma('temp_store = memory');

      // スキーマの作成
      await this.createSchema();

      console.log('データベースの初期化が完了しました:', this.dbPath);
    } catch (error) {
      console.error('データベース初期化エラー:', error);
      throw error;
    }
  }

  /**
   * データベーススキーマの作成
   */
  private async createSchema(): Promise<void> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    // スキーマファイルの読み込み
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

    // スキーマを実行
    this.db.exec(schemaSQL);
  }

  /**
   * データベース接続を閉じる
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // ==================== プロジェクト関連操作 ====================

  /**
   * プロジェクト作成
   */
  public async createProject(projectData: CreateProjectData): Promise<Project> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const id = this.generateId();
    const now = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO projects (
        id, name, description, start_date, end_date, status, priority,
        manager, budget, actual_cost, currency, progress_data, 
        baseline_data, settings_data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      id,
      projectData.name,
      projectData.description,
      projectData.startDate.toISOString(),
      projectData.endDate.toISOString(),
      projectData.status,
      projectData.priority,
      projectData.manager,
      projectData.budget,
      projectData.actualCost,
      projectData.currency,
      JSON.stringify(projectData.progress || {}),
      projectData.baseline ? JSON.stringify(projectData.baseline) : null,
      JSON.stringify(projectData.settings),
      now.toISOString(),
      now.toISOString()
    );

    if (result.changes === 0) {
      throw new Error('プロジェクトの作成に失敗しました');
    }

    return this.getProject(id);
  }

  /**
   * プロジェクト一覧取得
   */
  public async getProjects(): Promise<Project[]> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM projects 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all();
    return rows.map(row => this.mapRowToProject(row));
  }

  /**
   * 特定プロジェクト取得
   */
  public async getProject(projectId: string): Promise<Project> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(projectId);

    if (!row) {
      throw new Error(`プロジェクト (ID: ${projectId}) が見つかりません`);
    }

    return this.mapRowToProject(row);
  }

  /**
   * プロジェクト更新
   */
  public async updateProject(projectId: string, updates: UpdateProjectData): Promise<Project> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const updateFields: string[] = [];
    const values: any[] = [];

    // 動的にUPDATE文を構築
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        switch (key) {
          case 'startDate':
          case 'endDate':
            updateFields.push(`${this.camelToSnake(key)} = ?`);
            values.push((value as Date).toISOString());
            break;
          case 'progress':
          case 'baseline':
          case 'settings':
            updateFields.push(`${this.camelToSnake(key)}_data = ?`);
            values.push(JSON.stringify(value));
            break;
          default:
            updateFields.push(`${this.camelToSnake(key)} = ?`);
            values.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      throw new Error('更新するフィールドが指定されていません');
    }

    updateFields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(projectId);

    const stmt = this.db.prepare(`
      UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...values);

    if (result.changes === 0) {
      throw new Error('プロジェクトの更新に失敗しました');
    }

    return this.getProject(projectId);
  }

  /**
   * プロジェクト削除
   */
  public async deleteProject(projectId: string): Promise<void> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    const result = stmt.run(projectId);

    if (result.changes === 0) {
      throw new Error('プロジェクトの削除に失敗しました');
    }
  }

  // ==================== タスク関連操作 ====================

  /**
   * プロジェクトのタスク一覧取得
   */
  public async getProjectTasks(projectId: string): Promise<Task[]> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM tasks
      WHERE project_id = ?
      ORDER BY wbs_code
    `);

    const rows = stmt.all(projectId);
    return rows.map(row => this.mapRowToTask(row));
  }

  /**
   * タスク取得
   */
  public async getTask(taskId: string): Promise<Task | null> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(taskId);

    if (!row) {
      return null;
    }

    return this.mapRowToTask(row);
  }

  // ==================== リソース関連操作 ====================

  /**
   * プロジェクトのリソース一覧取得
   */
  public async getProjectResources(projectId: string): Promise<Resource[]> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM resources
      WHERE project_id = ?
      ORDER BY code
    `);

    const rows = stmt.all(projectId);
    return rows.map(row => this.mapRowToResource(row));
  }

  /**
   * リソース作成
   */
  public async createResource(projectId: string, data: CreateResourceData): Promise<Resource> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const resourceId = this.generateId();

    const stmt = this.db.prepare(`
      INSERT INTO resources (
        id, project_id, code, name, type, category, description,
        email, phone, department, standard_rate, overtime_rate, cost_per_use,
        currency, max_units, skills_data, availability_data, is_active, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      resourceId,
      projectId,
      data.code,
      data.name,
      data.type,
      data.category || '',
      data.description || '',
      data.email || null,
      data.phone || null,
      data.department || null,
      data.standardRate || 0,
      data.overtimeRate || 0,
      data.costPerUse || 0,
      data.currency || 'JPY',
      data.maxUnits || 100,
      JSON.stringify(data.skills || []),
      JSON.stringify(data.availability || []),
      data.isActive !== false ? 1 : 0,
      data.notes || ''
    );

    const resource = await this.getResource(resourceId);
    if (!resource) {
      throw new Error('リソースの作成に失敗しました');
    }

    return resource;
  }

  /**
   * リソース取得
   */
  public async getResource(resourceId: string): Promise<Resource | null> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare('SELECT * FROM resources WHERE id = ?');
    const row = stmt.get(resourceId);

    return row ? this.mapRowToResource(row) : null;
  }

  /**
   * リソース更新
   */
  public async updateResource(resourceId: string, data: UpdateResourceData): Promise<Resource> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.code !== undefined) {
      updateFields.push('code = ?');
      values.push(data.code);
    }
    if (data.name !== undefined) {
      updateFields.push('name = ?');
      values.push(data.name);
    }
    if (data.type !== undefined) {
      updateFields.push('type = ?');
      values.push(data.type);
    }
    if (data.category !== undefined) {
      updateFields.push('category = ?');
      values.push(data.category);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      values.push(data.description);
    }
    if (data.email !== undefined) {
      updateFields.push('email = ?');
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      updateFields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.department !== undefined) {
      updateFields.push('department = ?');
      values.push(data.department);
    }
    if (data.standardRate !== undefined) {
      updateFields.push('standard_rate = ?');
      values.push(data.standardRate);
    }
    if (data.overtimeRate !== undefined) {
      updateFields.push('overtime_rate = ?');
      values.push(data.overtimeRate);
    }
    if (data.costPerUse !== undefined) {
      updateFields.push('cost_per_use = ?');
      values.push(data.costPerUse);
    }
    if (data.currency !== undefined) {
      updateFields.push('currency = ?');
      values.push(data.currency);
    }
    if (data.maxUnits !== undefined) {
      updateFields.push('max_units = ?');
      values.push(data.maxUnits);
    }
    if (data.skills !== undefined) {
      updateFields.push('skills_data = ?');
      values.push(JSON.stringify(data.skills));
    }
    if (data.availability !== undefined) {
      updateFields.push('availability_data = ?');
      values.push(JSON.stringify(data.availability));
    }
    if (data.isActive !== undefined) {
      updateFields.push('is_active = ?');
      values.push(data.isActive ? 1 : 0);
    }
    if (data.notes !== undefined) {
      updateFields.push('notes = ?');
      values.push(data.notes);
    }

    if (updateFields.length === 0) {
      const resource = await this.getResource(resourceId);
      if (!resource) {
        throw new Error('リソースが見つかりません');
      }
      return resource;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(resourceId);

    const stmt = this.db.prepare(`
      UPDATE resources SET ${updateFields.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...values);

    if (result.changes === 0) {
      throw new Error('リソースの更新に失敗しました');
    }

    const resource = await this.getResource(resourceId);
    if (!resource) {
      throw new Error('リソースの更新に失敗しました');
    }

    return resource;
  }

  /**
   * リソース削除
   */
  public async deleteResource(resourceId: string): Promise<void> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare('DELETE FROM resources WHERE id = ?');
    const result = stmt.run(resourceId);

    if (result.changes === 0) {
      throw new Error('リソースの削除に失敗しました');
    }
  }

  // ==================== リソース割り当て関連操作 ====================

  /**
   * タスクリソース割り当て作成
   */
  public async createTaskResourceAssignment(
    taskId: string,
    resourceId: string,
    allocation: number,
    startDate: Date,
    endDate: Date,
    plannedWork: number
  ): Promise<void> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const assignmentId = this.generateId();

    const stmt = this.db.prepare(`
      INSERT INTO task_resource_assignments (
        id, task_id, resource_id, allocation, start_date, end_date,
        planned_work, actual_work, remaining_work, cost, actual_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      assignmentId,
      taskId,
      resourceId,
      allocation,
      startDate.toISOString(),
      endDate.toISOString(),
      plannedWork,
      0, // actual_work
      plannedWork, // remaining_work
      0, // cost
      0  // actual_cost
    );
  }

  /**
   * タスクリソース割り当て更新
   */
  public async updateTaskResourceAssignment(
    taskId: string,
    resourceId: string,
    allocation: number,
    plannedWork: number
  ): Promise<void> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare(`
      UPDATE task_resource_assignments
      SET allocation = ?, planned_work = ?, remaining_work = ?
      WHERE task_id = ? AND resource_id = ?
    `);

    stmt.run(allocation, plannedWork, plannedWork, taskId, resourceId);
  }

  /**
   * タスクリソース割り当て削除
   */
  public async deleteTaskResourceAssignment(
    taskId: string,
    resourceId: string
  ): Promise<void> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare(`
      DELETE FROM task_resource_assignments
      WHERE task_id = ? AND resource_id = ?
    `);

    stmt.run(taskId, resourceId);
  }

  /**
   * タスクのリソース割り当て一覧取得
   */
  public async getTaskResourceAssignments(taskId: string): Promise<any[]> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM task_resource_assignments
      WHERE task_id = ?
    `);

    return stmt.all(taskId);
  }

  // ==================== ユーティリティメソッド ====================

  /**
   * データベース行をProjectオブジェクトにマッピング
   */
  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      status: row.status,
      priority: row.priority,
      manager: row.manager || '',
      budget: row.budget || 0,
      actualCost: row.actual_cost || 0,
      currency: row.currency || 'JPY',
      progress: JSON.parse(row.progress_data || '{}'),
      baseline: row.baseline_data ? JSON.parse(row.baseline_data) : null,
      settings: JSON.parse(row.settings_data || '{}'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * データベース行をTaskオブジェクトにマッピング
   */
  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      projectId: row.project_id,
      parentId: row.parent_id,
      wbsCode: row.wbs_code,
      name: row.name,
      description: row.description || '',
      type: row.type,
      status: row.status,
      priority: row.priority,
      plannedStartDate: new Date(row.planned_start_date),
      plannedEndDate: new Date(row.planned_end_date),
      actualStartDate: row.actual_start_date ? new Date(row.actual_start_date) : null,
      actualEndDate: row.actual_end_date ? new Date(row.actual_end_date) : null,
      duration: row.duration,
      remainingDuration: row.remaining_duration,
      percentComplete: row.percent_complete,
      physicalPercentComplete: row.physical_percent_complete,
      budgetedCost: row.budgeted_cost,
      actualCost: row.actual_cost,
      remainingCost: row.remaining_cost,
      assignedResources: [], // 別途取得が必要
      dependencies: [], // 別途取得が必要
      sortOrder: row.sort_order,
      notes: row.notes || '',
      tags: JSON.parse(row.tags || '[]'),
      cpm: JSON.parse(row.cpm_data || '{}'),
      constraints: JSON.parse(row.constraints_data || '[]'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * データベース行をResourceオブジェクトにマッピング
   */
  private mapRowToResource(row: any): Resource {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      category: row.category || '',
      description: row.description || '',
      email: row.email,
      phone: row.phone,
      department: row.department,
      standardRate: row.standard_rate,
      overtimeRate: row.overtime_rate,
      costPerUse: row.cost_per_use,
      currency: row.currency,
      maxUnits: row.max_units,
      skills: JSON.parse(row.skills_data || '[]'),
      availability: JSON.parse(row.availability_data || '[]'),
      allocations: [], // 別途取得が必要
      isActive: Boolean(row.is_active),
      notes: row.notes || '',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * camelCaseをsnake_caseに変換
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * 一意なIDを生成
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== ベースライン関連操作 ====================

  /**
   * ベースライン作成（プロジェクトの現在の状態をスナップショット）
   */
  public async createBaseline(
    projectId: string,
    name: string,
    description: string = '',
    createdBy: string = 'system'
  ): Promise<Baseline> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const baselineId = this.generateId();
    const now = new Date();

    // トランザクション開始
    const createBaselineStmt = this.db.prepare(`
      INSERT INTO baselines (id, project_id, name, description, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    createBaselineStmt.run(
      baselineId,
      projectId,
      name,
      description,
      now.toISOString(),
      createdBy
    );

    // プロジェクトの全タスクを取得してベースラインタスクに保存
    const tasks = await this.getProjectTasks(projectId);
    const createBaselineTaskStmt = this.db.prepare(`
      INSERT INTO baseline_tasks (id, baseline_id, task_id, start_date, end_date, duration, budgeted_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const baselineTasks: BaselineTask[] = [];

    for (const task of tasks) {
      const baselineTaskId = this.generateId();
      createBaselineTaskStmt.run(
        baselineTaskId,
        baselineId,
        task.id,
        task.plannedStartDate.toISOString(),
        task.plannedEndDate.toISOString(),
        task.duration,
        task.budgetedCost
      );

      baselineTasks.push({
        id: baselineTaskId,
        baselineId: baselineId,
        taskId: task.id,
        startDate: task.plannedStartDate,
        endDate: task.plannedEndDate,
        duration: task.duration,
        budgetedCost: task.budgetedCost,
      });
    }

    return {
      id: baselineId,
      projectId,
      name,
      description,
      createdAt: now,
      createdBy,
      tasks: baselineTasks,
    };
  }

  /**
   * ベースライン取得
   */
  public async getBaseline(baselineId: string): Promise<Baseline | null> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare('SELECT * FROM baselines WHERE id = ?');
    const row = stmt.get(baselineId);

    if (!row) {
      return null;
    }

    // ベースラインタスク取得
    const tasksStmt = this.db.prepare('SELECT * FROM baseline_tasks WHERE baseline_id = ?');
    const taskRows = tasksStmt.all(baselineId);

    const tasks: BaselineTask[] = taskRows.map((taskRow: any) => ({
      id: taskRow.id,
      baselineId: taskRow.baseline_id,
      taskId: taskRow.task_id,
      startDate: new Date(taskRow.start_date),
      endDate: new Date(taskRow.end_date),
      duration: taskRow.duration,
      budgetedCost: taskRow.budgeted_cost,
    }));

    return {
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      description: row.description || '',
      createdAt: new Date(row.created_at),
      createdBy: row.created_by || 'system',
      tasks,
    };
  }

  /**
   * プロジェクトのベースライン一覧取得
   */
  public async getProjectBaselines(projectId: string): Promise<Baseline[]> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare('SELECT * FROM baselines WHERE project_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(projectId);

    const baselines: Baseline[] = [];

    for (const row of rows) {
      const baseline = await this.getBaseline(row.id);
      if (baseline) {
        baselines.push(baseline);
      }
    }

    return baselines;
  }

  /**
   * ベースライン削除
   */
  public async deleteBaseline(baselineId: string): Promise<void> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const stmt = this.db.prepare('DELETE FROM baselines WHERE id = ?');
    const result = stmt.run(baselineId);

    if (result.changes === 0) {
      throw new Error('ベースラインの削除に失敗しました');
    }
  }

  // ==================== 進捗管理関連操作 ====================

  /**
   * タスク進捗更新
   */
  public async updateTaskProgress(progressData: ProgressUpdate): Promise<Task> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const updateFields: string[] = [];
    const values: any[] = [];

    if (progressData.percentComplete !== undefined) {
      updateFields.push('percent_complete = ?');
      values.push(progressData.percentComplete);
    }

    if (progressData.physicalPercentComplete !== undefined) {
      updateFields.push('physical_percent_complete = ?');
      values.push(progressData.physicalPercentComplete);
    }

    if (progressData.actualStartDate !== undefined) {
      updateFields.push('actual_start_date = ?');
      values.push(progressData.actualStartDate ? progressData.actualStartDate.toISOString() : null);
    }

    if (progressData.actualEndDate !== undefined) {
      updateFields.push('actual_end_date = ?');
      values.push(progressData.actualEndDate ? progressData.actualEndDate.toISOString() : null);
    }

    if (progressData.remainingDuration !== undefined) {
      updateFields.push('remaining_duration = ?');
      values.push(progressData.remainingDuration);
    }

    if (progressData.actualCost !== undefined) {
      updateFields.push('actual_cost = ?');
      values.push(progressData.actualCost);
    }

    if (progressData.notes !== undefined) {
      updateFields.push('notes = ?');
      values.push(progressData.notes);
    }

    // ステータス自動更新
    if (progressData.actualStartDate && progressData.percentComplete === 0) {
      updateFields.push('status = ?');
      values.push('in_progress');
    } else if (progressData.percentComplete === 100) {
      updateFields.push('status = ?');
      values.push('completed');
    }

    if (updateFields.length === 0) {
      const task = await this.getTask(progressData.taskId);
      if (!task) {
        throw new Error('タスクが見つかりません');
      }
      return task;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(progressData.taskId);

    const stmt = this.db.prepare(`
      UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...values);

    if (result.changes === 0) {
      throw new Error('タスク進捗の更新に失敗しました');
    }

    const task = await this.getTask(progressData.taskId);
    if (!task) {
      throw new Error('タスク進捗の更新に失敗しました');
    }

    return task;
  }

  /**
   * プロジェクトのEVM計算
   */
  public async calculateProjectEVM(projectId: string, statusDate: Date = new Date()): Promise<EVMMetrics> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    // プロジェクトの全タスクを取得
    const tasks = await this.getProjectTasks(projectId);

    let totalPV = 0;
    let totalEV = 0;
    let totalAC = 0;
    let totalBAC = 0;

    for (const task of tasks) {
      // BAC（完成時総予算）
      totalBAC += task.budgetedCost;

      // PV（計画値）: 今日の時点で完了しているべき作業の予算価値
      const taskStart = task.plannedStartDate.getTime();
      const taskEnd = task.plannedEndDate.getTime();
      const today = statusDate.getTime();

      if (today >= taskEnd) {
        // タスクは完了しているべき
        totalPV += task.budgetedCost;
      } else if (today >= taskStart) {
        // タスクは進行中
        const elapsed = today - taskStart;
        const total = taskEnd - taskStart;
        const pvRatio = elapsed / total;
        totalPV += task.budgetedCost * pvRatio;
      }

      // EV（獲得価値）: 実際に完了した作業の予算価値
      totalEV += task.budgetedCost * (task.physicalPercentComplete / 100);

      // AC（実績コスト）
      totalAC += task.actualCost;
    }

    // 差異計算
    const cv = totalEV - totalAC;  // コスト差異
    const sv = totalEV - totalPV;  // スケジュール差異

    // パフォーマンス指標
    const cpi = totalAC > 0 ? totalEV / totalAC : 0;  // コスト効率指標
    const spi = totalPV > 0 ? totalEV / totalPV : 0;  // スケジュール効率指標

    // 予測値計算
    const etc = cpi > 0 ? (totalBAC - totalEV) / cpi : totalBAC - totalEV;  // 完成までの見積もり
    const eac = totalAC + etc;  // 完成時総コスト見積もり
    const vac = totalBAC - eac;  // 完成時コスト差異
    const tcpi = (totalBAC - totalEV) > 0 ? (totalBAC - totalEV) / (totalBAC - totalAC) : 0;  // 残作業効率指標

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
   * タスク別EVM情報取得
   */
  public async getTaskEVMData(taskId: string, baselineId?: string): Promise<TaskEVMData | null> {
    if (!this.db) {
      throw new Error('データベースが初期化されていません');
    }

    const task = await this.getTask(taskId);
    if (!task) {
      return null;
    }

    // ベースライン情報取得
    let baselineTask: BaselineTask | null = null;
    if (baselineId) {
      const stmt = this.db.prepare('SELECT * FROM baseline_tasks WHERE baseline_id = ? AND task_id = ?');
      const row = stmt.get(baselineId, taskId);
      if (row) {
        baselineTask = {
          id: row.id,
          baselineId: row.baseline_id,
          taskId: row.task_id,
          startDate: new Date(row.start_date),
          endDate: new Date(row.end_date),
          duration: row.duration,
          budgetedCost: row.budgeted_cost,
        };
      }
    }

    // EVM計算
    const pv = task.budgetedCost;  // 簡易計算（本来は日付ベース）
    const ev = task.budgetedCost * (task.physicalPercentComplete / 100);
    const ac = task.actualCost;

    // ステータス判定
    let status: 'ahead' | 'on_track' | 'behind' | 'critical' = 'on_track';
    const spi = pv > 0 ? ev / pv : 0;
    const cpi = ac > 0 ? ev / ac : 0;

    if (spi < 0.9 || cpi < 0.9) {
      status = 'critical';
    } else if (spi < 0.95 || cpi < 0.95) {
      status = 'behind';
    } else if (spi > 1.05 && cpi > 1.05) {
      status = 'ahead';
    }

    return {
      taskId: task.id,
      taskName: task.name,
      baselineStartDate: baselineTask?.startDate || task.plannedStartDate,
      baselineEndDate: baselineTask?.endDate || task.plannedEndDate,
      baselineDuration: baselineTask?.duration || task.duration,
      baselineCost: baselineTask?.budgetedCost || task.budgetedCost,
      plannedStartDate: task.plannedStartDate,
      plannedEndDate: task.plannedEndDate,
      plannedDuration: task.duration,
      budgetedCost: task.budgetedCost,
      actualStartDate: task.actualStartDate,
      actualEndDate: task.actualEndDate,
      percentComplete: task.percentComplete,
      physicalPercentComplete: task.physicalPercentComplete,
      actualCost: task.actualCost,
      remainingDuration: task.remainingDuration,
      pv,
      ev,
      ac,
      status,
      isComplete: task.percentComplete === 100,
    };
  }
}