import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Project } from '../../types/project';

interface ProjectState {
  items: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  filter: {
    status: string;
    search: string;
  };
  sort: {
    field: keyof Project;
    direction: 'asc' | 'desc';
  };
}

const initialState: ProjectState = {
  items: [],
  currentProject: null,
  isLoading: false,
  error: null,
  filter: {
    status: 'all',
    search: '',
  },
  sort: {
    field: 'createdAt',
    direction: 'desc',
  },
};

// 非同期アクション：プロジェクト一覧取得
export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API is not available');
      }
      
      const result = await window.electronAPI.database.getProjects();
      if (!result.success) {
        throw new Error(result.error || 'プロジェクトの取得に失敗しました');
      }
      
      return result.data || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'プロジェクトの取得に失敗しました');
    }
  }
);

// 非同期アクション：特定プロジェクト取得
export const fetchProject = createAsyncThunk(
  'project/fetchProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API is not available');
      }
      
      const result = await window.electronAPI.database.getProject(projectId);
      if (!result.success) {
        throw new Error(result.error || 'プロジェクトの取得に失敗しました');
      }
      
      return result.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'プロジェクトの取得に失敗しました');
    }
  }
);

// 非同期アクション：プロジェクト作成
export const createProject = createAsyncThunk(
  'project/createProject',
  async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API is not available');
      }

      const result = await window.electronAPI.database.createProject(projectData);
      if (!result.success) {
        throw new Error(result.error || 'プロジェクトの作成に失敗しました');
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'プロジェクトの作成に失敗しました');
    }
  }
);

// 非同期アクション：プロジェクト更新
export const updateProject = createAsyncThunk(
  'project/updateProject',
  async ({ projectId, updates }: { projectId: string; updates: Partial<Project> }, { rejectWithValue }) => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API is not available');
      }

      const result = await window.electronAPI.database.updateProject(projectId, updates);
      if (!result.success) {
        throw new Error(result.error || 'プロジェクトの更新に失敗しました');
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'プロジェクトの更新に失敗しました');
    }
  }
);

// 非同期アクション：プロジェクト削除
export const deleteProjectAsync = createAsyncThunk(
  'project/deleteProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API is not available');
      }

      const result = await window.electronAPI.database.deleteProject(projectId);
      if (!result.success) {
        throw new Error(result.error || 'プロジェクトの削除に失敗しました');
      }

      return projectId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'プロジェクトの削除に失敗しました');
    }
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    updateProjectLocal: (state, action: PayloadAction<Partial<Project> & { id: string }>) => {
      const index = state.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = { ...state.currentProject, ...action.payload };
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(p => p.id !== action.payload);
      if (state.currentProject?.id === action.payload) {
        state.currentProject = null;
      }
    },
    setFilter: (state, action: PayloadAction<Partial<ProjectState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    setSort: (state, action: PayloadAction<ProjectState['sort']>) => {
      state.sort = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // プロジェクト一覧取得
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 特定プロジェクト取得
    builder
      .addCase(fetchProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // プロジェクト作成
    builder
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.unshift(action.payload);
        state.currentProject = action.payload;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // プロジェクト更新
    builder
      .addCase(updateProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // プロジェクト削除
    builder
      .addCase(deleteProjectAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProjectAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter(p => p.id !== action.payload);
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProjectAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentProject,
  updateProjectLocal,
  deleteProject,
  setFilter,
  setSort,
  clearError,
} = projectSlice.actions;

export default projectSlice.reducer;