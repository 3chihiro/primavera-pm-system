import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  currentView: 'dashboard' | 'projects' | 'wbs' | 'gantt' | 'resources' | 'reports';
  notification: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };
}

const initialState: AppState = {
  isReady: false,
  isLoading: false,
  error: null,
  theme: 'light',
  sidebarOpen: true,
  currentView: 'dashboard',
  notification: {
    open: false,
    message: '',
    severity: 'info',
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setAppReady: (state, action: PayloadAction<boolean>) => {
      state.isReady = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setCurrentView: (state, action: PayloadAction<AppState['currentView']>) => {
      state.currentView = action.payload;
    },
    showNotification: (state, action: PayloadAction<{
      message: string;
      severity: 'success' | 'error' | 'warning' | 'info';
    }>) => {
      state.notification = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity,
      };
    },
    hideNotification: (state) => {
      state.notification.open = false;
    },
  },
});

export const {
  setAppReady,
  setLoading,
  setError,
  clearError,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setCurrentView,
  showNotification,
  hideNotification,
} = appSlice.actions;

export default appSlice.reducer;