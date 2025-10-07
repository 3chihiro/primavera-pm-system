import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Slider,
  FormControl,
  InputLabel,
  InputAdornment,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { Task } from '../../types/task';
import { ProgressUpdate } from '../../types/progress';

interface ProgressUpdateDialogProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (update: ProgressUpdate) => void;
}

/**
 * 進捗入力ダイアログ
 * タスクの進捗情報を入力
 */
const ProgressUpdateDialog: React.FC<ProgressUpdateDialogProps> = ({
  open,
  task,
  onClose,
  onSave,
}) => {
  const [percentComplete, setPercentComplete] = useState(0);
  const [physicalPercentComplete, setPhysicalPercentComplete] = useState(0);
  const [actualStartDate, setActualStartDate] = useState<Date | null>(null);
  const [actualEndDate, setActualEndDate] = useState<Date | null>(null);
  const [remainingDuration, setRemainingDuration] = useState(0);
  const [actualCost, setActualCost] = useState(0);
  const [notes, setNotes] = useState('');

  // タスクが変更されたら初期値を設定
  useEffect(() => {
    if (task) {
      setPercentComplete(task.percentComplete || 0);
      setPhysicalPercentComplete(task.physicalPercentComplete || task.percentComplete || 0);
      setActualStartDate(task.actualStartDate ? new Date(task.actualStartDate) : null);
      setActualEndDate(task.actualEndDate ? new Date(task.actualEndDate) : null);
      setRemainingDuration(task.remainingDuration || task.duration);
      setActualCost(task.actualCost || 0);
      setNotes('');
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;

    const update: ProgressUpdate = {
      taskId: task.id,
      percentComplete,
      physicalPercentComplete,
      actualStartDate: actualStartDate || undefined,
      actualEndDate: actualEndDate || undefined,
      remainingDuration,
      actualCost,
      notes: notes.trim() || undefined,
      updateDate: new Date(),
    };

    onSave(update);
    onClose();
  };

  const handlePercentCompleteChange = (value: number) => {
    setPercentComplete(value);
    // 進捗率が100%になったら実績終了日を今日に設定
    if (value >= 100 && !actualEndDate) {
      setActualEndDate(new Date());
      setRemainingDuration(0);
    }
    // 進捗率が0より大きくなったら実績開始日を今日に設定（未設定の場合）
    if (value > 0 && !actualStartDate) {
      setActualStartDate(new Date());
    }
  };

  if (!task) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>進捗更新 - {task.name}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* タスク情報 */}
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  WBSコード: {task.wbsCode} | タイプ: {task.type}
                </Typography>
                <Typography variant="body2">
                  計画期間: {new Date(task.plannedStartDate).toLocaleDateString()} 〜{' '}
                  {new Date(task.plannedEndDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  計画工数: {task.duration}日 | 予算: ¥{task.budgetedCost?.toLocaleString() || 0}
                </Typography>
              </Alert>
            </Grid>

            {/* 進捗率（スケジュール進捗） */}
            <Grid item xs={12}>
              <Typography gutterBottom>
                進捗率（スケジュール）: {percentComplete}%
              </Typography>
              <Slider
                value={percentComplete}
                onChange={(_, value) => handlePercentCompleteChange(value as number)}
                valueLabelDisplay="auto"
                step={5}
                marks
                min={0}
                max={100}
              />
            </Grid>

            {/* 物理進捗率（実際の出来高） */}
            <Grid item xs={12}>
              <Typography gutterBottom>
                物理進捗率（実際の出来高）: {physicalPercentComplete}%
              </Typography>
              <Slider
                value={physicalPercentComplete}
                onChange={(_, value) => setPhysicalPercentComplete(value as number)}
                valueLabelDisplay="auto"
                step={5}
                marks
                min={0}
                max={100}
              />
              <Typography variant="caption" color="text.secondary">
                ※ EVMのEV計算に使用されます
              </Typography>
            </Grid>

            {/* 実績開始日 */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="実績開始日"
                value={actualStartDate}
                onChange={(date) => setActualStartDate(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: '実際にタスクを開始した日付',
                  },
                }}
              />
            </Grid>

            {/* 実績終了日 */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="実績終了日"
                value={actualEndDate}
                onChange={(date) => setActualEndDate(date)}
                disabled={percentComplete < 100}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: percentComplete < 100 ? '進捗100%で入力可能' : '実際にタスクが完了した日付',
                  },
                }}
              />
            </Grid>

            {/* 残作業日数 */}
            <Grid item xs={12} md={6}>
              <TextField
                type="number"
                label="残作業日数"
                value={remainingDuration}
                onChange={(e) => setRemainingDuration(Number(e.target.value))}
                fullWidth
                inputProps={{ min: 0, step: 0.5 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">日</InputAdornment>,
                }}
                helperText="タスク完了までに残っている作業日数"
              />
            </Grid>

            {/* 実コスト */}
            <Grid item xs={12} md={6}>
              <TextField
                type="number"
                label="実コスト（AC）"
                value={actualCost}
                onChange={(e) => setActualCost(Number(e.target.value))}
                fullWidth
                inputProps={{ min: 0, step: 1000 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                }}
                helperText="実際に発生したコスト"
              />
            </Grid>

            {/* 備考 */}
            <Grid item xs={12}>
              <TextField
                label="備考"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="進捗更新に関する備考やコメントを入力"
              />
            </Grid>

            {/* 計算結果プレビュー */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  更新プレビュー
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      スケジュール進捗: {percentComplete}% → {physicalPercentComplete}%（EV用）
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      残作業: {remainingDuration}日
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      実コスト: ¥{actualCost.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      ステータス:{' '}
                      {percentComplete === 0
                        ? '未開始'
                        : percentComplete >= 100
                        ? '完了'
                        : '実行中'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ProgressUpdateDialog;
