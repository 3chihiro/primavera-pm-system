import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { Project, CreateProjectData, UpdateProjectData } from '../types/project';
import { Task } from '../types/task';
import { Resource } from '../types/resource';
import { Baseline, ProgressUpdate, TaskEVMData, EVMMetrics } from '../types/progress';

// Safe wrapper around the real DatabaseService with a JSON fallback.
// If better-sqlite3 is unavailable, we fall back to a simple JSON store
// so that the app can create/list projects without crashing.
export class DatabaseService {
  private delegate: any = null;
  private initialized = false;
  private useMock = false;
  private mockPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.mockPath = path.join(userDataPath, 'mock_db.json');
  }

  public async initialize(): Promise<void> {
    // For now, always use JSON mock DB until we have a full better-sqlite3 implementation
    console.warn('[DB] Using JSON mock DB');
    this.useMock = true;
    if (!fs.existsSync(this.mockPath)) {
      fs.writeFileSync(
        this.mockPath,
        JSON.stringify(
          {
            projects: [],
            tasks: [],
            resources: [],
            baselines: [],
            taskResourceAssignments: [],
          },
          null,
          2
        ),
        'utf-8'
      );
    }
    this.initialized = true;
  }

  public close(): void {
    if (this.delegate?.close) this.delegate.close();
  }

  // ===== Mock helpers =====
  private loadMock(): {
    projects: any[];
    tasks: any[];
    resources: any[];
    baselines: any[];
    taskResourceAssignments: any[];
  } {
    try {
      const raw = fs.readFileSync(this.mockPath, 'utf-8');
      const data = JSON.parse(raw || '{"projects":[],"tasks":[],"resources":[],"baselines":[],"taskResourceAssignments":[]}');
      return {
        projects: data.projects || [],
        tasks: data.tasks || [],
        resources: data.resources || [],
        baselines: data.baselines || [],
        taskResourceAssignments: data.taskResourceAssignments || [],
      };
    } catch {
      return { projects: [], tasks: [], resources: [], baselines: [], taskResourceAssignments: [] };
    }
  }
  private saveMock(db: {
    projects: any[];
    tasks: any[];
    resources: any[];
    baselines: any[];
    taskResourceAssignments: any[];
  }) {
    fs.writeFileSync(this.mockPath, JSON.stringify(db, null, 2), 'utf-8');
  }
  private genId() { return `${Date.now()}-${Math.random().toString(36).slice(2,10)}`; }

  // ===== Project APIs =====
  public async createProject(projectData: CreateProjectData): Promise<Project> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.createProject(projectData);

    const db = this.loadMock();
    const now = new Date();
    const p: Project = {
      id: this.genId(),
      name: projectData.name,
      description: projectData.description || '',
      startDate: new Date(projectData.startDate),
      endDate: new Date(projectData.endDate),
      status: projectData.status || 'planning',
      priority: projectData.priority || 'normal',
      manager: projectData.manager || 'owner',
      budget: projectData.budget || 0,
      actualCost: projectData.actualCost || 0,
      currency: projectData.currency || 'JPY',
      createdAt: now,
      updatedAt: now,
      settings: projectData.settings || ({
        workingDays: ['monday','tuesday','wednesday','thursday','friday'],
        workingHours: { start: '09:00', end: '18:00' },
        holidays: [],
        currency: 'JPY',
        currencyFormat: { symbol: '¥', position: 'before', decimalPlaces: 0 },
        dateFormat: 'yyyy/MM/dd', timeFormat: '24h', firstDayOfWeek: 'monday',
        autoSchedule: true, criticalPath: true, resourceLeveling: false,
        evmEnabled: true, baselineRequired: false,
      } as any),
      progress: {
        plannedValue: 0, earnedValue: 0, actualCost: 0,
        schedulePerformanceIndex: 1, costPerformanceIndex: 1,
        scheduleVariance: 0, costVariance: 0,
      },
      baseline: projectData.baseline || null,
    };
    db.projects.unshift(p);
    this.saveMock(db);
    return p;
  }

  public async getProjects(): Promise<Project[]> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.getProjects();
    const db = this.loadMock();
    return db.projects.map((p) => ({
      ...p,
      startDate: new Date(p.startDate),
      endDate: new Date(p.endDate),
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
      baseline: p.baseline ? { ...p.baseline, startDate: new Date(p.baseline.startDate), endDate: new Date(p.baseline.endDate), createdAt: new Date(p.baseline.createdAt) } : null,
    }));
  }

  public async getProject(projectId: string): Promise<Project | null> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.getProject(projectId);
    const db = this.loadMock();
    const p = db.projects.find((x) => x.id === projectId);
    return p ? {
      ...p,
      startDate: new Date(p.startDate),
      endDate: new Date(p.endDate),
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
      baseline: p.baseline ? { ...p.baseline, startDate: new Date(p.baseline.startDate), endDate: new Date(p.baseline.endDate), createdAt: new Date(p.baseline.createdAt) } : null,
    } : null;
  }

  public async updateProject(projectId: string, updates: UpdateProjectData): Promise<Project> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.updateProject(projectId, updates);
    const db = this.loadMock();
    const idx = db.projects.findIndex((x) => x.id === projectId);
    if (idx === -1) throw new Error('Project not found');
    const updated = { ...db.projects[idx], ...updates, updatedAt: new Date() };
    db.projects[idx] = updated;
    this.saveMock(db);
    const p = await this.getProject(projectId);
    if (!p) throw new Error('Project not found after update');
    return p;
  }

  public async deleteProject(projectId: string): Promise<void> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.deleteProject(projectId);
    const db = this.loadMock();
    db.projects = db.projects.filter((x) => x.id !== projectId);
    // 関連データも削除
    db.tasks = db.tasks.filter((t: any) => t.projectId !== projectId);
    db.resources = db.resources.filter((r: any) => r.projectId !== projectId);
    db.baselines = db.baselines.filter((b: any) => b.projectId !== projectId);
    this.saveMock(db);
  }

  // ===== Task APIs =====
  public async getProjectTasks(projectId: string): Promise<Task[]> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.getProjectTasks(projectId);
    const db = this.loadMock();
    return db.tasks.filter((t: any) => t.projectId === projectId);
  }

  public async getTask(taskId: string): Promise<Task | null> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.getTask(taskId);
    const db = this.loadMock();
    const task = db.tasks.find((t: any) => t.id === taskId);
    return task || null;
  }

  // ===== Resource APIs =====
  public async getProjectResources(projectId: string): Promise<Resource[]> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.getProjectResources(projectId);
    const db = this.loadMock();
    return db.resources.filter((r: any) => r.projectId === projectId);
  }

  public async createResource(projectId: string, resourceData: any): Promise<Resource> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.createResource(projectId, resourceData);
    const db = this.loadMock();
    const resource: Resource = {
      id: this.genId(),
      projectId,
      name: resourceData.name,
      type: resourceData.type || 'labor',
      email: resourceData.email,
      department: resourceData.department,
      role: resourceData.role,
      costRate: resourceData.costRate || 0,
      maxUnits: resourceData.maxUnits || 1,
      calendar: resourceData.calendar,
      availability: resourceData.availability || [],
      skills: resourceData.skills || [],
      notes: resourceData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.resources.push(resource);
    this.saveMock(db);
    return resource;
  }

  public async getResource(resourceId: string): Promise<Resource | null> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.getResource(resourceId);
    const db = this.loadMock();
    const resource = db.resources.find((r: any) => r.id === resourceId);
    return resource || null;
  }

  public async updateResource(resourceId: string, updates: any): Promise<Resource> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.updateResource(resourceId, updates);
    const db = this.loadMock();
    const idx = db.resources.findIndex((r: any) => r.id === resourceId);
    if (idx === -1) throw new Error('Resource not found');
    db.resources[idx] = { ...db.resources[idx], ...updates, updatedAt: new Date() };
    this.saveMock(db);
    return db.resources[idx];
  }

  public async deleteResource(resourceId: string): Promise<void> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.deleteResource(resourceId);
    const db = this.loadMock();
    db.resources = db.resources.filter((r: any) => r.id !== resourceId);
    db.taskResourceAssignments = db.taskResourceAssignments.filter((a: any) => a.resourceId !== resourceId);
    this.saveMock(db);
  }

  public async createTaskResourceAssignment(
    taskId: string,
    resourceId: string,
    allocation: number,
    startDate: Date,
    endDate: Date,
    plannedWork: number
  ): Promise<void> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock)
      return this.delegate.createTaskResourceAssignment(taskId, resourceId, allocation, startDate, endDate, plannedWork);
    const db = this.loadMock();
    const assignment = {
      taskId,
      resourceId,
      allocation,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      plannedWork,
      actualWork: 0,
      remainingWork: plannedWork,
    };
    db.taskResourceAssignments.push(assignment);
    this.saveMock(db);
  }

  public async updateTaskResourceAssignment(
    taskId: string,
    resourceId: string,
    allocation: number,
    plannedWork: number
  ): Promise<void> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock)
      return this.delegate.updateTaskResourceAssignment(taskId, resourceId, allocation, plannedWork);
    const db = this.loadMock();
    const idx = db.taskResourceAssignments.findIndex(
      (a: any) => a.taskId === taskId && a.resourceId === resourceId
    );
    if (idx === -1) throw new Error('Task resource assignment not found');
    db.taskResourceAssignments[idx] = {
      ...db.taskResourceAssignments[idx],
      allocation,
      plannedWork,
      remainingWork: plannedWork - (db.taskResourceAssignments[idx].actualWork || 0),
    };
    this.saveMock(db);
  }

  public async deleteTaskResourceAssignment(taskId: string, resourceId: string): Promise<void> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.deleteTaskResourceAssignment(taskId, resourceId);
    const db = this.loadMock();
    db.taskResourceAssignments = db.taskResourceAssignments.filter(
      (a: any) => !(a.taskId === taskId && a.resourceId === resourceId)
    );
    this.saveMock(db);
  }

  public async getTaskResourceAssignments(taskId: string): Promise<any[]> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.getTaskResourceAssignments(taskId);
    const db = this.loadMock();
    return db.taskResourceAssignments.filter((a: any) => a.taskId === taskId);
  }

  // ===== Baseline / Progress / EVM =====
  public async createBaseline(
    projectId: string,
    name: string,
    description?: string,
    createdBy?: string
  ): Promise<Baseline> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.createBaseline(projectId, name, description, createdBy);
    const db = this.loadMock();
    const baseline: Baseline = {
      id: this.genId(),
      projectId,
      name,
      description: description || '',
      createdBy: createdBy || 'user',
      createdAt: new Date(),
      tasks: [],
    };
    db.baselines.push(baseline);
    this.saveMock(db);
    return baseline;
  }

  public async getBaseline(baselineId: string): Promise<Baseline | null> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.getBaseline(baselineId);
    const db = this.loadMock();
    const baseline = db.baselines.find((b: any) => b.id === baselineId);
    return baseline ? { ...baseline, createdAt: new Date(baseline.createdAt) } : null;
  }

  public async getProjectBaselines(projectId: string): Promise<Baseline[]> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.getProjectBaselines(projectId);
    const db = this.loadMock();
    return db.baselines
      .filter((b: any) => b.projectId === projectId)
      .map((b: any) => ({ ...b, createdAt: new Date(b.createdAt) }));
  }

  public async deleteBaseline(baselineId: string): Promise<void> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.deleteBaseline(baselineId);
    const db = this.loadMock();
    db.baselines = db.baselines.filter((b: any) => b.id !== baselineId);
    this.saveMock(db);
  }

  public async updateTaskProgress(progressData: ProgressUpdate): Promise<Task> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.updateTaskProgress(progressData);
    const db = this.loadMock();
    const idx = db.tasks.findIndex((t: any) => t.id === progressData.taskId);
    if (idx === -1) throw new Error('Task not found');

    // Update task progress fields
    db.tasks[idx] = {
      ...db.tasks[idx],
      percentComplete: progressData.percentComplete,
      actualStartDate: progressData.actualStartDate,
      actualEndDate: progressData.actualEndDate,
      actualDuration: progressData.actualDuration,
      remainingDuration: progressData.remainingDuration,
      actualWork: progressData.actualWork,
      remainingWork: progressData.remainingWork,
      actualCost: progressData.actualCost,
      updatedAt: new Date(),
    };
    this.saveMock(db);
    return db.tasks[idx];
  }

  public async calculateProjectEVM(projectId: string, statusDate?: Date): Promise<EVMMetrics> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.calculateProjectEVM(projectId, statusDate);

    // Mock EVM calculation
    const db = this.loadMock();
    const projectTasks = db.tasks.filter((t: any) => t.projectId === projectId);

    let totalPV = 0;
    let totalEV = 0;
    let totalAC = 0;
    let totalBAC = 0;

    projectTasks.forEach((task: any) => {
      const plannedCost = task.plannedCost || 0;
      const percentComplete = task.percentComplete || 0;
      const actualCost = task.actualCost || 0;

      totalPV += plannedCost;
      totalEV += plannedCost * (percentComplete / 100);
      totalAC += actualCost;
      totalBAC += plannedCost;
    });

    const SV = totalEV - totalPV;
    const CV = totalEV - totalAC;
    const SPI = totalPV > 0 ? totalEV / totalPV : 1;
    const CPI = totalAC > 0 ? totalEV / totalAC : 1;
    const EAC = CPI > 0 ? totalBAC / CPI : totalBAC;
    const ETC = EAC - totalAC;
    const VAC = totalBAC - EAC;
    const TCPI = (totalBAC - totalEV) / (totalBAC - totalAC) || 1;

    return {
      projectId,
      statusDate: statusDate || new Date(),
      PV: totalPV,
      EV: totalEV,
      AC: totalAC,
      BAC: totalBAC,
      SV,
      CV,
      SPI,
      CPI,
      EAC,
      ETC,
      VAC,
      TCPI,
    };
  }

  public async getTaskEVMData(taskId: string, baselineId?: string): Promise<TaskEVMData | null> {
    if (!this.initialized) throw new Error('Database service not initialized');
    if (this.delegate && !this.useMock) return this.delegate.getTaskEVMData(taskId, baselineId);

    const db = this.loadMock();
    const task = db.tasks.find((t: any) => t.id === taskId);
    if (!task) return null;

    const plannedCost = task.plannedCost || 0;
    const percentComplete = task.percentComplete || 0;
    const actualCost = task.actualCost || 0;

    const PV = plannedCost;
    const EV = plannedCost * (percentComplete / 100);
    const AC = actualCost;
    const BAC = plannedCost;
    const SV = EV - PV;
    const CV = EV - AC;
    const SPI = PV > 0 ? EV / PV : 1;
    const CPI = AC > 0 ? EV / AC : 1;

    return {
      taskId,
      baselineId: baselineId || null,
      PV,
      EV,
      AC,
      BAC,
      SV,
      CV,
      SPI,
      CPI,
    };
  }
}

