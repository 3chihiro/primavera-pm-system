import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { generateResourceUtilizationSummary } from '../../utils/resourceCalculator';

interface ResourceUtilizationReportProps {
  projectId: string;
}

/**
 * リソース使用率レポートコンポーネント
 */
const ResourceUtilizationReport: React.FC<ResourceUtilizationReportProps> = ({ projectId }) => {
  const { items: resources } = useSelector((state: RootState) => state.resource);
  const { items: tasks } = useSelector((state: RootState) => state.task);

  // プロジェクトの開始日・終了日を取得
  const { projectStartDate, projectEndDate } = useMemo(() => {
    if (tasks.length === 0) {
      return {
        projectStartDate: new Date(),
        projectEndDate: new Date(),
      };
    }

    const startDates = tasks
      .map(t => new Date(t.plannedStartDate))
      .sort((a, b) => a.getTime() - b.getTime());

    const endDates = tasks
      .map(t => new Date(t.plannedEndDate))
      .sort((a, b) => b.getTime() - a.getTime());

    return {
      projectStartDate: startDates[0],
      projectEndDate: endDates[0],
    };
  }, [tasks]);

  // 使用率サマリーを生成
  const utilizationSummary = useMemo(() => {
    return generateResourceUtilizationSummary(
      resources,
      tasks,
      projectStartDate,
      projectEndDate
    );
  }, [resources, tasks, projectStartDate, projectEndDate]);

  // 統計情報を計算
  const statistics = useMemo(() => {
    if (utilizationSummary.length === 0) {
      return {
        averageUtilization: 0,
        overallocatedCount: 0,
        underutilizedCount: 0,
        optimalCount: 0,
      };
    }

    const totalUtilization = utilizationSummary.reduce(
      (sum, item) => sum + item.utilizationRate,
      0
    );
    const averageUtilization = Math.round(totalUtilization / utilizationSummary.length);

    const overallocatedCount = utilizationSummary.filter(
      item => item.utilizationRate > 100
    ).length;

    const underutilizedCount = utilizationSummary.filter(
      item => item.utilizationRate < 70 && item.utilizationRate > 0
    ).length;

    const optimalCount = utilizationSummary.filter(
      item => item.utilizationRate >= 70 && item.utilizationRate <= 100
    ).length;

    return {
      averageUtilization,
      overallocatedCount,
      underutilizedCount,
      optimalCount,
    };
  }, [utilizationSummary]);

  // 利用率に応じた色を取得
  const getUtilizationColor = (rate: number): 'error' | 'warning' | 'success' | 'default' => {
    if (rate > 100) return 'error';
    if (rate >= 90) return 'warning';
    if (rate >= 70) return 'success';
    return 'default';
  };

  // 利用率に応じたアイコンを取得
  const getUtilizationIcon = (rate: number) => {
    if (rate > 100) return <ErrorIcon color="error" fontSize="small" />;
    if (rate >= 90) return <WarningIcon color="warning" fontSize="small" />;
    if (rate >= 70) return <CheckCircleIcon color="success" fontSize="small" />;
    return null;
  };

  // 利用率に応じたステータスラベル
  const getUtilizationStatus = (rate: number): string => {
    if (rate > 100) return '過負荷';
    if (rate >= 90) return '高負荷';
    if (rate >= 70) return '最適';
    if (rate > 0) return '低稼働';
    return '未割り当て';
  };

  if (resources.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          リソースが登録されていません
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* サマリーカード */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            平均利用率
          </Typography>
          <Typography variant="h4" color="primary">
            {statistics.averageUtilization}%
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            過負荷リソース
          </Typography>
          <Typography variant="h4" color="error.main">
            {statistics.overallocatedCount}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            最適リソース
          </Typography>
          <Typography variant="h4" color="success.main">
            {statistics.optimalCount}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            低稼働リソース
          </Typography>
          <Typography variant="h4" color="text.secondary">
            {statistics.underutilizedCount}
          </Typography>
        </Paper>
      </Box>

      {/* 警告メッセージ */}
      {statistics.overallocatedCount > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {statistics.overallocatedCount}件のリソースが過負荷状態です。
          リソース平準化または追加リソースの確保を検討してください。
        </Alert>
      )}

      {statistics.underutilizedCount > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {statistics.underutilizedCount}件のリソースが低稼働状態です。
          より効率的な割り当てを検討してください。
        </Alert>
      )}

      {/* 詳細テーブル */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>リソース名</TableCell>
              <TableCell align="right">割り当て時間</TableCell>
              <TableCell align="right">利用可能時間</TableCell>
              <TableCell align="center" width={200}>利用率</TableCell>
              <TableCell align="center">ステータス</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {utilizationSummary.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    データがありません
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              utilizationSummary
                .sort((a, b) => b.utilizationRate - a.utilizationRate)
                .map((item) => (
                  <TableRow
                    key={item.resourceId}
                    sx={{
                      backgroundColor: item.isOverallocated ? '#ffebee' : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getUtilizationIcon(item.utilizationRate)}
                        <Typography variant="body2" fontWeight="medium">
                          {item.resourceName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {item.allocatedHours.toFixed(1)}h
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {item.availableHours.toFixed(1)}h
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={
                              item.utilizationRate > 100
                                ? 'error'
                                : item.utilizationRate >= 90
                                ? 'warning.main'
                                : 'inherit'
                            }
                            sx={{ minWidth: 50 }}
                          >
                            {item.utilizationRate}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(item.utilizationRate, 100)}
                          color={getUtilizationColor(item.utilizationRate)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getUtilizationStatus(item.utilizationRate)}
                        color={getUtilizationColor(item.utilizationRate)}
                        size="small"
                        variant={item.isOverallocated ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ResourceUtilizationReport;
