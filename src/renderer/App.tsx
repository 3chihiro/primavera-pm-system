import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Box, Alert, Snackbar } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Layout from '../components/layout/Layout';
import Dashboard from '../components/dashboard/Dashboard';
import ProjectList from '../components/project/ProjectList';
import ProjectDetail from '../components/project/ProjectDetail';
import WBSView from '../components/wbs/WBSView';
import GanttView from '../components/gantt/GanttView';
import ResourceView from '../components/resource/ResourceView';
import ProgressView from '../components/progress/ProgressView';
import ReportsView from '../components/reports/ReportsView';
import { setAppReady, setError, hideNotification } from '../store/slices/appSlice';
import { AppDispatch, RootState } from '../store/store';

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [error, setErrorState] = useState<string | null>(null);

  const notification = useSelector((state: RootState) => state.app.notification);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('レンダラープロセス初期化開始');
        // Electronメニューイベントリスナーの設定
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          console.log('ElectronAPIが利用可能');
          (window as any).electronAPI.menu.onNewProject(() => {
            navigate('/projects/new');
          });

          (window as any).electronAPI.menu.onSaveProject(() => {
            // 現在のプロジェクトを保存
            // TODO: 現在開いているプロジェクトの保存ロジックを実装
          });

          (window as any).electronAPI.menu.onOpenProject((filePath: string) => {
            // ファイルからプロジェクトを開く
            // TODO: ファイル読み込みロジックを実装
            console.log('プロジェクトファイルを開く:', filePath);
          });
        } else {
          console.log('ブラウザ環境で実行中 - メニューイベントリスナーを無効化');
        }

        // データベースの初期化
        if (window.electronAPI) {
          console.log('データベース初期化を開始...');
          const dbResult = await window.electronAPI.database.initialize();
          console.log('データベース初期化結果:', dbResult);
          if (!dbResult.success) {
            throw new Error(dbResult.error || 'データベースの初期化に失敗しました');
          }
          console.log('データベース初期化成功');
        }

        // アプリケーション準備完了
        dispatch(setAppReady(true));
      } catch (error) {
        console.error('アプリケーション初期化エラー:', error);
        dispatch(setError(error instanceof Error ? error.message : 'アプリケーションの初期化に失敗しました'));
        setErrorState(error instanceof Error ? error.message : '初期化エラーが発生しました');
      }
    };

    initializeApp();

    // クリーンアップ関数
    return () => {
      if (window.electronAPI) {
        window.electronAPI.menu.removeAllListeners();
      }
    };
  }, [dispatch, navigate]);

  const handleErrorClose = () => {
    setErrorState(null);
  };

  const handleNotificationClose = () => {
    dispatch(hideNotification());
  };

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Layout>
          <Routes>
            {/* ダッシュボード（ホーム画面） */}
            <Route path="/" element={<Dashboard />} />
            
            {/* プロジェクト管理 */}
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/new" element={<ProjectDetail />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            
            {/* WBS（作業分解構造）管理 */}
            <Route path="/projects/:id/wbs" element={<WBSView />} />
            
            {/* ガントチャート */}
            <Route path="/projects/:id/gantt" element={<GanttView />} />
            
            {/* リソース管理 */}
            <Route path="/projects/:id/resources" element={<ResourceView />} />

            {/* 進捗管理・EVM */}
            <Route path="/projects/:id/progress" element={<ProgressView />} />

            {/* レポート */}
            <Route path="/projects/:id/reports" element={<ReportsView />} />
          </Routes>
        </Layout>

        {/* エラー通知 */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleErrorClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        {/* アプリケーション通知 */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleNotificationClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleNotificationClose} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
};

export default App;