import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../../types/task';

interface TaskState {
  items: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;
  view: 'tree' | 'gantt' | 'list';
  filter: {
    status: string;
    assignee: string;
    search: string;
  };
  sort: {
    field: keyof Task;
    direction: 'asc' | 'desc';
  };
}

const initialState: TaskState = {
  items: [],
  selectedTask: null,
  isLoading: false,
  error: null,
  view: 'tree',
  filter: {
    status: 'all',
    assignee: 'all',
    search: '',
  },
  sort: {
    field: 'wbsCode',
    direction: 'asc',
  },
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.items = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.items.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const index = state.items.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
      if (state.selectedTask?.id === action.payload.id) {
        state.selectedTask = { ...state.selectedTask, ...action.payload };
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(t => t.id !== action.payload);
      if (state.selectedTask?.id === action.payload) {
        state.selectedTask = null;
      }
    },
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
    moveTask: (state, action: PayloadAction<{
      taskId: string;
      newParentId: string | null;
      newPosition: number;
    }>) => {
      const { taskId, newParentId, newPosition } = action.payload;
      const task = state.items.find(t => t.id === taskId);
      if (task) {
        task.parentId = newParentId;
        task.sortOrder = newPosition;
        // WBSコードの更新ロジックもここに実装
        // TODO: WBSコード再計算ロジックを実装
      }
    },
    updateTaskDependencies: (state, action: PayloadAction<{
      taskId: string;
      dependencies: Task['dependencies'];
    }>) => {
      const { taskId, dependencies } = action.payload;
      const task = state.items.find(t => t.id === taskId);
      if (task) {
        task.dependencies = dependencies;
      }
    },
    setView: (state, action: PayloadAction<TaskState['view']>) => {
      state.view = action.payload;
    },
    setFilter: (state, action: PayloadAction<Partial<TaskState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    setSort: (state, action: PayloadAction<TaskState['sort']>) => {
      state.sort = action.payload;
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
    // タスクの階層構造を更新
    updateTaskHierarchy: (state, action: PayloadAction<{
      movedTaskId: string;
      targetTaskId: string;
      position: 'before' | 'after' | 'child';
    }>) => {
      const { movedTaskId, targetTaskId, position } = action.payload;
      const movedTask = state.items.find(t => t.id === movedTaskId);
      const targetTask = state.items.find(t => t.id === targetTaskId);
      
      if (movedTask && targetTask) {
        switch (position) {
          case 'child':
            movedTask.parentId = targetTaskId;
            break;
          case 'before':
          case 'after':
            movedTask.parentId = targetTask.parentId;
            break;
        }
        // TODO: WBSコード再計算とソート順更新ロジックを実装
      }
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setSelectedTask,
  moveTask,
  updateTaskDependencies,
  setView,
  setFilter,
  setSort,
  setLoading,
  setError,
  clearError,
  updateTaskHierarchy,
} = taskSlice.actions;

export default taskSlice.reducer;