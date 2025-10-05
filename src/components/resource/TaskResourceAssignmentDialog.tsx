import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  MenuItem,
  Box,
  Typography,
  Chip,
  Paper,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { Task } from '../../types/task';
import { Resource, ResourceAllocation } from '../../types/resource';
import { updateResourceAllocation, removeResourceAllocation } from '../../store/slices/resourceSlice';
import { differenceInDays } from 'date-fns';

interface TaskResourceAssignmentDialogProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (taskId: string, assignments: ResourceAssignment[]) => void;
}

interface ResourceAssignment {
  resourceId: string;
  allocation: number; // 割り当て率 (0-100)
  plannedWork: number; // 計画作業時間
}

/**
 * タスクリソース割り当てダイアログ
 */
const TaskResourceAssignmentDialog: React.FC<TaskResourceAssignmentDialogProps> = ({
  open,
  task,
  onClose,
  onSave,
}) => {
  const dispatch = useDispatch();
  const { items: resources } = useSelector((state: RootState) => state.resource);

  const [assignments, setAssignments] = useState<ResourceAssignment[]>([]);
  const [newAssignment, setNewAssignment] = useState<{
    resourceId: string;
    allocation: number;
  }>({
    resourceId: '',
    allocation: 100,
  });

  useEffect(() => {
    if (task && open) {
      // 既存の割り当てを読み込む
      const existingAssignments: ResourceAssignment[] = [];

      resources.forEach(resource => {
        const allocation = resource.allocations.find(a => a.taskId === task.id);
        if (allocation) {
          existingAssignments.push({
            resourceId: resource.id,
            allocation: allocation.allocation,
            plannedWork: allocation.plannedWork,
          });
        }
      });

      setAssignments(existingAssignments);
    }
  }, [task, open, resources]);

  // 利用可能なリソース（未割り当て）
  const availableResources = resources.filter(
    r => !assignments.some(a => a.resourceId === r.id)
  );

  // タスクの総作業時間を計算
  const calculatePlannedWork = (allocation: number): number => {
    if (!task) return 0;

    const days = differenceInDays(
      new Date(task.plannedEndDate),
      new Date(task.plannedStartDate)
    ) + 1;

    // 1日8時間 × 日数 × 割り当て率
    const workDays = Math.ceil(days * 5 / 7); // 土日を除外した概算
    return Math.round(workDays * 8 * (allocation / 100) * 10) / 10;
  };

  // リソース追加
  const handleAddAssignment = () => {
    if (!newAssignment.resourceId) return;

    const plannedWork = calculatePlannedWork(newAssignment.allocation);

    setAssignments([
      ...assignments,
      {
        resourceId: newAssignment.resourceId,
        allocation: newAssignment.allocation,
        plannedWork,
      },
    ]);

    setNewAssignment({
      resourceId: '',
      allocation: 100,
    });
  };

  // リソース削除
  const handleRemoveAssignment = (resourceId: string) => {
    setAssignments(assignments.filter(a => a.resourceId !== resourceId));
  };

  // 割り当て率変更
  const handleAllocationChange = (resourceId: string, allocation: number) => {
    setAssignments(
      assignments.map(a =>
        a.resourceId === resourceId
          ? { ...a, allocation, plannedWork: calculatePlannedWork(allocation) }
          : a
      )
    );
  };

  // 保存
  const handleSave = () => {
    if (!task) return;

    // Redux Storeを更新
    assignments.forEach(assignment => {
      const resource = resources.find(r => r.id === assignment.resourceId);
      if (!resource || !task) return;

      dispatch(
        updateResourceAllocation({
          resourceId: assignment.resourceId,
          taskId: task.id,
          allocation: assignment.allocation,
          startDate: new Date(task.plannedStartDate),
          endDate: new Date(task.plannedEndDate),
        })
      );
    });

    // 削除された割り当てを処理
    const removedResourceIds = resources
      .filter(r => r.allocations.some(a => a.taskId === task.id))
      .map(r => r.id)
      .filter(id => !assignments.some(a => a.resourceId === id));

    removedResourceIds.forEach(resourceId => {
      dispatch(
        removeResourceAllocation({
          resourceId,
          taskId: task.id,
        })
      );
    });

    onSave(task.id, assignments);
    onClose();
  };

  // リソース名取得
  const getResourceName = (resourceId: string): string => {
    const resource = resources.find(r => r.id === resourceId);
    return resource ? `${resource.code} - ${resource.name}` : '';
  };

  // リソースタイプラベル取得
  const getResourceTypeLabel = (resourceId: string): string => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return '';

    const labels: Record<string, string> = {
      work: '人的',
      material: '材料',
      cost: 'コスト',
      equipment: '設備',
    };

    return labels[resource.type] || '';
  };

  // 総作業時間の計算
  const totalPlannedWork = assignments.reduce((sum, a) => sum + a.plannedWork, 0);

  if (!task) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        リソース割り当て - {task.name}
      </DialogTitle>
      <DialogContent dividers>
        {/* タスク情報 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            タスク期間
          </Typography>
          <Typography variant="body1">
            {new Date(task.plannedStartDate).toLocaleDateString()} 〜{' '}
            {new Date(task.plannedEndDate).toLocaleDateString()}
          </Typography>
        </Box>

        {/* 既存の割り当て */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          割り当てリソース
        </Typography>

        {assignments.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            リソースが割り当てられていません
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>リソース</TableCell>
                  <TableCell>タイプ</TableCell>
                  <TableCell align="center">割り当て率</TableCell>
                  <TableCell align="right">計画作業時間</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.resourceId}>
                    <TableCell>{getResourceName(assignment.resourceId)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getResourceTypeLabel(assignment.resourceId)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        value={assignment.allocation}
                        onChange={(e) =>
                          handleAllocationChange(
                            assignment.resourceId,
                            Number(e.target.value)
                          )
                        }
                        size="small"
                        inputProps={{ min: 0, max: 200, step: 10 }}
                        sx={{ width: 80 }}
                        InputProps={{
                          endAdornment: <span>%</span>,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">{assignment.plannedWork}h</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveAssignment(assignment.resourceId)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <strong>合計</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{totalPlannedWork}h</strong>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* 新規リソース追加 */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          リソースを追加
        </Typography>

        {availableResources.length === 0 ? (
          <Alert severity="warning">
            割り当て可能なリソースがありません
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              select
              label="リソース"
              value={newAssignment.resourceId}
              onChange={(e) =>
                setNewAssignment({ ...newAssignment, resourceId: e.target.value })
              }
              sx={{ flex: 1 }}
              size="small"
            >
              {availableResources.map((resource) => (
                <MenuItem key={resource.id} value={resource.id}>
                  {resource.code} - {resource.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="number"
              label="割り当て率"
              value={newAssignment.allocation}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  allocation: Number(e.target.value),
                })
              }
              size="small"
              inputProps={{ min: 0, max: 200, step: 10 }}
              sx={{ width: 120 }}
              InputProps={{
                endAdornment: <span>%</span>,
              }}
            />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddAssignment}
              disabled={!newAssignment.resourceId}
            >
              追加
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskResourceAssignmentDialog;
