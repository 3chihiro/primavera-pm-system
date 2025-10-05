import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Resource } from '../../types/resource';
import { generateResourceHistogram } from '../../utils/resourceCalculator';
import { format } from 'date-fns';

interface ResourceHistogramProps {
  projectId: string;
}

/**
 * リソースヒストグラム表示コンポーネント
 */
const ResourceHistogram: React.FC<ResourceHistogramProps> = ({ projectId }) => {
  const { items: resources } = useSelector((state: RootState) => state.resource);
  const { items: tasks } = useSelector((state: RootState) => state.task);

  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month'>('week');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // プロジェクトの開始日・終了日を取得（仮）
  const projectStartDate = useMemo(() => {
    if (tasks.length === 0) return new Date();
    const dates = tasks
      .map(t => new Date(t.plannedStartDate))
      .sort((a, b) => a.getTime() - b.getTime());
    return dates[0];
  }, [tasks]);

  const projectEndDate = useMemo(() => {
    if (tasks.length === 0) return new Date();
    const dates = tasks
      .map(t => new Date(t.plannedEndDate))
      .sort((a, b) => b.getTime() - a.getTime());
    return dates[0];
  }, [tasks]);

  // ヒストグラムデータを生成
  const histogramData = useMemo(() => {
    if (!selectedResourceId) return null;

    const resource = resources.find(r => r.id === selectedResourceId);
    if (!resource) return null;

    return generateResourceHistogram(
      resource,
      tasks,
      projectStartDate,
      projectEndDate,
      periodType
    );
  }, [selectedResourceId, resources, tasks, projectStartDate, projectEndDate, periodType]);

  // チャート用データの整形
  const chartData = useMemo(() => {
    if (!histogramData) return [];

    return histogramData.periods.map(period => ({
      period: format(period.startDate, periodType === 'day' ? 'M/d' : periodType === 'week' ? 'M/d' : 'yyyy/MM'),
      allocated: period.allocatedHours,
      available: period.availableHours,
      utilization: period.utilizationRate,
      isOverallocated: period.isOverallocated,
    }));
  }, [histogramData, periodType]);

  const handleResourceChange = (event: any) => {
    setSelectedResourceId(event.target.value);
  };

  const handlePeriodTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriodType: 'day' | 'week' | 'month' | null,
  ) => {
    if (newPeriodType !== null) {
      setPeriodType(newPeriodType);
    }
  };

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newViewMode: 'chart' | 'table' | null,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ padding: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {data.period}
          </Typography>
          <Typography variant="body2" color="primary">
            割り当て: {data.allocated}h
          </Typography>
          <Typography variant="body2" color="text.secondary">
            利用可能: {data.available}h
          </Typography>
          <Typography variant="body2" color={data.isOverallocated ? 'error' : 'success.main'}>
            利用率: {data.utilization}%
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // チャート表示
  const renderChart = () => {
    if (!histogramData || chartData.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            リソースを選択してください
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        {/* サマリー情報 */}
        <Box sx={{ mb: 3, display: 'flex', gap: 4 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              総割り当て時間
            </Typography>
            <Typography variant="h6" color="primary">
              {histogramData.totalAllocatedHours}h
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              総利用可能時間
            </Typography>
            <Typography variant="h6">
              {histogramData.totalAvailableHours}h
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              平均利用率
            </Typography>
            <Typography
              variant="h6"
              color={histogramData.utilizationRate > 100 ? 'error' : 'success.main'}
            >
              {histogramData.utilizationRate}%
            </Typography>
          </Box>
          {histogramData.overallocationPeriods.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                過負荷期間
              </Typography>
              <Typography variant="h6" color="error">
                {histogramData.overallocationPeriods.length}期間
              </Typography>
            </Box>
          )}
        </Box>

        {/* グラフ */}
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis label={{ value: '時間 (h)', angle: -90, position: 'insideLeft' }} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="allocated" name="割り当て時間" fill="#1976d2">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isOverallocated ? '#d32f2f' : '#1976d2'} />
              ))}
            </Bar>
            <Bar dataKey="available" name="利用可能時間" fill="#90caf9" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  // テーブル表示
  const renderTable = () => {
    if (!histogramData) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            リソースを選択してください
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>期間</TableCell>
              <TableCell align="right">割り当て時間</TableCell>
              <TableCell align="right">利用可能時間</TableCell>
              <TableCell align="right">利用率</TableCell>
              <TableCell>タスク内訳</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {histogramData.periods.map((period, index) => (
              <TableRow key={index} sx={{ backgroundColor: period.isOverallocated ? '#ffebee' : 'inherit' }}>
                <TableCell>
                  {format(period.startDate, 'yyyy/MM/dd')}
                  {period.startDate.getTime() !== period.endDate.getTime() &&
                    ` - ${format(period.endDate, 'yyyy/MM/dd')}`}
                </TableCell>
                <TableCell align="right">{period.allocatedHours}h</TableCell>
                <TableCell align="right">{period.availableHours}h</TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    color={period.isOverallocated ? 'error' : 'inherit'}
                    fontWeight={period.isOverallocated ? 'bold' : 'normal'}
                  >
                    {period.utilizationRate}%
                  </Typography>
                </TableCell>
                <TableCell>
                  {period.tasks.map((task, taskIndex) => (
                    <Typography key={taskIndex} variant="caption" display="block">
                      {task.taskName}: {task.hours}h
                    </Typography>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      {/* コントロール */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>リソース選択</InputLabel>
          <Select
            value={selectedResourceId}
            label="リソース選択"
            onChange={handleResourceChange}
          >
            <MenuItem value="">
              <em>選択してください</em>
            </MenuItem>
            {resources.map(resource => (
              <MenuItem key={resource.id} value={resource.id}>
                {resource.code} - {resource.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={periodType}
          exclusive
          onChange={handlePeriodTypeChange}
          aria-label="期間タイプ"
          size="small"
        >
          <ToggleButton value="day" aria-label="日次">
            日次
          </ToggleButton>
          <ToggleButton value="week" aria-label="週次">
            週次
          </ToggleButton>
          <ToggleButton value="month" aria-label="月次">
            月次
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flexGrow: 1 }} />

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="表示モード"
          size="small"
        >
          <ToggleButton value="chart" aria-label="グラフ">
            グラフ
          </ToggleButton>
          <ToggleButton value="table" aria-label="テーブル">
            テーブル
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* コンテンツ */}
      <Paper sx={{ p: 3 }}>
        {viewMode === 'chart' ? renderChart() : renderTable()}
      </Paper>
    </Box>
  );
};

export default ResourceHistogram;
