import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Search,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchProjects, setCurrentProject, deleteProjectAsync } from '../../store/slices/projectSlice';
import { showNotification } from '../../store/slices/appSlice';
import { Project } from '../../types/project';

/**
 * プロジェクト一覧コンポーネント
 * 全プロジェクトの一覧表示、検索、フィルタリング機能を提供
 */
const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { projects, isLoading, error } = useSelector((state: RootState) => ({
    projects: state.project.items,
    isLoading: state.project.isLoading,
    error: state.project.error,
  }));

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // フィルタリングされたプロジェクト一覧
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleViewProject = (project: Project) => {
    dispatch(setCurrentProject(project));
    navigate(`/projects/${project.id}`);
    handleMenuClose();
  };

  const handleEditProject = (project: Project) => {
    dispatch(setCurrentProject(project));
    navigate(`/projects/${project.id}`);
    handleMenuClose();
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;

    try {
      await dispatch(deleteProjectAsync(selectedProject.id)).unwrap();
      dispatch(showNotification({
        message: `プロジェクト「${selectedProject.name}」を削除しました`,
        severity: 'success',
      }));
    } catch (error) {
      dispatch(showNotification({
        message: 'プロジェクトの削除に失敗しました',
        severity: 'error',
      }));
    } finally {
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'default';
      case 'active':
        return 'primary';
      case 'on_hold':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning':
        return '計画中';
      case 'active':
        return '実行中';
      case 'on_hold':
        return '保留中';
      case 'completed':
        return '完了';
      case 'cancelled':
        return '中止';
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low':
        return '低';
      case 'normal':
        return '通常';
      case 'high':
        return '高';
      case 'critical':
        return '緊急';
      default:
        return priority;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP').format(date);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency || 'JPY',
    }).format(amount);
  };

  if (error) {
    return (
      <Box sx={{ padding: 3 }}>
        <Typography color="error">エラー: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      {/* ページヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            プロジェクト一覧
          </Typography>
          <Typography variant="body1" color="text.secondary">
            登録されているプロジェクトの一覧を表示・管理します
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateProject}
        >
          新規プロジェクト
        </Button>
      </Box>

      {/* 検索・フィルター */}
      <Box sx={{ display: 'flex', gap: 2, marginBottom: 3 }}>
        <TextField
          placeholder="プロジェクト名で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        
        <TextField
          select
          label="ステータス"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">すべて</MenuItem>
          <MenuItem value="planning">計画中</MenuItem>
          <MenuItem value="active">実行中</MenuItem>
          <MenuItem value="on_hold">保留中</MenuItem>
          <MenuItem value="completed">完了</MenuItem>
          <MenuItem value="cancelled">中止</MenuItem>
        </TextField>
      </Box>

      {/* プロジェクト一覧テーブル */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>プロジェクト名</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>優先度</TableCell>
              <TableCell>責任者</TableCell>
              <TableCell>開始日</TableCell>
              <TableCell>終了日</TableCell>
              <TableCell>予算</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow
                key={project.id}
                hover
                onClick={() => handleViewProject(project)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {project.name}
                    </Typography>
                    {project.description && (
                      <Typography variant="body2" color="text.secondary">
                        {project.description.length > 50
                          ? `${project.description.substring(0, 50)}...`
                          : project.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(project.status)}
                    color={getStatusColor(project.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {getPriorityLabel(project.priority)}
                </TableCell>
                <TableCell>{project.manager || '-'}</TableCell>
                <TableCell>{formatDate(project.startDate)}</TableCell>
                <TableCell>{formatDate(project.endDate)}</TableCell>
                <TableCell>
                  {formatCurrency(project.budget, project.currency)}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, project);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredProjects.length === 0 && (
          <Box sx={{ textAlign: 'center', padding: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {projects.length === 0
                ? 'プロジェクトがありません'
                : '検索条件に一致するプロジェクトがありません'}
            </Typography>
          </Box>
        )}
      </TableContainer>

      {/* 行操作メニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedProject && handleViewProject(selectedProject)}>
          <Visibility sx={{ marginRight: 1 }} />
          詳細を表示
        </MenuItem>
        <MenuItem onClick={() => selectedProject && handleEditProject(selectedProject)}>
          <Edit sx={{ marginRight: 1 }} />
          編集
        </MenuItem>
        <MenuItem onClick={() => selectedProject && handleDeleteProject(selectedProject)}>
          <Delete sx={{ marginRight: 1 }} />
          削除
        </MenuItem>
      </Menu>

      {/* フローティングアクションボタン */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleCreateProject}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <Add />
      </Fab>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          プロジェクトの削除
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            プロジェクト「{selectedProject?.name}」を削除しますか？
            <br />
            この操作は取り消せません。プロジェクトに関連するすべてのデータ（タスク、リソース、スケジュール等）も削除されます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            キャンセル
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectList;