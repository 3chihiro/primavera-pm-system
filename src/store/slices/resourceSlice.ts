import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Resource } from '../../types/resource';

interface ResourceState {
  items: Resource[];
  selectedResource: Resource | null;
  isLoading: boolean;
  error: string | null;
  view: 'list' | 'histogram' | 'usage';
  filter: {
    type: string;
    availability: string;
    search: string;
  };
  sort: {
    field: keyof Resource;
    direction: 'asc' | 'desc';
  };
}

const initialState: ResourceState = {
  items: [],
  selectedResource: null,
  isLoading: false,
  error: null,
  view: 'list',
  filter: {
    type: 'all',
    availability: 'all',
    search: '',
  },
  sort: {
    field: 'name',
    direction: 'asc',
  },
};

const resourceSlice = createSlice({
  name: 'resource',
  initialState,
  reducers: {
    setResources: (state, action: PayloadAction<Resource[]>) => {
      state.items = action.payload;
    },
    addResource: (state, action: PayloadAction<Resource>) => {
      state.items.push(action.payload);
    },
    updateResource: (state, action: PayloadAction<Partial<Resource> & { id: string }>) => {
      const index = state.items.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
      if (state.selectedResource?.id === action.payload.id) {
        state.selectedResource = { ...state.selectedResource, ...action.payload };
      }
    },
    deleteResource: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(r => r.id !== action.payload);
      if (state.selectedResource?.id === action.payload) {
        state.selectedResource = null;
      }
    },
    setSelectedResource: (state, action: PayloadAction<Resource | null>) => {
      state.selectedResource = action.payload;
    },
    updateResourceAllocation: (state, action: PayloadAction<{
      resourceId: string;
      taskId: string;
      allocation: number;
      startDate: Date;
      endDate: Date;
    }>) => {
      const { resourceId, taskId, allocation, startDate, endDate } = action.payload;
      const resource = state.items.find(r => r.id === resourceId);
      if (resource) {
        // 既存の割り当てがあるかチェック
        const existingAllocationIndex = resource.allocations.findIndex(
          a => a.taskId === taskId
        );
        
        if (existingAllocationIndex !== -1) {
          // 既存の割り当てを更新
          resource.allocations[existingAllocationIndex] = {
            ...resource.allocations[existingAllocationIndex],
            allocation,
            startDate,
            endDate,
          };
        } else {
          // 新しい割り当てを追加
          resource.allocations.push({
            taskId,
            allocation,
            startDate,
            endDate,
            plannedWork: 0,
            actualWork: 0,
            remainingWork: 0,
            cost: 0,
            actualCost: 0,
          });
        }
      }
    },
    removeResourceAllocation: (state, action: PayloadAction<{
      resourceId: string;
      taskId: string;
    }>) => {
      const { resourceId, taskId } = action.payload;
      const resource = state.items.find(r => r.id === resourceId);
      if (resource) {
        resource.allocations = resource.allocations.filter(a => a.taskId !== taskId);
      }
    },
    setView: (state, action: PayloadAction<ResourceState['view']>) => {
      state.view = action.payload;
    },
    setFilter: (state, action: PayloadAction<Partial<ResourceState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    setSort: (state, action: PayloadAction<ResourceState['sort']>) => {
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
    // リソース平準化（自動的に負荷を調整）
    levelResources: (state, action: PayloadAction<{
      strategy: 'minimize_duration' | 'balance_workload' | 'respect_constraints';
    }>) => {
      // TODO: リソース平準化アルゴリズムを実装
      // このアクションは複雑な計算を伴うため、後でサービス層に移動する可能性がある
      console.log('リソース平準化を実行:', action.payload.strategy);
    },
  },
});

export const {
  setResources,
  addResource,
  updateResource,
  deleteResource,
  setSelectedResource,
  updateResourceAllocation,
  removeResourceAllocation,
  setView,
  setFilter,
  setSort,
  setLoading,
  setError,
  clearError,
  levelResources,
} = resourceSlice.actions;

export default resourceSlice.reducer;