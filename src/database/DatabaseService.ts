import * as path from "path";
import * as fs from "fs";
import { app } from "electron";
import { Project, CreateProjectData, UpdateProjectData } from "../types/project";
import { Task } from "../types/task";
import { Resource } from "../types/resource";
import { Baseline, ProgressUpdate, TaskEVMData, EVMMetrics } from "../types/progress";

// Minimal, safe stub for the native DB-backed service.
// SafeDatabaseService decides at runtime whether to use this class.
export class DatabaseService {
  private db: any = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath("userData");
    this.dbPath = path.join(userDataPath, "primavera_pm.db");
  }

  public async initialize(): Promise<void> {
    // Lazy-load better-sqlite3; only attempted when available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BetterSqlite = require("better-sqlite3");
    this.db = new BetterSqlite(this.dbPath);
    const schemaPath = path.join(__dirname, "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const schemaSQL = fs.readFileSync(schemaPath, "utf-8");
      this.db.exec(schemaSQL);
    }
  }

  public close(): void {
    if (this.db) {
      try { this.db.close(); } catch {}
      this.db = null;
    }
  }

  // ---- Project APIs ----
  public async createProject(projectData: CreateProjectData): Promise<Project> {
    throw new Error("Not implemented in stub");
  }
  public async getProjects(): Promise<Project[]> {
    throw new Error("Not implemented in stub");
  }
  public async getProject(projectId: string): Promise<Project> {
    throw new Error("Not implemented in stub");
  }
  public async updateProject(projectId: string, updates: UpdateProjectData): Promise<Project> {
    throw new Error("Not implemented in stub");
  }
  public async deleteProject(projectId: string): Promise<void> {
    throw new Error("Not implemented in stub");
  }

  // ---- Task APIs ----
  public async getProjectTasks(projectId: string): Promise<Task[]> {
    throw new Error("Not implemented in stub");
  }
  public async getTask(taskId: string): Promise<Task | null> {
    throw new Error("Not implemented in stub");
  }

  // ---- Resource APIs ----
  public async getProjectResources(projectId: string): Promise<Resource[]> {
    throw new Error("Not implemented in stub");
  }
  public async createResource(projectId: string, resourceData: any): Promise<Resource> {
    throw new Error("Not implemented in stub");
  }
  public async getResource(resourceId: string): Promise<Resource | null> {
    throw new Error("Not implemented in stub");
  }
  public async updateResource(resourceId: string, updates: any): Promise<Resource> {
    throw new Error("Not implemented in stub");
  }
  public async deleteResource(resourceId: string): Promise<void> {
    throw new Error("Not implemented in stub");
  }
  public async createTaskResourceAssignment(taskId: string, resourceId: string, allocation: number, startDate: string, endDate: string, plannedWork: number): Promise<void> {
    throw new Error("Not implemented in stub");
  }
  public async updateTaskResourceAssignment(taskId: string, resourceId: string, allocation: number, plannedWork: number): Promise<void> {
    throw new Error("Not implemented in stub");
  }
  public async deleteTaskResourceAssignment(taskId: string, resourceId: string): Promise<void> {
    throw new Error("Not implemented in stub");
  }
  public async getTaskResourceAssignments(taskId: string): Promise<any[]> {
    throw new Error("Not implemented in stub");
  }

  // ---- Baseline / Progress / EVM ----
  public async createBaseline(projectId: string, name: string, description?: string, createdBy?: string): Promise<Baseline> {
    throw new Error("Not implemented in stub");
  }
  public async getBaseline(baselineId: string): Promise<Baseline | null> {
    throw new Error("Not implemented in stub");
  }
  public async getProjectBaselines(projectId: string): Promise<Baseline[]> {
    throw new Error("Not implemented in stub");
  }
  public async deleteBaseline(baselineId: string): Promise<void> {
    throw new Error("Not implemented in stub");
  }
  public async updateTaskProgress(progressData: ProgressUpdate): Promise<Task> {
    throw new Error("Not implemented in stub");
  }
  public async calculateProjectEVM(projectId: string, statusDate?: Date): Promise<EVMMetrics> {
    throw new Error("Not implemented in stub");
  }
  public async getTaskEVMData(taskId: string, baselineId?: string): Promise<TaskEVMData | null> {
    throw new Error("Not implemented in stub");
  }
}
