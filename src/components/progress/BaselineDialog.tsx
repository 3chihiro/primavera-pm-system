import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
import { Task } from '../../types/task';
import { Baseline, BaselineTask } from '../../types/progress';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface BaselineDialogProps {
  open: boolean;
  projectId: string;
  tasks?: Task[];
  currentBaseline?: Baseline;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}

/**
 * ベースライン管理ダイアログ
 * プロジェクトのベースラインを作成・保存
 */
const BaselineDialog: React.FC<BaselineDialogProps> = ({
  open,
  projectId,
  tasks = [],
  currentBaseline,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      alert('ベースライン名を入力してください');
      return;
    }

    onSave(name.trim(), description.trim());
    setName('');
    setDescription('');
  };

  // 統計情報を計算
  const totalTasks = tasks?.length || 0;
  const totalDuration = tasks?.reduce((sum, t) => sum + t.duration, 0) || 0;
  const totalCost = tasks?.reduce((sum, t) => sum + (t.budgetedCost || 0), 0) || 0;
  const earliestStart = tasks?.reduce(
    (earliest, t) =>
      !earliest || new Date(t.plannedStartDate) < earliest
        ? new Date(t.plannedStartDate)
        : earliest,
    null as Date | null
  ) || null;
  const latestEnd = tasks?.reduce(
    (latest, t) =>
      !latest || new Date(t.plannedEndDate) > latest
        ? new Date(t.plannedEndDate)
        : latest,
    null as Date | null
  ) || null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SaveIcon />
          <Typography variant="h6">ベースライン保存</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 基本情報入力 */}
          <Box>
            <TextField
              label="ベースライン名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              placeholder="例: 初期計画、第1回見直し後"
              helperText="このベースラインを識別するための名前"
            />
          </Box>

          <Box>
            <TextField
              label="説明"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="このベースラインの背景や目的を記載"
            />
          </Box>

          {/* 現在のベースライン情報 */}
          {currentBaseline && (
            <Alert severity="info">
              <Typography variant="body2" fontWeight="bold">
                現在のベースライン: {currentBaseline.name}
              </Typography>
              <Typography variant="caption">
                作成日: {format(currentBaseline.createdAt, 'yyyy年M月d日', { locale: ja })}
              </Typography>
            </Alert>
          )}

          {/* プロジェクトサマリー */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              保存されるプロジェクト情報
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>タスク数</TableCell>
                    <TableCell align="right">
                      <Chip label={`${totalTasks}件`} size="small" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>総工数</TableCell>
                    <TableCell align="right">{totalDuration}日</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>総予算</TableCell>
                    <TableCell align="right">¥{totalCost.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>開始日</TableCell>
                    <TableCell align="right">
                      {earliestStart
                        ? format(earliestStart, 'yyyy年M月d日', { locale: ja })
                        : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>終了日</TableCell>
                    <TableCell align="right">
                      {latestEnd ? format(latestEnd, 'yyyy年M月d日', { locale: ja }) : '-'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* 警告メッセージ */}
          <Alert severity="warning">
            <Typography variant="body2">
              ベースラインを保存すると、現在のタスク情報（開始日、終了日、工数、予算）がスナップショットとして記録されます。
              <br />
              ベースラインは後から変更できないため、慎重に保存してください。
            </Typography>
          </Alert>

          {/* タスクプレビュー（最初の5件） */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              タスクプレビュー（最初の5件）
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>WBS</TableCell>
                    <TableCell>タスク名</TableCell>
                    <TableCell align="right">工数</TableCell>
                    <TableCell align="right">予算</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.slice(0, 5).map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.wbsCode}</TableCell>
                      <TableCell>{task.name}</TableCell>
                      <TableCell align="right">{task.duration}日</TableCell>
                      <TableCell align="right">
                        ¥{(task.budgetedCost || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {tasks.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="caption" color="text.secondary">
                          ...他 {tasks.length - 5}件
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={!name.trim()}
        >
          ベースラインを保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BaselineDialog;
