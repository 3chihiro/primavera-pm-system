import { configureStore } from '@reduxjs/toolkit';
import appSlice from './slices/appSlice';
import projectSlice from './slices/projectSlice';
import taskSlice from './slices/taskSlice';
import resourceSlice from './slices/resourceSlice';
import progressSlice from './slices/progressSlice';

// Redux Storeの設定
export const store = configureStore({
  reducer: {
    app: appSlice,
    project: projectSlice,
    task: taskSlice,
    resource: resourceSlice,
    progress: progressSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Dateオブジェクトなどの非シリアライズ可能な値を許可
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'app/setAppReady', 'project/fetchProjects/fulfilled'],
        ignoredPaths: [
          // Date関連のフィールドを全て無視（正規表現パターン）
          /.*\.startDate$/,
          /.*\.endDate$/,
          /.*\.createdAt$/,
          /.*\.updatedAt$/,
          /.*\.plannedStartDate$/,
          /.*\.plannedEndDate$/,
          /.*\.actualStartDate$/,
          /.*\.actualEndDate$/,
          // 配列内のDateフィールドも無視
          /.*\.\d+\.startDate$/,
          /.*\.\d+\.endDate$/,
          /.*\.\d+\.createdAt$/,
          /.*\.\d+\.updatedAt$/,
        ],
        ignoredActionsPaths: [
          // アクションペイロード内のDate関連フィールドを無視
          'payload.startDate',
          'payload.endDate',
          'payload.createdAt',
          'payload.updatedAt',
          'payload.plannedStartDate',
          'payload.plannedEndDate',
          'payload.actualStartDate',
          'payload.actualEndDate',
          /payload\.\d+\..*Date$/,
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// TypeScript型定義
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Reduxフックの型安全版
export { useDispatch, useSelector } from 'react-redux';