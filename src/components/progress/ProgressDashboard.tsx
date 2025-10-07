import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { generateProjectEVMSummary } from '../../utils/evmCalculator';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 進捗ダッシュボード
 * プロジェクトの進捗状況とEVM指標を表示
 */
const ProgressDashboard: React.FC = () => {
  const { items: tasks } = useSelector((state: RootState) => state.task);
  const currentProject = useSelector((state: RootState) => state.project.currentProject);

  // EVMサマリーを計算
  const evmSummary = useMemo(() => {
    if (!currentProject || tasks.length === 0) {
      return null;
    }

    // TODO: ベースラインデータを取得
    const baseline = undefined;

    return generateProjectEVMSummary(
      currentProject.id,
      currentProject.name,
      tasks,
      baseline,
      new Date()
    );
  }, [tasks, currentProject]);

  if (!evmSummary) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          プロジェクトとタスクデータが必要です
        </Alert>
      </Box>
    );
  }

  const { metrics, projectStatus, scheduleStatus, costStatus } = evmSummary;

  // ステータスアイコンと色の取得
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
      case 'on_track':
      case 'on_budget':
      case 'ahead':
      case 'under_budget':
        return <CheckCircleIcon color="success" />;
      case 'yellow':
        return <WarningIcon color="warning" />;
      case 'red':
      case 'behind':
      case 'over_budget':
        return <ErrorIcon color="error" />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'green':
      case 'on_track':
      case 'on_budget':
      case 'ahead':
      case 'under_budget':
        return 'success';
      case 'yellow':
        return 'warning';
      case 'red':
      case 'behind':
      case 'over_budget':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      green: '正常',
      yellow: '注意',
      red: '警告',
      ahead: '先行',
      on_track: '順調',
      behind: '遅延',
      under_budget: '予算内',
      on_budget: '予算通り',
      over_budget: '予算超過',
    };
    return labels[status] || status;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          進捗ダッシュボード
        </Typography>
        <Typography variant="body2" color="text.secondary">
          基準日: {format(evmSummary.statusDate, 'yyyy年M月d日(E)', { locale: ja })}
        </Typography>
      </Box>

      {/* プロジェクトステータスカード */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {getStatusIcon(projectStatus)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  プロジェクト状態
                </Typography>
              </Box>
              <Chip
                label={getStatusLabel(projectStatus)}
                color={getStatusColor(projectStatus)}
                size="large"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  スケジュール
                </Typography>
              </Box>
              <Chip
                label={getStatusLabel(scheduleStatus)}
                color={getStatusColor(scheduleStatus)}
                size="large"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                SPI: {metrics.spi.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  コスト
                </Typography>
              </Box>
              <Chip
                label={getStatusLabel(costStatus)}
                color={getStatusColor(costStatus)}
                size="large"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                CPI: {metrics.cpi.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 全体進捗 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          全体進捗
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              完了率
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h4">{Math.round(evmSummary.overallProgress)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={evmSummary.overallProgress}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              完了タスク
            </Typography>
            <Typography variant="h4">
              {evmSummary.completedTasks} / {evmSummary.totalTasks}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              実行中: {evmSummary.inProgressTasks} | 未開始: {evmSummary.notStartedTasks}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              スケジュール進捗
            </Typography>
            <Typography variant="h4">{Math.round(evmSummary.scheduleProgress)}%</Typography>
            <LinearProgress
              variant="determinate"
              value={evmSummary.scheduleProgress}
              color={scheduleStatus === 'on_track' ? 'primary' : 'error'}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* EVM指標 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          EVM指標
        </Typography>
        <Grid container spacing={2}>
          {/* 基本値 */}
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              PV（計画値）
            </Typography>
            <Typography variant="h5">
              ¥{metrics.pv.toLocaleString()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              EV（出来高）
            </Typography>
            <Typography variant="h5">
              ¥{metrics.ev.toLocaleString()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              AC（実コスト）
            </Typography>
            <Typography variant="h5">
              ¥{metrics.ac.toLocaleString()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              BAC（完成時総予算）
            </Typography>
            <Typography variant="h5">
              ¥{metrics.bac.toLocaleString()}
            </Typography>
          </Grid>

          {/* 差異 */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                CV（コスト差異）:
              </Typography>
              <Typography
                variant="h6"
                color={metrics.cv >= 0 ? 'success.main' : 'error.main'}
              >
                {metrics.cv >= 0 ? '+' : ''}¥{metrics.cv.toLocaleString()}
              </Typography>
              {metrics.cv >= 0 ? (
                <TrendingUpIcon color="success" />
              ) : (
                <TrendingDownIcon color="error" />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                SV（スケジュール差異）:
              </Typography>
              <Typography
                variant="h6"
                color={metrics.sv >= 0 ? 'success.main' : 'error.main'}
              >
                {metrics.sv >= 0 ? '+' : ''}¥{metrics.sv.toLocaleString()}
              </Typography>
              {metrics.sv >= 0 ? (
                <TrendingUpIcon color="success" />
              ) : (
                <TrendingDownIcon color="error" />
              )}
            </Box>
          </Grid>

          {/* 予測値 */}
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              ETC（完成までの見積もり）
            </Typography>
            <Typography variant="body1">
              ¥{metrics.etc.toLocaleString()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              EAC（完成時総コスト見積もり）
            </Typography>
            <Typography variant="body1">
              ¥{metrics.eac.toLocaleString()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              VAC（完成時コスト差異）
            </Typography>
            <Typography
              variant="body1"
              color={metrics.vac >= 0 ? 'success.main' : 'error.main'}
            >
              {metrics.vac >= 0 ? '+' : ''}¥{metrics.vac.toLocaleString()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              TCPI（残作業効率指標）
            </Typography>
            <Typography variant="body1">
              {metrics.tcpi.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProgressDashboard;
