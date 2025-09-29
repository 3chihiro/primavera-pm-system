-- Primavera PM System Database Schema
-- SQLite データベーススキーマ定義

-- プロジェクトテーブル
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    manager TEXT,
    budget REAL DEFAULT 0,
    actual_cost REAL DEFAULT 0,
    currency TEXT DEFAULT 'JPY',
    
    -- 進捗関連 (JSON形式で保存)
    progress_data TEXT DEFAULT '{}',
    
    -- ベースライン情報 (JSON形式で保存)
    baseline_data TEXT,
    
    -- プロジェクト設定 (JSON形式で保存)
    settings_data TEXT DEFAULT '{}',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- タスク（アクティビティ）テーブル
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    parent_id TEXT,
    wbs_code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('summary', 'task', 'milestone')),
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    priority TEXT NOT NULL CHECK (priority IN ('lowest', 'low', 'normal', 'high', 'highest')),
    
    -- スケジュール関連
    planned_start_date DATETIME NOT NULL,
    planned_end_date DATETIME NOT NULL,
    actual_start_date DATETIME,
    actual_end_date DATETIME,
    duration INTEGER NOT NULL DEFAULT 0,
    remaining_duration INTEGER NOT NULL DEFAULT 0,
    
    -- 進捗関連
    percent_complete INTEGER DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
    physical_percent_complete INTEGER DEFAULT 0 CHECK (physical_percent_complete >= 0 AND physical_percent_complete <= 100),
    
    -- コスト関連
    budgeted_cost REAL DEFAULT 0,
    actual_cost REAL DEFAULT 0,
    remaining_cost REAL DEFAULT 0,
    
    -- CPM計算結果 (JSON形式で保存)
    cpm_data TEXT DEFAULT '{}',
    
    -- 制約条件 (JSON形式で保存)
    constraints_data TEXT DEFAULT '[]',
    
    -- その他
    sort_order INTEGER DEFAULT 0,
    notes TEXT,
    tags TEXT DEFAULT '[]', -- JSON配列形式
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- タスク依存関係テーブル
CREATE TABLE IF NOT EXISTS task_dependencies (
    id TEXT PRIMARY KEY,
    predecessor_id TEXT NOT NULL,
    successor_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('FS', 'SS', 'FF', 'SF')),
    lag INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (predecessor_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (successor_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(predecessor_id, successor_id)
);

-- リソーステーブル
CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('work', 'material', 'cost', 'equipment')),
    category TEXT,
    description TEXT,
    email TEXT,
    phone TEXT,
    department TEXT,
    
    -- コスト関連
    standard_rate REAL DEFAULT 0,
    overtime_rate REAL DEFAULT 0,
    cost_per_use REAL DEFAULT 0,
    currency TEXT DEFAULT 'JPY',
    
    -- 稼働情報
    max_units INTEGER DEFAULT 100,
    
    -- スキル情報 (JSON形式で保存)
    skills_data TEXT DEFAULT '[]',
    
    -- 稼働可能期間 (JSON形式で保存)
    availability_data TEXT DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, code)
);

-- タスクリソース割り当てテーブル
CREATE TABLE IF NOT EXISTS task_resource_assignments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    allocation INTEGER NOT NULL DEFAULT 100 CHECK (allocation >= 0 AND allocation <= 100),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    planned_work REAL DEFAULT 0,
    actual_work REAL DEFAULT 0,
    remaining_work REAL DEFAULT 0,
    cost REAL DEFAULT 0,
    actual_cost REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    UNIQUE(task_id, resource_id)
);

-- ベースライン情報テーブル
CREATE TABLE IF NOT EXISTS baselines (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ベースラインタスクテーブル
CREATE TABLE IF NOT EXISTS baseline_tasks (
    id TEXT PRIMARY KEY,
    baseline_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    duration INTEGER NOT NULL,
    budgeted_cost REAL DEFAULT 0,
    
    FOREIGN KEY (baseline_id) REFERENCES baselines(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(baseline_id, task_id)
);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_wbs_code ON tasks(wbs_code);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor ON task_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor ON task_dependencies(successor_id);
CREATE INDEX IF NOT EXISTS idx_resources_project_id ON resources(project_id);
CREATE INDEX IF NOT EXISTS idx_resources_code ON resources(code);
CREATE INDEX IF NOT EXISTS idx_task_resource_assignments_task ON task_resource_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_resource_assignments_resource ON task_resource_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_baseline_tasks_baseline ON baseline_tasks(baseline_id);
CREATE INDEX IF NOT EXISTS idx_baseline_tasks_task ON baseline_tasks(task_id);

-- トリガー（更新日時の自動更新）
CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
    AFTER UPDATE ON projects
    BEGIN
        UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
    AFTER UPDATE ON tasks
    BEGIN
        UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_resources_timestamp 
    AFTER UPDATE ON resources
    BEGIN
        UPDATE resources SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_task_resource_assignments_timestamp 
    AFTER UPDATE ON task_resource_assignments
    BEGIN
        UPDATE task_resource_assignments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;