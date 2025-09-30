import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { GanttTask, GanttSettings } from '../../types/gantt';
import { dateToX, calculateTaskWidth } from '../../utils/ganttUtils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface GanttTaskBarProps {
  task: GanttTask;
  timeRangeStart: Date;
  pixelsPerDay: number;
  rowHeight: number;
  settings: GanttSettings;
  onTaskClick?: (task: GanttTask) => void;
  onTaskDoubleClick?: (task: GanttTask) => void;
}

/**
 * ガントチャートのタスクバー表示コンポーネント
 * タスクの期間・進捗・タイプに応じた視覚的表示
 */
const GanttTaskBar: React.FC<GanttTaskBarProps> = ({
  task,
  timeRangeStart,
  pixelsPerDay,
  rowHeight,
  settings,
  onTaskClick,
  onTaskDoubleClick
}) => {
  // タスクバーの位置と幅を計算
  const x = dateToX(task.startDate, timeRangeStart, pixelsPerDay);
  const width = calculateTaskWidth(task.startDate, task.endDate, pixelsPerDay);

  // タスクタイプに応じた色を取得
  const getTaskColor = (): string => {
    if (task.color) return task.color;
    if (task.isCritical) return settings.colors.criticalPath;

    switch (task.type) {
      case 'milestone':
        return settings.colors.milestoneBar;
      case 'summary':
        return settings.colors.summaryBar;
      default:
        return settings.colors.taskBar;
    }
  };

  const taskColor = getTaskColor();
  const progressColor = settings.colors.progressBar;

  // マイルストーンの場合はダイアモンド形状で表示
  if (task.type === 'milestone') {
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {task.name}
            </Typography>
            <Typography variant="caption">
              {format(task.startDate, 'yyyy年M月d日', { locale: ja })}
            </Typography>
          </Box>
        }
        arrow
      >
        <Box
          onClick={() => onTaskClick?.(task)}
          onDoubleClick={() => onTaskDoubleClick?.(task)}
          sx={{
            position: 'absolute',
            left: `${x}px`,
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)',
            width: `${rowHeight * 0.5}px`,
            height: `${rowHeight * 0.5}px`,
            backgroundColor: taskColor,
            border: `2px solid ${taskColor}`,
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-50%) rotate(45deg) scale(1.2)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            },
          }}
        />
      </Tooltip>
    );
  }

  // サマリータスクの場合は両端に三角形を表示
  const isSummary = task.type === 'summary';

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {task.name}
          </Typography>
          <Typography variant="caption">
            {format(task.startDate, 'yyyy年M月d日', { locale: ja })} 〜{' '}
            {format(task.endDate, 'yyyy年M月d日', { locale: ja })}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
            進捗: {task.progress}%
          </Typography>
        </Box>
      }
      arrow
    >
      <Box
        onClick={() => onTaskClick?.(task)}
        onDoubleClick={() => onTaskDoubleClick?.(task)}
        sx={{
          position: 'absolute',
          left: `${x}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${width}px`,
          height: `${isSummary ? rowHeight * 0.4 : rowHeight * 0.6}px`,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* メインバー */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: taskColor,
            borderRadius: isSummary ? '4px' : '4px',
            border: task.isSelected ? '2px solid #1976d2' : 'none',
            boxShadow: task.isSelected
              ? '0 4px 8px rgba(25, 118, 210, 0.3)'
              : '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
            overflow: 'hidden',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              filter: 'brightness(1.1)',
            },
          }}
        >
          {/* 進捗バー */}
          {!isSummary && task.progress > 0 && (
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${task.progress}%`,
                backgroundColor: progressColor,
                transition: 'width 0.3s',
              }}
            />
          )}

          {/* タスク名表示（幅が十分にある場合のみ） */}
          {width > 100 && (
            <Typography
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '12px',
                color: '#ffffff',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: `${width - 16}px`,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {task.name}
            </Typography>
          )}
        </Box>

        {/* サマリータスクの三角形マーカー */}
        {isSummary && (
          <>
            {/* 左側の三角形 */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                bottom: -4,
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${taskColor}`,
              }}
            />
            {/* 右側の三角形 */}
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                bottom: -4,
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${taskColor}`,
              }}
            />
          </>
        )}
      </Box>
    </Tooltip>
  );
};

export default GanttTaskBar;