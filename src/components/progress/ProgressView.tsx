import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Add,
  Refresh,
  Assessment,
  Timeline,
  SaveAlt,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import {
  calculateProjectEVM,
  fetchProjectBaselines,
  createBaseline,
  setCurrentBaseline,
} from '../../store/slices/progressSlice';
import { fetchProjectTasks } from '../../store/slices/taskSlice';
import EVMTrendChart from './EVMTrendChart';
import BaselineDialog from './BaselineDialog';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

/**
 * 進捗管理・EVMビューコンポーネント
 * プロジェクトの進捗状況とEVM指標を表示
 */
const ProgressView: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const [tabValue, setTabValue] = useState(0);
  const [baselineDialogOpen, setBaselineDialogOpen] = useState(false);

  const {
    projectEVM,
    baselines,
    currentBaseline,
    loading,
    error,
    currentProject,
    tasks,
  } = useSelector((state: RootState) => ({
    projectEVM: state.progress.projectEVM,
    baselines: state.progress.baselines,
    currentBaseline: state.progress.currentBaseline,
    loading: state.progress.loading,
    error: state.progress.error,
    currentProject: state.project.currentProject,
    tasks: state.task.items,
  }));

  useEffect(() => {
    if (projectId) {
      dispatch(calculateProjectEVM({ projectId }));
      dispatch(fetchProjectBaselines(projectId));
      dispatch(fetchProjectTasks(projectId));
    }
  }, [projectId, dispatch]);

  const handleRefresh = () => {
    if (projectId) {
      dispatch(calculateProjectEVM({ projectId }));
    }
  };

  const handleCreateBaseline = async (name: string, description: string) => {
    if (projectId) {
      try {
        await dispatch(createBaseline({
          projectId,
          name,
          description,
          createdBy: 'user',
        })).unwrap();
        setBaselineDialogOpen(false);
      } catch (error) {
        console.error('ベースライン作成エラー:', error);
      }
    }
  };

  const getStatusColor = (value: number, threshold: number = 1) => {
    if (value >= threshold) return 'success.main';
    if (value >= threshold * 0.9) return 'warning.main';
    return 'error.main';
  };

  const getVarianceIcon = (value: number) => {
    if (value > 0) return <TrendingUp color="success" />;
    if (value < 0) return <TrendingDown color="error" />;
    return <Remove />;
  };

  // タスク統計の計算
  const taskStats = React.useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const notStarted = tasks.filter(t => t.status === 'not_started').length;
    const overallProgress = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      overallProgress,
    };
  }, [tasks]);

  if (loading && !projectEVM) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, padding: 3 }}>
      {/* ページヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            進捗管理・EVM
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {currentProject?.name || 'プロジェクト'}の進捗状況とアーンドバリュー分析
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<SaveAlt />}
            onClick={() => setBaselineDialogOpen(true)}
          >
            ベースライン保存
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            更新
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* EVMメトリクスカード */}
      {projectEVM && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      CPI（コスト効率指標）
                    </Typography>
                    <Typography
                      variant="h4"
                      color={getStatusColor(projectEVM.cpi)}
                    >
                      {projectEVM.cpi.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {projectEVM.cpi >= 1 ? '予算内' : '予算超過'}
                    </Typography>
                  </Box>
                  <Assessment sx={{ fontSize: 48, color: getStatusColor(projectEVM.cpi), opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      SPI（スケジュール効率指標）
                    </Typography>
                    <Typography
                      variant="h4"
                      color={getStatusColor(projectEVM.spi)}
                    >
                      {projectEVM.spi.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {projectEVM.spi >= 1 ? '予定通り' : '遅延中'}
                    </Typography>
                  </Box>
                  <Timeline sx={{ fontSize: 48, color: getStatusColor(projectEVM.spi), opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  コスト差異（CV）
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getVarianceIcon(projectEVM.cv)}
                  <Typography
                    variant="h5"
                    color={projectEVM.cv >= 0 ? 'success.main' : 'error.main'}
                  >
                    ¥{projectEVM.cv.toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  EV - AC
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  スケジュール差異（SV）
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getVarianceIcon(projectEVM.sv)}
                  <Typography
                    variant="h5"
                    color={projectEVM.sv >= 0 ? 'success.main' : 'error.main'}
                  >
                    ¥{projectEVM.sv.toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  EV - PV
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 追加メトリクス */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  完成時総コスト見積（EAC）
                </Typography>
                <Typography variant="h5">
                  ¥{projectEVM.eac.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  予測完成時コスト
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  完成時コスト差異（VAC）
                </Typography>
                <Typography
                  variant="h5"
                  color={projectEVM.vac >= 0 ? 'success.main' : 'error.main'}
                >
                  ¥{projectEVM.vac.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  BAC - EAC
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  完成までの見積（ETC）
                </Typography>
                <Typography variant="h5">
                  ¥{projectEVM.etc.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  残作業コスト見積
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  残作業効率指標（TCPI）
                </Typography>
                <Typography
                  variant="h5"
                  color={getStatusColor(1 / projectEVM.tcpi)}
                >
                  {projectEVM.tcpi.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  必要効率
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* タブナビゲーション */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="EVMトレンド" />
          <Tab label="タスク進捗" />
          <Tab label="ベースライン" />
        </Tabs>

        {/* EVMトレンドタブ */}
        <TabPanel value={tabValue} index={0}>
          {projectEVM ? (
            <EVMTrendChart trends={[]} />
          ) : (
            <Alert severity="info">EVMデータがありません</Alert>
          )}
        </TabPanel>

        {/* タスク進捗タブ */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    総タスク数
                  </Typography>
                  <Typography variant="h4">{taskStats.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    完了
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {taskStats.completed}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    進行中
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {taskStats.inProgress}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    未開始
                  </Typography>
                  <Typography variant="h4" color="text.secondary">
                    {taskStats.notStarted}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              全体進捗
            </Typography>
            <LinearProgress
              variant="determinate"
              value={taskStats.overallProgress}
              sx={{ height: 10, borderRadius: 1 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {taskStats.overallProgress.toFixed(1)}% 完了
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>タスク名</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell align="right">進捗率</TableCell>
                  <TableCell align="right">物理進捗率</TableCell>
                  <TableCell align="right">予算</TableCell>
                  <TableCell align="right">実コスト</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.slice(0, 10).map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={task.status}
                        size="small"
                        color={
                          task.status === 'completed' ? 'success' :
                          task.status === 'in_progress' ? 'primary' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">{task.percentComplete}%</TableCell>
                    <TableCell align="right">{task.physicalPercentComplete}%</TableCell>
                    <TableCell align="right">¥{task.budgetedCost.toLocaleString()}</TableCell>
                    <TableCell align="right">¥{task.actualCost.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* ベースラインタブ */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              現在のベースライン
            </Typography>
            {currentBaseline ? (
              <Card>
                <CardContent>
                  <Typography variant="h6">{currentBaseline.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentBaseline.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    作成日: {format(new Date(currentBaseline.createdAt), 'yyyy年MM月dd日', { locale: ja })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    タスク数: {currentBaseline.tasks.length}
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">ベースラインが設定されていません</Alert>
            )}
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            過去のベースライン
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>名前</TableCell>
                  <TableCell>説明</TableCell>
                  <TableCell>タスク数</TableCell>
                  <TableCell>作成日</TableCell>
                  <TableCell>作成者</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {baselines.map((baseline) => (
                  <TableRow
                    key={baseline.id}
                    hover
                    onClick={() => dispatch(setCurrentBaseline(baseline))}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{baseline.name}</TableCell>
                    <TableCell>{baseline.description}</TableCell>
                    <TableCell>{baseline.tasks.length}</TableCell>
                    <TableCell>
                      {format(new Date(baseline.createdAt), 'yyyy/MM/dd', { locale: ja })}
                    </TableCell>
                    <TableCell>{baseline.createdBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* ベースライン作成ダイアログ */}
      <BaselineDialog
        open={baselineDialogOpen}
        projectId={projectId || ''}
        tasks={tasks}
        onClose={() => setBaselineDialogOpen(false)}
        onSave={handleCreateBaseline}
      />
    </Box>
  );
};

export default ProgressView;
