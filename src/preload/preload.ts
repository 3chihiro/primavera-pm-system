import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// セキュリティのため、レンダラープロセスに公開するAPIを制限
interface ElectronAPI {
  // データベース操作
  database: {
    initialize: () => Promise<{success: boolean; error?: string}>;
    createProject: (projectData: any) => Promise<{success: boolean; data?: any; error?: string}>;
    getProjects: () => Promise<{success: boolean; data?: any[]; error?: string}>;
    getProject: (projectId: string) => Promise<{success: boolean; data?: any; error?: string}>;
    updateProject: (projectId: string, updates: any) => Promise<{success: boolean; data?: any; error?: string}>;
    deleteProject: (projectId: string) => Promise<{success: boolean; error?: string}>;
  };

  // ファイルダイアログ
  dialog: {
    showSaveDialog: (options: any) => Promise<any>;
    showOpenDialog: (options: any) => Promise<any>;
  };

  // メニューイベントリスナー
  menu: {
    onNewProject: (callback: () => void) => void;
    onSaveProject: (callback: () => void) => void;
    onOpenProject: (callback: (filePath: string) => void) => void;
    removeAllListeners: () => void;
  };

  // システム情報
  system: {
    platform: string;
    version: string;
  };
}

// レンダラープロセスに公開するAPI
const electronAPI: ElectronAPI = {
  database: {
    initialize: () => ipcRenderer.invoke('database:initialize'),
    createProject: (projectData: any) => ipcRenderer.invoke('database:createProject', projectData),
    getProjects: () => ipcRenderer.invoke('database:getProjects'),
    getProject: (projectId: string) => ipcRenderer.invoke('database:getProject', projectId),
    updateProject: (projectId: string, updates: any) => ipcRenderer.invoke('database:updateProject', projectId, updates),
    deleteProject: (projectId: string) => ipcRenderer.invoke('database:deleteProject', projectId),
  },

  dialog: {
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:showSaveDialog', options),
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:showOpenDialog', options),
  },

  menu: {
    onNewProject: (callback: () => void) => {
      ipcRenderer.on('menu-new-project', callback);
    },
    onSaveProject: (callback: () => void) => {
      ipcRenderer.on('menu-save-project', callback);
    },
    onOpenProject: (callback: (filePath: string) => void) => {
      ipcRenderer.on('menu-open-project', (event: IpcRendererEvent, filePath: string) => {
        callback(filePath);
      });
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('menu-new-project');
      ipcRenderer.removeAllListeners('menu-save-project');
      ipcRenderer.removeAllListeners('menu-open-project');
    },
  },

  system: {
    platform: process.platform,
    version: process.versions.electron || 'unknown',
  },
};

// レンダラープロセスのwindowオブジェクトにAPIを公開
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript型定義をグローバルに追加
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}