import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Baseline,
  ProgressUpdate,
  EVMMetrics,
  TaskEVMData,
  ProjectEVMSummary
} from '../../types/progress';

interface ProgressState {
  baselines: Baseline[];
  currentBaseline: Baseline | null;
  projectEVM: EVMMetrics | null;
  taskEVMData: Record<string, TaskEVMData>;
  recentUpdates: ProgressUpdate[];
  loading: boolean;
  error: string | null;
}

const initialState: ProgressState = {
  baselines: [],
  currentBaseline: null,
  projectEVM: null,
  taskEVMData: {},
  recentUpdates: [],
  loading: false,
  error: null,
};

// ===================== 非同期アクション =====================

/**
 * ベースライン作成
 */
export const createBaseline = createAsyncThunk(
  'progress/createBaseline',
  async (params: { projectId: string; name: string; description?: string; createdBy?: string }) => {
    const result = await window.electronAPI.invoke('database:createBaseline',
      params.projectId,
      params.name,
      params.description || '',
      params.createdBy || 'system'
    );
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data as Baseline;
  }
);

/**
 * プロジェクトのベースライン一覧取得
 */
export const fetchProjectBaselines = createAsyncThunk(
  'progress/fetchProjectBaselines',
  async (projectId: string) => {
    const result = await window.electronAPI.invoke('database:getProjectBaselines', projectId);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data as Baseline[];
  }
);

/**
 * ベースライン取得
 */
export const fetchBaseline = createAsyncThunk(
  'progress/fetchBaseline',
  async (baselineId: string) => {
    const result = await window.electronAPI.invoke('database:getBaseline', baselineId);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data as Baseline;
  }
);

/**
 * ベースライン削除
 */
export const deleteBaseline = createAsyncThunk(
  'progress/deleteBaseline',
  async (baselineId: string) => {
    const result = await window.electronAPI.invoke('database:deleteBaseline', baselineId);
    if (!result.success) {
      throw new Error(result.error);
    }
    return baselineId;
  }
);

/**
 * タスク進捗更新
 */
export const updateTaskProgress = createAsyncThunk(
  'progress/updateTaskProgress',
  async (progressData: ProgressUpdate) => {
    const result = await window.electronAPI.invoke('database:updateTaskProgress', progressData);
    if (!result.success) {
      throw new Error(result.error);
    }
    return { progressData, task: result.data };
  }
);

/**
 * プロジェクトEVM計算
 */
export const calculateProjectEVM = createAsyncThunk(
  'progress/calculateProjectEVM',
  async (params: { projectId: string; statusDate?: Date }) => {
    const result = await window.electronAPI.invoke(
      'database:calculateProjectEVM',
      params.projectId,
      params.statusDate?.toISOString()
    );
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data as EVMMetrics;
  }
);

/**
 * タスクEVMデータ取得
 */
export const fetchTaskEVMData = createAsyncThunk(
  'progress/fetchTaskEVMData',
  async (params: { taskId: string; baselineId?: string }) => {
    const result = await window.electronAPI.invoke(
      'database:getTaskEVMData',
      params.taskId,
      params.baselineId
    );
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data as TaskEVMData;
  }
);

// ===================== Slice定義 =====================

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    setCurrentBaseline: (state, action: PayloadAction<Baseline | null>) => {
      state.currentBaseline = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addRecentUpdate: (state, action: PayloadAction<ProgressUpdate>) => {
      state.recentUpdates.unshift(action.payload);
      // 最新10件のみ保持
      if (state.recentUpdates.length > 10) {
        state.recentUpdates = state.recentUpdates.slice(0, 10);
      }
    },
  },
  extraReducers: (builder) => {
    // ベースライン作成
    builder.addCase(createBaseline.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createBaseline.fulfilled, (state, action) => {
      state.loading = false;
      state.baselines.unshift(action.payload);
      state.currentBaseline = action.payload;
    });
    builder.addCase(createBaseline.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'ベースラインの作成に失敗しました';
    });

    // ベースライン一覧取得
    builder.addCase(fetchProjectBaselines.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProjectBaselines.fulfilled, (state, action) => {
      state.loading = false;
      state.baselines = action.payload;
      // 最新のベースラインを現在のベースラインとして設定
      if (action.payload.length > 0) {
        state.currentBaseline = action.payload[0];
      }
    });
    builder.addCase(fetchProjectBaselines.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'ベースラインの取得に失敗しました';
    });

    // ベースライン取得
    builder.addCase(fetchBaseline.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBaseline.fulfilled, (state, action) => {
      state.loading = false;
      state.currentBaseline = action.payload;
    });
    builder.addCase(fetchBaseline.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'ベースラインの取得に失敗しました';
    });

    // ベースライン削除
    builder.addCase(deleteBaseline.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteBaseline.fulfilled, (state, action) => {
      state.loading = false;
      state.baselines = state.baselines.filter(b => b.id !== action.payload);
      if (state.currentBaseline?.id === action.payload) {
        state.currentBaseline = state.baselines[0] || null;
      }
    });
    builder.addCase(deleteBaseline.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'ベースラインの削除に失敗しました';
    });

    // タスク進捗更新
    builder.addCase(updateTaskProgress.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateTaskProgress.fulfilled, (state, action) => {
      state.loading = false;
      // 最近の更新に追加
      state.recentUpdates.unshift(action.payload.progressData);
      if (state.recentUpdates.length > 10) {
        state.recentUpdates = state.recentUpdates.slice(0, 10);
      }
    });
    builder.addCase(updateTaskProgress.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'タスク進捗の更新に失敗しました';
    });

    // プロジェクトEVM計算
    builder.addCase(calculateProjectEVM.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(calculateProjectEVM.fulfilled, (state, action) => {
      state.loading = false;
      state.projectEVM = action.payload;
    });
    builder.addCase(calculateProjectEVM.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'プロジェクトEVMの計算に失敗しました';
    });

    // タスクEVMデータ取得
    builder.addCase(fetchTaskEVMData.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTaskEVMData.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.taskEVMData[action.payload.taskId] = action.payload;
      }
    });
    builder.addCase(fetchTaskEVMData.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'タスクEVMデータの取得に失敗しました';
    });
  },
});

export const { setCurrentBaseline, clearError, addRecentUpdate } = progressSlice.actions;
export default progressSlice.reducer;
