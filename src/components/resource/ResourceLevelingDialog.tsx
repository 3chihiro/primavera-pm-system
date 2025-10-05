import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  performResourceLeveling,
  generateLevelingSummary,
  analyzeResourceOverallocation,
} from '../../utils/resourceLeveling';
import { format } from 'date-fns';

interface ResourceLevelingDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (adjustedTasks: any[]) => void;
}

/**
 * リソースレベリングダイアログ
 */
const ResourceLevelingDialog: React.FC<ResourceLevelingDialogProps> = ({
  open,
  onClose,
  onApply,
}) => {
  const { items: tasks } = useSelector((state: RootState) => state.task);
  const { items: resources } = useSelector((state: RootState) => state.resource);

  const [strategy, setStrategy] = useState<'minimize_delay' | 'balance_load' | 'critical_path_first'>('minimize_delay');
  const [maxDelay, setMaxDelay] = useState(30);
  const [respectCriticalPath, setRespectCriticalPath] = useState(true);
  const [previewResult, setPreviewResult] = useState<any>(null);

  // 過負荷分析
  const overallocationAnalysis = useMemo(() => {
    return analyzeResourceOverallocation(tasks, resources);
  }, [tasks, resources]);

  // プレビュー実行
  const handlePreview = () => {
    const result = performResourceLeveling(tasks, resources, {
      strategy,
      maxDelay,
      respectCriticalPath,
    });

    setPreviewResult(result);
  };

  // 適用
  const handleApply = () => {
    if (previewResult) {
      onApply(previewResult.adjustedTasks);
      onClose();
    }
  };

  // サマリー計算
  const summary = previewResult ? generateLevelingSummary(previewResult) : null;

  const getStrategyLabel = (strat: string): string => {
    const labels: Record<string, string> = {
      minimize_delay: '遅延最小化',
      balance_load: '負荷分散',
      critical_path_first: 'クリティカルパス優先',
    };
    return labels[strat] || strat;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>リソースレベリング</DialogTitle>
      <DialogContent dividers>
        {/* 過負荷分析 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            過負荷リソース分析
          </Typography>

          {overallocationAnalysis.length === 0 ? (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              過負荷リソースは検出されませんでした
            </Alert>
          ) : (
            <>
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                {overallocationAnalysis.length}件の過負荷リソースが検出されました
              </Alert>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>リソース名</TableCell>
                      <TableCell align="right">過負荷日数</TableCell>
                      <TableCell align="right">最大負荷</TableCell>
                      <TableCell align="right">平均負荷</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {overallocationAnalysis.map((analysis) => (
                      <TableRow key={analysis.resourceId}>
                        <TableCell>{analysis.resourceName}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${analysis.overallocationDays}日`}
                            size="small"
                            color="error"
                          />
                        </TableCell>
                        <TableCell align="right">{Math.round(analysis.maxOverload)}%</TableCell>
                        <TableCell align="right">{Math.round(analysis.averageOverload)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>

        {/* レベリング設定 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            レベリング設定
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>レベリング戦略</InputLabel>
              <Select
                value={strategy}
                label="レベリング戦略"
                onChange={(e) => setStrategy(e.target.value as any)}
              >
                <MenuItem value="minimize_delay">
                  遅延最小化 - タスクの遅延を最小限に抑える
                </MenuItem>
                <MenuItem value="balance_load">
                  負荷分散 - リソースの負荷を均等に分散
                </MenuItem>
                <MenuItem value="critical_path_first">
                  クリティカルパス優先 - クリティカルパスを保護
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              type="number"
              label="最大遅延日数"
              value={maxDelay}
              onChange={(e) => setMaxDelay(Number(e.target.value))}
              inputProps={{ min: 1, max: 365 }}
              helperText="タスクを遅延できる最大日数"
              fullWidth
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={respectCriticalPath}
                  onChange={(e) => setRespectCriticalPath(e.target.checked)}
                />
              }
              label="クリティカルパスのタスクを遅延させない"
            />

            <Button
              variant="outlined"
              onClick={handlePreview}
              disabled={overallocationAnalysis.length === 0}
              fullWidth
            >
              プレビュー実行
            </Button>
          </Box>
        </Box>

        {/* プレビュー結果 */}
        {previewResult && (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              プレビュー結果
            </Typography>

            {/* サマリー */}
            {summary && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    調整タスク数
                  </Typography>
                  <Typography variant="h6">{summary.totalAdjustments}件</Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    総遅延日数
                  </Typography>
                  <Typography variant="h6">{summary.totalDelay}日</Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    残存過負荷
                  </Typography>
                  <Typography variant="h6" color={summary.remainingOverallocations === 0 ? 'success.main' : 'error.main'}>
                    {summary.remainingOverallocations}件
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    成功率
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">{summary.successRate}%</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={summary.successRate}
                      sx={{ flex: 1, height: 6, borderRadius: 3 }}
                      color={summary.successRate === 100 ? 'success' : 'warning'}
                    />
                  </Box>
                </Paper>
              </Box>
            )}

            {/* 調整されたタスク一覧 */}
            {previewResult.adjustedTasks.length > 0 && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>タスク</TableCell>
                      <TableCell>元の開始日</TableCell>
                      <TableCell>新しい開始日</TableCell>
                      <TableCell align="right">遅延日数</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewResult.adjustedTasks.map((adj: any, index: number) => {
                      const task = tasks.find(t => t.id === adj.taskId);
                      return (
                        <TableRow key={index}>
                          <TableCell>{task?.name || adj.taskId}</TableCell>
                          <TableCell>{format(adj.originalStart, 'yyyy/MM/dd')}</TableCell>
                          <TableCell>{format(adj.newStart, 'yyyy/MM/dd')}</TableCell>
                          <TableCell align="right">
                            <Chip label={`+${adj.delay}日`} size="small" color="warning" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {previewResult.adjustedTasks.length === 0 && (
              <Alert severity="info">
                調整の必要なタスクはありません
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={!previewResult || previewResult.adjustedTasks.length === 0}
          startIcon={<TrendingUpIcon />}
        >
          適用
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResourceLevelingDialog;
