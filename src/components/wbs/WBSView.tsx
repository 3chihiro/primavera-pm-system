import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Chip,
  LinearProgress,
  Tooltip,
  Grid,
  Collapse,
} from '@mui/material';
import {
  Add,
  ExpandMore,
  ChevronRight,
  MoreVert,
  Edit,
  Delete,
  AddCircle,
  Schedule,
  Assignment,
  Flag,
  People,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { Task, TaskType, TaskStatus, TaskPriority, CreateTaskData, TaskHierarchy } from '../../types/task';
import TaskResourceAssignmentDialog from '../resource/TaskResourceAssignmentDialog';
import ProgressUpdateDialog from '../progress/ProgressUpdateDialog';
import { updateTaskProgress } from '../../store/slices/progressSlice';

/**
 * WBS（作業分解構造）表示コンポーネント
 * 階層的なタスク管理機能を提供
 */
const WBSView: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const { currentProject, isLoading } = useSelector((state: RootState) => ({
    currentProject: state.project.currentProject,
    isLoading: state.project.isLoading,
  }));

  // モックデータ（実際の実装では Redux から取得）
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      projectId: projectId || '',
      parentId: null,
      wbsCode: '1',
      name: 'プロジェクト開始',
      description: 'プロジェクトの開始フェーズ',
      type: 'summary',
      status: 'in_progress',
      priority: 'high',
      plannedStartDate: new Date('2024-01-01'),
      plannedEndDate: new Date('2024-01-31'),
      actualStartDate: new Date('2024-01-01'),
      actualEndDate: null,
      duration: 30,
      remainingDuration: 15,
      percentComplete: 50,
      physicalPercentComplete: 45,
      assignedResources: [],
      dependencies: [],
      budgetedCost: 500000,
      actualCost: 250000,
      remainingCost: 250000,
      sortOrder: 1,
      notes: '',
      tags: ['開始フェーズ'],
      createdAt: new Date(),
      updatedAt: new Date(),
      cmp: {
        earlyStart: new Date('2024-01-01'),
        earlyFinish: new Date('2024-01-31'),
        lateStart: new Date('2024-01-01'),
        lateFinish: new Date('2024-01-31'),
        totalFloat: 0,
        freeFloat: 0,
        isCritical: true,
      },
      constraints: [],
    },
    {
      id: '2',
      projectId: projectId || '',
      parentId: '1',
      wbsCode: '1.1',
      name: '要件定義',
      description: 'プロジェクトの要件を定義する',
      type: 'task',
      status: 'completed',
      priority: 'high',
      plannedStartDate: new Date('2024-01-01'),
      plannedEndDate: new Date('2024-01-10'),
      actualStartDate: new Date('2024-01-01'),
      actualEndDate: new Date('2024-01-10'),
      duration: 10,
      remainingDuration: 0,
      percentComplete: 100,
      physicalPercentComplete: 100,
      assignedResources: [],
      dependencies: [],
      budgetedCost: 200000,
      actualCost: 200000,
      remainingCost: 0,
      sortOrder: 1,
      notes: '',
      tags: ['要件'],
      createdAt: new Date(),
      updatedAt: new Date(),
      cmp: {
        earlyStart: new Date('2024-01-01'),
        earlyFinish: new Date('2024-01-10'),
        lateStart: new Date('2024-01-01'),
        lateFinish: new Date('2024-01-10'),
        totalFloat: 0,
        freeFloat: 0,
        isCritical: true,
      },
      constraints: [],
    },
    {
      id: '3',
      projectId: projectId || '',
      parentId: '1',
      wbsCode: '1.2',
      name: '設計作業',
      description: 'システム設計を行う',
      type: 'task',
      status: 'in_progress',
      priority: 'normal',
      plannedStartDate: new Date('2024-01-11'),
      plannedEndDate: new Date('2024-01-31'),
      actualStartDate: new Date('2024-01-11'),
      actualEndDate: null,
      duration: 20,
      remainingDuration: 10,
      percentComplete: 50,
      physicalPercentComplete: 45,
      assignedResources: [],
      dependencies: [],
      budgetedCost: 300000,
      actualCost: 150000,
      remainingCost: 150000,
      sortOrder: 2,
      notes: '',
      tags: ['設計'],
      createdAt: new Date(),
      updatedAt: new Date(),
      cmp: {
        earlyStart: new Date('2024-01-11'),
        earlyFinish: new Date('2024-01-31'),
        lateStart: new Date('2024-01-11'),
        lateFinish: new Date('2024-01-31'),
        totalFloat: 0,
        freeFloat: 0,
        isCritical: true,
      },
      constraints: [],
    }
  ]);

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set(['1']));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CreateTaskData | null>(null);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [resourceAssignmentTask, setResourceAssignmentTask] = useState<Task | null>(null);

  // WBS階層データの生成
  const hierarchicalTasks = useMemo(() => {
    const buildHierarchy = (parentId: string | null, level: number): TaskHierarchy[] => {
      return tasks
        .filter(task => task.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(task => ({
          ...task,
          children: buildHierarchy(task.id, level + 1),
          level,
          isExpanded: expandedTasks.has(task.id),
        }));
    };
    return buildHierarchy(null, 0);
  }, [tasks, expandedTasks]);

  // 表示用フラット配列の生成
  const flattenedTasks = useMemo(() => {
    const flatten = (hierarchyTasks: TaskHierarchy[]): TaskHierarchy[] => {
      const result: TaskHierarchy[] = [];
      for (const task of hierarchyTasks) {
        result.push(task);
        if (task.isExpanded && task.children.length > 0) {
          result.push(...flatten(task.children));
        }
      }
      return result;
    };
    return flatten(hierarchicalTasks);
  }, [hierarchicalTasks]);

  const handleToggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleAddTask = (parentTask?: Task) => {
    const newWbsCode = parentTask
      ? `${parentTask.wbsCode}.${parentTask.children?.length + 1 || 1}`
      : `${tasks.filter(t => !t.parentId).length + 1}`;

    setEditingTask({
      projectId: projectId || '',
      parentId: parentTask?.id || null,
      wbsCode: newWbsCode,
      name: '',
      description: '',
      type: 'task',
      status: 'not_started',
      priority: 'normal',
      plannedStartDate: new Date(),
      plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      actualStartDate: null,
      actualEndDate: null,
      duration: 7,
      remainingDuration: 7,
      percentComplete: 0,
      physicalPercentComplete: 0,
      assignedResources: [],
      dependencies: [],
      budgetedCost: 0,
      actualCost: 0,
      remainingCost: 0,
      sortOrder: 0,
      notes: '',
      tags: [],
      constraints: [],
    });
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask({
      ...task,
      createdAt: undefined,
      updatedAt: undefined,
      cmp: undefined,
    } as CreateTaskData);
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteTask = (task: Task) => {
    setTasks(prev => prev.filter(t => t.id !== task.id && t.parentId !== task.id));
    handleMenuClose();
  };

  const handleSaveTask = () => {
    if (!editingTask) return;

    if (editingTask.id) {
      // 更新
      setTasks(prev => prev.map(t =>
        t.id === editingTask.id
          ? { ...t, ...editingTask, updatedAt: new Date() }
          : t
      ));
    } else {
      // 新規作成
      const newTask: Task = {
        ...editingTask,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        cmp: {
          earlyStart: editingTask.plannedStartDate,
          earlyFinish: editingTask.plannedEndDate,
          lateStart: editingTask.plannedStartDate,
          lateFinish: editingTask.plannedEndDate,
          totalFloat: 0,
          freeFloat: 0,
          isCritical: false,
        },
      };
      setTasks(prev => [...prev, newTask]);
    }

    setDialogOpen(false);
    setEditingTask(null);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'not_started': return 'default';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'on_hold': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'not_started': return '未開始';
      case 'in_progress': return '進行中';
      case 'completed': return '完了';
      case 'on_hold': return '保留';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'lowest': return '#9E9E9E';
      case 'low': return '#4CAF50';
      case 'normal': return '#2196F3';
      case 'high': return '#FF9800';
      case 'highest': return '#F44336';
      default: return '#2196F3';
    }
  };

  if (!projectId) {
    return (
      <Box sx={{ padding: 3 }}>
        <Typography color="error">プロジェクトIDが見つかりません</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box sx={{ padding: 3 }}>
        {/* ページヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              WBS管理
            </Typography>
            <Typography variant="body1" color="text.secondary">
              作業分解構造（Work Breakdown Structure）でタスクを階層的に管理
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleAddTask()}
          >
            ルートタスク追加
          </Button>
        </Box>

        {/* WBS統計情報 */}
        <Grid container spacing={2} sx={{ marginBottom: 3 }}>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ padding: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {tasks.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総タスク数
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ padding: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {tasks.filter(t => t.status === 'completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                完了タスク
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ padding: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {tasks.filter(t => t.status === 'in_progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                進行中タスク
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ padding: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">
                {tasks.filter(t => t.cmp?.isCritical).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                クリティカルパス
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* WBSテーブル */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>WBSコード</TableCell>
                <TableCell>タスク名</TableCell>
                <TableCell>タイプ</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>優先度</TableCell>
                <TableCell>進捗率</TableCell>
                <TableCell>期間</TableCell>
                <TableCell>開始日</TableCell>
                <TableCell>終了日</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flattenedTasks.map((task) => (
                <TableRow
                  key={task.id}
                  hover
                  sx={{
                    backgroundColor: task.cmp?.isCritical ? 'rgba(244, 67, 54, 0.04)' : 'inherit',
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ marginLeft: task.level * 2 }}>
                        {task.children.length > 0 && (
                          <IconButton
                            size="small"
                            onClick={() => handleToggleExpand(task.id)}
                          >
                            {task.isExpanded ? <ExpandMore /> : <ChevronRight />}
                          </IconButton>
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            marginLeft: task.children.length === 0 ? 3 : 0,
                            fontWeight: task.type === 'summary' ? 'bold' : 'normal'
                          }}
                        >
                          {task.wbsCode}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: task.type === 'summary' ? 'bold' : 'normal',
                        color: task.cmp?.isCritical ? 'error.main' : 'inherit'
                      }}
                    >
                      {task.name}
                    </Typography>
                    {task.description && (
                      <Typography variant="caption" color="text.secondary">
                        {task.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={
                        task.type === 'milestone' ? <Flag /> :
                        task.type === 'summary' ? <Assignment /> :
                        <Schedule />
                      }
                      label={
                        task.type === 'summary' ? 'サマリー' :
                        task.type === 'milestone' ? 'マイルストーン' :
                        'タスク'
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(task.status)}
                      color={getStatusColor(task.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getPriorityColor(task.priority),
                        }}
                      />
                      <Typography variant="body2">
                        {task.priority === 'lowest' ? '最低' :
                         task.priority === 'low' ? '低' :
                         task.priority === 'normal' ? '通常' :
                         task.priority === 'high' ? '高' :
                         task.priority === 'highest' ? '最高' : task.priority}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 60 }}>
                        <LinearProgress
                          variant="determinate"
                          value={task.percentComplete}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      <Typography variant="body2">
                        {task.percentComplete}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {task.duration}日
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {task.plannedStartDate.toLocaleDateString('ja-JP')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {task.plannedEndDate.toLocaleDateString('ja-JP')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, task)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {tasks.length === 0 && (
            <Box sx={{ textAlign: 'center', padding: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                タスクがありません
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleAddTask()}
              >
                最初のタスクを作成
              </Button>
            </Box>
          )}
        </TableContainer>

        {/* コンテキストメニュー */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => selectedTask && handleEditTask(selectedTask)}>
            <Edit sx={{ marginRight: 1 }} />
            編集
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedTask) {
              setResourceAssignmentTask(selectedTask);
              setResourceDialogOpen(true);
              handleMenuClose();
            }
          }}>
            <People sx={{ marginRight: 1 }} />
            リソース割り当て
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedTask) {
              setProgressDialogOpen(true);
              handleMenuClose();
            }
          }}>
            <Schedule sx={{ marginRight: 1 }} />
            進捗更新
          </MenuItem>
          <MenuItem onClick={() => selectedTask && handleAddTask(selectedTask)}>
            <AddCircle sx={{ marginRight: 1 }} />
            サブタスク追加
          </MenuItem>
          <MenuItem onClick={() => selectedTask && handleDeleteTask(selectedTask)}>
            <Delete sx={{ marginRight: 1 }} />
            削除
          </MenuItem>
        </Menu>

        {/* タスク編集ダイアログ */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingTask?.id ? 'タスク編集' : '新規タスク作成'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ marginTop: 1 }}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="タスク名"
                  value={editingTask?.name || ''}
                  onChange={(e) => setEditingTask(prev =>
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="WBSコード"
                  value={editingTask?.wbsCode || ''}
                  onChange={(e) => setEditingTask(prev =>
                    prev ? { ...prev, wbsCode: e.target.value } : null
                  )}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="説明"
                  multiline
                  rows={3}
                  value={editingTask?.description || ''}
                  onChange={(e) => setEditingTask(prev =>
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>タイプ</InputLabel>
                  <Select
                    value={editingTask?.type || 'task'}
                    onChange={(e) => setEditingTask(prev =>
                      prev ? { ...prev, type: e.target.value as TaskType } : null
                    )}
                    label="タイプ"
                  >
                    <MenuItem value="task">タスク</MenuItem>
                    <MenuItem value="summary">サマリータスク</MenuItem>
                    <MenuItem value="milestone">マイルストーン</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>ステータス</InputLabel>
                  <Select
                    value={editingTask?.status || 'not_started'}
                    onChange={(e) => setEditingTask(prev =>
                      prev ? { ...prev, status: e.target.value as TaskStatus } : null
                    )}
                    label="ステータス"
                  >
                    <MenuItem value="not_started">未開始</MenuItem>
                    <MenuItem value="in_progress">進行中</MenuItem>
                    <MenuItem value="completed">完了</MenuItem>
                    <MenuItem value="on_hold">保留</MenuItem>
                    <MenuItem value="cancelled">キャンセル</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>優先度</InputLabel>
                  <Select
                    value={editingTask?.priority || 'normal'}
                    onChange={(e) => setEditingTask(prev =>
                      prev ? { ...prev, priority: e.target.value as TaskPriority } : null
                    )}
                    label="優先度"
                  >
                    <MenuItem value="lowest">最低</MenuItem>
                    <MenuItem value="low">低</MenuItem>
                    <MenuItem value="normal">通常</MenuItem>
                    <MenuItem value="high">高</MenuItem>
                    <MenuItem value="highest">最高</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="開始予定日"
                  value={editingTask?.plannedStartDate || null}
                  onChange={(date) => setEditingTask(prev =>
                    prev && date ? { ...prev, plannedStartDate: date } : prev
                  )}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="終了予定日"
                  value={editingTask?.plannedEndDate || null}
                  onChange={(date) => setEditingTask(prev =>
                    prev && date ? { ...prev, plannedEndDate: date } : prev
                  )}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="期間（日数）"
                  type="number"
                  value={editingTask?.duration || 0}
                  onChange={(e) => setEditingTask(prev =>
                    prev ? { ...prev, duration: Number(e.target.value) } : null
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="完了率（%）"
                  type="number"
                  inputProps={{ min: 0, max: 100 }}
                  value={editingTask?.percentComplete || 0}
                  onChange={(e) => setEditingTask(prev =>
                    prev ? { ...prev, percentComplete: Number(e.target.value) } : null
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="予算コスト"
                  type="number"
                  value={editingTask?.budgetedCost || 0}
                  onChange={(e) => setEditingTask(prev =>
                    prev ? { ...prev, budgetedCost: Number(e.target.value) } : null
                  )}
                  InputProps={{
                    startAdornment: <Typography sx={{ marginRight: 1 }}>¥</Typography>,
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSaveTask}
              variant="contained"
              disabled={!editingTask?.name || !editingTask?.wbsCode}
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>

        {/* リソース割り当てダイアログ */}
        <TaskResourceAssignmentDialog
          open={resourceDialogOpen}
          task={resourceAssignmentTask}
          onClose={() => {
            setResourceDialogOpen(false);
            setResourceAssignmentTask(null);
          }}
          onSave={(taskId, assignments) => {
            console.log('リソース割り当て保存:', taskId, assignments);
            // TODO: データベースに保存
          }}
        />

        {/* 進捗更新ダイアログ */}
        {selectedTask && (
          <ProgressUpdateDialog
            open={progressDialogOpen}
            task={selectedTask}
            onClose={() => {
              setProgressDialogOpen(false);
            }}
            onSave={async (progressData) => {
              try {
                await dispatch(updateTaskProgress(progressData)).unwrap();
                // タスク一覧を更新（実際の実装ではReduxから取得するため自動更新される）
                setTasks(prev => prev.map(t =>
                  t.id === progressData.taskId
                    ? {
                        ...t,
                        percentComplete: progressData.percentComplete,
                        physicalPercentComplete: progressData.physicalPercentComplete,
                        actualStartDate: progressData.actualStartDate,
                        actualEndDate: progressData.actualEndDate,
                        remainingDuration: progressData.remainingDuration,
                        actualCost: progressData.actualCost,
                        notes: progressData.notes || t.notes,
                        updatedAt: new Date(),
                      }
                    : t
                ));
                setProgressDialogOpen(false);
              } catch (error) {
                console.error('進捗更新エラー:', error);
              }
            }}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default WBSView;