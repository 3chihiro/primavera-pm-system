import React, { useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  LinearProgress,
  Button,
  Grid,
} from '@mui/material';
import {
  Add,
  TrendingUp,
  Assignment,
  People,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchProjects } from '../../store/slices/projectSlice';
import { calculateProjectEVM } from '../../store/slices/progressSlice';

/**
 * ダッシュボードコンポーネント
 * プロジェクトの概要、統計情報、最近のアクティビティを表示
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { projects, isLoading, projectEVM, currentProjectId } = useSelector((state: RootState) => ({
    projects: state.project.items,
    isLoading: state.project.isLoading,
    projectEVM: state.progress.projectEVM,
    currentProjectId: state.project.currentProject?.id,
  }));

  useEffect(() => {
    // ダッシュボード表示時にプロジェクト一覧を取得
    dispatch(fetchProjects());
  }, [dispatch]);

  // 現在のプロジェクトのEVMを計算
  useEffect(() => {
    if (currentProjectId) {
      dispatch(calculateProjectEVM({ projectId: currentProjectId }));
    }
  }, [currentProjectId, dispatch]);

  // 統計情報の計算
  const stats = React.useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const plannedProjects = projects.filter(p => p.status === 'planning').length;

    // 進捗の平均値を計算（EV/PVの平均）
    const averageProgress = projects.length > 0
      ? projects.reduce((sum, p) => sum + (p.progress?.schedulePerformanceIndex || 0), 0) / projects.length
      : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      plannedProjects,
      averageProgress: Math.round(averageProgress * 100),
    };
  }, [projects]);

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, padding: 3 }}>
      {/* ページヘッダー */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" gutterBottom>
          ダッシュボード
        </Typography>
        <Typography variant="body1" color="text.secondary">
          プロジェクトの概要と進捗状況を確認できます
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 統計カード */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assignment sx={{ marginRight: 1, color: 'primary.main' }} />
                <Typography variant="h6">総プロジェクト</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {stats.totalProjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ marginRight: 1, color: 'success.main' }} />
                <Typography variant="h6">実行中</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {stats.activeProjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ marginRight: 1, color: 'info.main' }} />
                <Typography variant="h6">完了</Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                {stats.completedProjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule sx={{ marginRight: 1, color: 'warning.main' }} />
                <Typography variant="h6">平均進捗</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                {stats.averageProgress}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 最近のプロジェクト */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
              最近のプロジェクト
            </Typography>
            
            {projects.length === 0 ? (
              <Box sx={{ textAlign: 'center', padding: 4 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  まだプロジェクトがありません
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateProject}
                >
                  最初のプロジェクトを作成
                </Button>
              </Box>
            ) : (
              <List>
                {projects.slice(0, 5).map((project) => (
                  <ListItem
                    key={project.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      marginBottom: 1,
                      borderRadius: 1,
                    }}
                  >
                    <ListItemButton onClick={() => handleViewProject(project.id)}>
                    <ListItemText
                      primary={project.name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={getStatusLabel(project.status)}
                            color={getStatusColor(project.status) as any}
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary" component="span">
                            {project.manager && `責任者: ${project.manager}`}
                          </Typography>
                        </Box>
                      }
                    />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* EVMメトリクス */}
        {projectEVM && currentProjectId && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ padding: 3 }}>
              <Typography variant="h6" gutterBottom>
                EVMメトリクス
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    CPI（コスト効率指標）
                  </Typography>
                  <Typography
                    variant="h5"
                    color={projectEVM.cpi >= 1 ? 'success.main' : 'error.main'}
                  >
                    {projectEVM.cpi.toFixed(2)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    SPI（スケジュール効率指標）
                  </Typography>
                  <Typography
                    variant="h5"
                    color={projectEVM.spi >= 1 ? 'success.main' : 'error.main'}
                  >
                    {projectEVM.spi.toFixed(2)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    コスト差異（CV）
                  </Typography>
                  <Typography
                    variant="h6"
                    color={projectEVM.cv >= 0 ? 'success.main' : 'error.main'}
                  >
                    ¥{projectEVM.cv.toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    スケジュール差異（SV）
                  </Typography>
                  <Typography
                    variant="h6"
                    color={projectEVM.sv >= 0 ? 'success.main' : 'error.main'}
                  >
                    ¥{projectEVM.sv.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* クイックアクション */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
              クイックアクション
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateProject}
                fullWidth
              >
                新規プロジェクト作成
              </Button>

              <Button
                variant="outlined"
                onClick={() => navigate('/projects')}
                fullWidth
              >
                プロジェクト一覧を表示
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;