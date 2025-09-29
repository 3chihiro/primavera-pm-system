import { configureStore } from '@reduxjs/toolkit';
import appSlice from './slices/appSlice';
import projectSlice from './slices/projectSlice';
import taskSlice from './slices/taskSlice';
import resourceSlice from './slices/resourceSlice';

// Redux Storeの設定
export const store = configureStore({
  reducer: {
    app: appSlice,
    project: projectSlice,
    task: taskSlice,
    resource: resourceSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Dateオブジェクトなどの非シリアライズ可能な値を許可
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'app/setAppReady', 'project/fetchProjects/fulfilled'],
        ignoredPaths: (path: string) => {
          // Date関連のフィールドを全て無視
          const dateFields = [
            'startDate', 'endDate', 'createdAt', 'updatedAt',
            'plannedStartDate', 'plannedEndDate', 'actualStartDate', 'actualEndDate'
          ];

          return dateFields.some(field => path.includes(field));
        },
        ignoredActionsPaths: (path: string) => {
          // アクションのペイロード内のDate関連フィールドを無視
          const dateFields = [
            'startDate', 'endDate', 'createdAt', 'updatedAt',
            'plannedStartDate', 'plannedEndDate', 'actualStartDate', 'actualEndDate'
          ];

          return dateFields.some(field => path.includes(field));
        },
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// TypeScript型定義
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Reduxフックの型安全版
export { useDispatch, useSelector } from 'react-redux';