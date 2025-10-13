import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Tooltip, Typography, Chip } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { GanttTask, GanttSettings } from '../../types/gantt';
import { dateToX, calculateTaskWidth, xToDate } from '../../utils/ganttUtils';
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
  onTaskDateChange?: (taskId: string, start: Date, end: Date) => void;
  onTaskProgressChange?: (taskId: string, progress: number) => void;
  onTaskSplit?: (taskId: string, splitDate: Date) => void;
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
  onTaskDoubleClick,
  onTaskDateChange,
  onTaskProgressChange,
  onTaskSplit
}) => {
  // ドラッグ/リサイズ用の内部状態
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize-start' | 'resize-end' | null;
    originX: number;
    origStart: Date;
    origEnd: Date;
  }>({ type: null, originX: 0, origStart: task.startDate, origEnd: task.endDate });

  // タスクバーの位置と幅を計算（動的）
  const x = useMemo(() => dateToX(task.startDate, timeRangeStart, pixelsPerDay), [task.startDate, timeRangeStart, pixelsPerDay]);
  const width = useMemo(() => calculateTaskWidth(task.startDate, task.endDate, pixelsPerDay), [task.startDate, task.endDate, pixelsPerDay]);

  // タスクタイプに応じた色を取得
  const getTaskColor = (): string => {
    if (task.color) return task.color;
    // 遅延判定（進捗<100% かつ 今日>終了日）
    const isLate = task.progress < 100 && new Date() > task.endDate;
    if (isLate) return '#FF0000'; // 遅延バー（赤）
    if (task.isCritical) return settings.colors.criticalPath; // クリティカル（オレンジ）

    switch (task.type) {
      case 'milestone':
        return settings.colors.milestoneBar;
      case 'summary':
        return settings.colors.summaryBar;
      default:
        return settings.colors.taskBar; // 計画バー（ブルー）
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

  // ドラッグ/リサイズ開始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!settings.enableDragDrop) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const posX = e.clientX - rect.left; // within bar
    const edge = 6;
    let type: 'move' | 'resize-start' | 'resize-end' = 'move';
    if (posX <= edge) type = 'resize-start';
    else if (posX >= rect.width - edge) type = 'resize-end';
    setDragState({ type, originX: e.clientX, origStart: task.startDate, origEnd: task.endDate });
    // 防止テキスト選択
    e.preventDefault();
  }, [settings.enableDragDrop, task.startDate, task.endDate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.type) return;
    const deltaPx = e.clientX - dragState.originX;
    const deltaDays = Math.round(deltaPx / pixelsPerDay);
    let newStart = dragState.origStart;
    let newEnd = dragState.origEnd;
    if (dragState.type === 'move') {
      newStart = xToDate(dateToX(dragState.origStart, timeRangeStart, pixelsPerDay) + deltaDays * pixelsPerDay, timeRangeStart, pixelsPerDay);
      newEnd = xToDate(dateToX(dragState.origEnd, timeRangeStart, pixelsPerDay) + deltaDays * pixelsPerDay, timeRangeStart, pixelsPerDay);
    } else if (dragState.type === 'resize-start') {
      newStart = xToDate(dateToX(dragState.origStart, timeRangeStart, pixelsPerDay) + deltaDays * pixelsPerDay, timeRangeStart, pixelsPerDay);
      if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - 24 * 60 * 60 * 1000);
    } else if (dragState.type === 'resize-end') {
      newEnd = xToDate(dateToX(dragState.origEnd, timeRangeStart, pixelsPerDay) + deltaDays * pixelsPerDay, timeRangeStart, pixelsPerDay);
      if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + 24 * 60 * 60 * 1000);
    }
    // 即時の見た目更新は親の再描画に委ねるため、ここでは終了時のみ確定コール
  }, [dragState, pixelsPerDay, timeRangeStart]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragState.type) return;
    const deltaPx = e.clientX - dragState.originX;
    const deltaDays = Math.round(deltaPx / pixelsPerDay);
    let newStart = dragState.origStart;
    let newEnd = dragState.origEnd;
    if (dragState.type === 'move') {
      newStart = xToDate(dateToX(dragState.origStart, timeRangeStart, pixelsPerDay) + deltaDays * pixelsPerDay, timeRangeStart, pixelsPerDay);
      newEnd = xToDate(dateToX(dragState.origEnd, timeRangeStart, pixelsPerDay) + deltaDays * pixelsPerDay, timeRangeStart, pixelsPerDay);
    } else if (dragState.type === 'resize-start') {
      newStart = xToDate(dateToX(dragState.origStart, timeRangeStart, pixelsPerDay) + deltaDays * pixelsPerDay, timeRangeStart, pixelsPerDay);
      if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - 24 * 60 * 60 * 1000);
    } else if (dragState.type === 'resize-end') {
      newEnd = xToDate(dateToX(dragState.origEnd, timeRangeStart, pixelsPerDay) + deltaDays * pixelsPerDay, timeRangeStart, pixelsPerDay);
      if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + 24 * 60 * 60 * 1000);
    }
    setDragState({ type: null, originX: 0, origStart: newStart, origEnd: newEnd });
    onTaskDateChange?.(task.id, newStart, newEnd);
  }, [dragState, pixelsPerDay, timeRangeStart, onTaskDateChange, task.id]);

  // 進捗変更（Ctrl+ドラッグ）
  const handleProgressDrag = useCallback((e: React.MouseEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return; // Ctrl/⌘ 押下時のみ
    const el = containerRef.current;
    if (!el || task.type === 'summary' || task.type === 'milestone') return;
    const rect = el.getBoundingClientRect();
    const posX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = Math.round((posX / rect.width) * 100);
    onTaskProgressChange?.(task.id, Math.max(0, Math.min(100, pct)));
    e.preventDefault();
    e.stopPropagation();
  }, [onTaskProgressChange, task.id, task.type]);

  // 分割（Alt+ダブルクリックで分割）
  const handleAltDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!e.altKey) return;
    const xWithin = e.nativeEvent.offsetX;
    const splitDate = xToDate(xWithin, timeRangeStart, pixelsPerDay);
    onTaskSplit?.(task.id, splitDate);
    e.preventDefault();
    e.stopPropagation();
  }, [onTaskSplit, task.id, timeRangeStart, pixelsPerDay]);

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
          {task.resources && task.resources.length > 0 && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              リソース: {task.resources.map(r => r.name).join(', ')}
            </Typography>
          )}
        </Box>
      }
      arrow
    >
      <Box
        ref={containerRef}
        onClick={() => onTaskClick?.(task)}
        onDoubleClick={(e) => { handleAltDoubleClick(e); onTaskDoubleClick?.(task); }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => dragState.type && setDragState({ ...dragState, type: null })}
        onMouseMoveCapture={handleProgressDrag}
        sx={{
          position: 'absolute',
          left: `${x}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${width}px`,
          height: `${isSummary ? rowHeight * 0.4 : rowHeight * 0.6}px`,
          cursor: settings.enableDragDrop ? 'grab' : 'pointer',
          userSelect: 'none',
        }}
      >
        {/* メイン（もしくは分割）バー */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: taskColor,
            borderRadius: isSummary ? '4px' : '4px',
            border: task.isCritical ? '2px solid #FF6600' : 'none',
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
          {/* 分割セグメントの描画（なければ全体） */}
          {Array.isArray(task.segments) && task.segments.length > 0 ? (
            task.segments.map((seg, idx) => {
              const segX = dateToX(seg.startDate, task.startDate, pixelsPerDay);
              const segW = calculateTaskWidth(seg.startDate, seg.endDate, pixelsPerDay);
              return (
                <Box key={`seg-${idx}`}
                  sx={{ position: 'absolute', left: `${segX}px`, top: 0, height: '100%', width: `${segW}px`, backgroundColor: taskColor, opacity: 0.95 }}
                />
              );
            })
          ) : (
            !isSummary && task.progress > 0 && (
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
            )
          )}

          {/* リサイズハンドル */}
          {settings.enableDragDrop && !isSummary && (
            <>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', cursor: 'ew-resize' }} />
              <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'ew-resize' }} />
            </>
          )}

          {/* タスク名は左側のWBS列に表示するため、ここでは表示しない */}
        </Box>

        {/* リソースインジケーター */}
        {task.resources && task.resources.length > 0 && width > 40 && (
          <Box
            sx={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '4px',
              padding: '2px 4px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#555',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <PersonIcon sx={{ fontSize: 12 }} />
            <span>{task.resources.length}</span>
          </Box>
        )}

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
