import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import * as path from 'path';
import { isDev } from '../utils/environment';
import { DatabaseService } from '../database/DatabaseService';

// セキュリティ向上のためのCSP設定
const getCSPPolicy = () => {
  if (isDev()) {
    // 開発環境ではCSPを緩和（webpack-dev-serverとHMRのため）
    return `
      default-src 'self' 'unsafe-eval';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* 127.0.0.1:*;
      style-src 'self' 'unsafe-inline' localhost:* 127.0.0.1:*;
      img-src 'self' data: file: localhost:* 127.0.0.1:*;
      font-src 'self' data: localhost:* 127.0.0.1:*;
      connect-src 'self' ws: wss: localhost:* 127.0.0.1:*;
    `.replace(/\s+/g, ' ').trim();
  } else {
    // 本番環境では厳密なCSP
    return `
      default-src 'self';
      script-src 'self';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: file:;
      font-src 'self' data:;
      connect-src 'self';
    `.replace(/\s+/g, ' ').trim();
  }
};

class ElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private databaseService: DatabaseService | null = null;

  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    // アプリが準備完了時の処理
    app.whenReady().then(() => {
      console.log('Electronアプリケーションが準備完了');
      this.databaseService = new DatabaseService();
      this.createWindow();
      this.setupMenu();
      this.setupIpcHandlers();

      // macOSでアプリがアクティブになった際の処理
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    // 全ウィンドウが閉じられた際の処理
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createWindow(): void {
    // メインウィンドウの作成
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 1000,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: path.join(__dirname, 'preload.js'),
      },
      icon: path.join(__dirname, '../../assets/icon.png'),
      titleBarStyle: 'default',
      show: false, // 初期化完了まで非表示
    });

    // セキュリティ強化のためのCSP設定
    this.mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [getCSPPolicy()]
        }
      });
    });

    // ページ読み込み
    if (isDev()) {
      this.mainWindow.loadURL('http://localhost:3000');
      // 開発環境でのみDevToolsを開く
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }

    // ウィンドウの準備が完了したら表示
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      this.mainWindow?.focus();
    });

    // ウィンドウが閉じられた時の処理
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'ファイル',
        submenu: [
          {
            label: '新規プロジェクト',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-new-project');
            }
          },
          {
            label: 'プロジェクトを開く',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.openProject();
            }
          },
          {
            label: '保存',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.mainWindow?.webContents.send('menu-save-project');
            }
          },
          { type: 'separator' },
          {
            label: '終了',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: '編集',
        submenu: [
          { role: 'undo', label: '元に戻す' },
          { role: 'redo', label: 'やり直し' },
          { type: 'separator' },
          { role: 'cut', label: '切り取り' },
          { role: 'copy', label: 'コピー' },
          { role: 'paste', label: '貼り付け' }
        ]
      },
      {
        label: '表示',
        submenu: [
          { role: 'reload', label: '再読み込み' },
          { role: 'forceReload', label: '強制再読み込み' },
          { role: 'toggleDevTools', label: '開発者ツール' },
          { type: 'separator' },
          { role: 'resetZoom', label: '実際のサイズ' },
          { role: 'zoomIn', label: '拡大' },
          { role: 'zoomOut', label: '縮小' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: 'フルスクリーン切り替え' }
        ]
      },
      {
        label: 'ヘルプ',
        submenu: [
          {
            label: 'バージョン情報',
            click: () => {
              dialog.showMessageBox(this.mainWindow!, {
                type: 'info',
                title: 'バージョン情報',
                message: 'Primavera PM System',
                detail: `Version: 1.0.0\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}`
              });
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private async openProject(): Promise<void> {
    const result = await dialog.showOpenDialog(this.mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'Primavera Project Files', extensions: ['ppm'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      this.mainWindow?.webContents.send('menu-open-project', filePath);
    }
  }

  private setupIpcHandlers(): void {
    // データベース操作のIPCハンドラー
    ipcMain.handle('database:initialize', async () => {
      try {
        if (!this.databaseService) {
          throw new Error('Database service not initialized');
        }
        console.log('データベース初期化を開始...');
        await this.databaseService.initialize();
        console.log('データベース初期化完了');
        return { success: true };
      } catch (error) {
        console.error('Database initialization failed:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    ipcMain.handle('database:createProject', async (event, projectData) => {
      try {
        if (!this.databaseService) {
          throw new Error('Database service not initialized');
        }
        const project = await this.databaseService.createProject(projectData);
        return { success: true, data: project };
      } catch (error) {
        console.error('Project creation failed:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('database:getProjects', async () => {
      try {
        if (!this.databaseService) {
          throw new Error('Database service not initialized');
        }
        const projects = await this.databaseService.getProjects();
        return { success: true, data: projects };
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('database:getProject', async (event, projectId) => {
      try {
        if (!this.databaseService) {
          throw new Error('Database service not initialized');
        }
        const project = await this.databaseService.getProject(projectId);
        return { success: true, data: project };
      } catch (error) {
        console.error('Failed to fetch project:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('database:updateProject', async (event, projectId, updates) => {
      try {
        if (!this.databaseService) {
          throw new Error('Database service not initialized');
        }
        const project = await this.databaseService.updateProject(projectId, updates);
        return { success: true, data: project };
      } catch (error) {
        console.error('Failed to update project:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('database:deleteProject', async (event, projectId) => {
      try {
        if (!this.databaseService) {
          throw new Error('Database service not initialized');
        }
        await this.databaseService.deleteProject(projectId);
        return { success: true };
      } catch (error) {
        console.error('Failed to delete project:', error);
        return { success: false, error: error.message };
      }
    });

    // リソース関連のIPCハンドラー
    ipcMain.handle('database:getProjectResources', async (event, projectId) => {
      try {
        if (!this.databaseService) {
          throw new Error('Database service not initialized');
        }
        const resources = await this.databaseService.getProjectResources(projectId);
        return { success: true, data: resources };
      } catch (error) {
        console.error('Failed to fetch resources:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('database:createResource', async (event, projectId, resourceData) => {
      try {
        if (!this.databaseService) {
          throw new Error('Database service not initialized');
        }
        const resource = await this.databaseService.createResource(projectId, resourceData);
        return { success: true, data: resource };
      } catch (error) {
        console.error('Failed to create resource:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('database:getResource', async (event, resourceId) => {
      try {
        if (!this.databaseService) {
          throw new Error('Database service not initialized');
        }
        const resource = await this.databaseService.getResource(resourceId);
        return { success: true, data: resource };
      } catch (error) {
        console.error('Failed to fetch resource:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('database:updateResource', async (event, resourceId, updates) => {
      try {
        if (!this.databaseService) {
          throw new Error('Database service not initialized');
        }
        const resource = await this.databaseService.updateResource(resourceId, updates);
        return { success: true, data: resource };
      } catch (error) {
        console.error('Failed to update resource:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('database:deleteResource', async (event, resourceId) => {
      try {
        if (!this.databaseService) {
          throw new Error('Database service not initialized');
        }
        await this.databaseService.deleteResource(resourceId);
        return { success: true };
      } catch (error) {
        console.error('Failed to delete resource:', error);
        return { success: false, error: error.message };
      }
    });

    // ファイルダイアログ表示
    ipcMain.handle('dialog:showSaveDialog', async (event, options) => {
      const result = await dialog.showSaveDialog(this.mainWindow!, options);
      return result;
    });

    ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
      const result = await dialog.showOpenDialog(this.mainWindow!, options);
      return result;
    });
  }
}

// アプリケーションのインスタンス作成
new ElectronApp();