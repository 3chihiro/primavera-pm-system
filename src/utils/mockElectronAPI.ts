/**
 * ブラウザ環境用のモックElectron API
 * 開発・テスト用にローカルストレージを使用してデータを保存
 */

import { Project } from '../types';

// LocalStorageのキー
const STORAGE_KEYS = {
  PROJECTS: 'primavera_mock_projects',
  INITIALIZED: 'primavera_mock_initialized',
};

// ユーティリティ関数：IDを生成
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ユーティリティ関数：プロジェクト一覧を取得
const getProjectsFromStorage = (): Project[] => {
  try {
    const projectsJson = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!projectsJson) return [];

    const projects = JSON.parse(projectsJson);
    // Date文字列をDateオブジェクトに変換
    return projects.map((p: any) => ({
      ...p,
      startDate: new Date(p.startDate),
      endDate: new Date(p.endDate),
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  } catch (error) {
    console.error('Failed to load projects from storage:', error);
    return [];
  }
};

// ユーティリティ関数：プロジェクト一覧を保存
const saveProjectsToStorage = (projects: Project[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to save projects to storage:', error);
  }
};

// モックElectron API
export const mockElectronAPI = {
  database: {
    // データベース初期化
    initialize: async () => {
      console.log('[Mock] データベース初期化を開始...');

      // 初期化済みかチェック
      const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (!initialized) {
        // 初回は空のプロジェクトリストを作成
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
        console.log('[Mock] データベース初期化完了（初回）');
      } else {
        console.log('[Mock] データベースは既に初期化済み');
      }

      return { success: true };
    },

    // プロジェクト作成
    createProject: async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      console.log('[Mock] プロジェクト作成:', projectData);

      const id = generateId();
      const now = new Date();

      const newProject: Project = {
        ...projectData,
        id,
        createdAt: now,
        updatedAt: now,
      };

      const projects = getProjectsFromStorage();
      projects.push(newProject);
      saveProjectsToStorage(projects);

      console.log('[Mock] プロジェクト作成成功:', newProject);
      return { success: true, data: newProject };
    },

    // プロジェクト一覧取得
    getProjects: async () => {
      console.log('[Mock] プロジェクト一覧取得');
      const projects = getProjectsFromStorage();
      console.log('[Mock] プロジェクト件数:', projects.length);
      return { success: true, data: projects };
    },

    // 特定プロジェクト取得
    getProject: async (projectId: string) => {
      console.log('[Mock] プロジェクト取得:', projectId);
      const projects = getProjectsFromStorage();
      const project = projects.find(p => p.id === projectId);

      if (!project) {
        return { success: false, error: `プロジェクト (ID: ${projectId}) が見つかりません` };
      }

      return { success: true, data: project };
    },

    // プロジェクト更新
    updateProject: async (projectId: string, updates: Partial<Project>) => {
      console.log('[Mock] プロジェクト更新:', projectId, updates);
      const projects = getProjectsFromStorage();
      const index = projects.findIndex(p => p.id === projectId);

      if (index === -1) {
        return { success: false, error: `プロジェクト (ID: ${projectId}) が見つかりません` };
      }

      projects[index] = {
        ...projects[index],
        ...updates,
        updatedAt: new Date(),
      };

      saveProjectsToStorage(projects);
      console.log('[Mock] プロジェクト更新成功:', projects[index]);
      return { success: true, data: projects[index] };
    },

    // プロジェクト削除
    deleteProject: async (projectId: string) => {
      console.log('[Mock] プロジェクト削除:', projectId);
      const projects = getProjectsFromStorage();
      const filteredProjects = projects.filter(p => p.id !== projectId);

      if (projects.length === filteredProjects.length) {
        return { success: false, error: `プロジェクト (ID: ${projectId}) が見つかりません` };
      }

      saveProjectsToStorage(filteredProjects);
      console.log('[Mock] プロジェクト削除成功');
      return { success: true };
    },
  },

  dialog: {
    // 保存ダイアログ（モック）
    showSaveDialog: async (options: any) => {
      console.log('[Mock] 保存ダイアログ:', options);
      // ブラウザではファイルダイアログを表示できないため、キャンセル扱い
      return { canceled: true, filePath: undefined };
    },

    // 開くダイアログ（モック）
    showOpenDialog: async (options: any) => {
      console.log('[Mock] 開くダイアログ:', options);
      // ブラウザではファイルダイアログを表示できないため、キャンセル扱い
      return { canceled: true, filePaths: [] };
    },
  },

  menu: {
    // メニューイベントリスナー（モック）
    onNewProject: (callback: () => void) => {
      console.log('[Mock] メニュー: 新規プロジェクトリスナー登録');
      // ブラウザ環境ではメニューイベントは発生しないため、何もしない
    },

    onSaveProject: (callback: () => void) => {
      console.log('[Mock] メニュー: 保存リスナー登録');
    },

    onOpenProject: (callback: (filePath: string) => void) => {
      console.log('[Mock] メニュー: 開くリスナー登録');
    },

    removeAllListeners: () => {
      console.log('[Mock] メニュー: 全リスナー削除');
    },
  },
};

// グローバルにモックAPIを設定（開発環境用）
export const setupMockElectronAPI = (): void => {
  if (typeof window !== 'undefined' && !(window as any).electronAPI) {
    console.log('[Mock] モックElectron APIを設定');
    (window as any).electronAPI = mockElectronAPI;
  }
};