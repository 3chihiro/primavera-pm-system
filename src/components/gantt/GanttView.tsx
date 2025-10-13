import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Typography, Paper, Button, ButtonGroup, IconButton, Tooltip } from '@mui/material';
import { Calculate as CalculateIcon, DragIndicator } from '@mui/icons-material';
import { addDays, addMonths } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import GanttTimeline from './GanttTimeline';
import GanttTaskBar from './GanttTaskBar';
import GanttGrid from './GanttGrid';
import {
  GanttTask,
  TimeRange,
  TimeScale,
  DEFAULT_GANTT_SETTINGS,
  GanttSettings,
} from '../../types/gantt';
import { calculatePixelsPerDay, calculateVisibleTimeRange, computeDateBoundsForTask } from '../../utils/ganttUtils';
import { RootState } from '../../store/store';
import { calculateSchedule, setTasks, reorderTasks } from '../../store/slices/taskSlice';
import { updateTask } from '../../store/slices/taskSlice';
import { generateMockTasks } from '../../utils/mockData';

/**
 * ガントチャート表示コンポーネント
 * タイムライン + タスクバーを統合表示
 */
const GanttView: React.FC = () => {
  const dispatch = useDispatch();
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [zoomLevel, setZoomLevel] = useState(1);

  // ドラッグ&ドロップ状態管理
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // スクロール同期用のref
  const timelineRef = useRef<HTMLDivElement>(null);
  const taskAreaRef = useRef<HTMLDivElement>(null);
  const wbsAreaRef = useRef<HTMLDivElement>(null);

  // Redux Storeからタスクデータ、プロジェクト情報、リソース情報を取得
  const tasks = useSelector((state: RootState) => state.task.items);
  const currentProject = useSelector((state: RootState) => state.project.currentProject);
  const resources = useSelector((state: RootState) => state.resource.items);

  // 初回マウント時にモックデータを読み込む
  useEffect(() => {
    if (tasks.length === 0) {
      const mockTasks = generateMockTasks('demo-project-1');
      dispatch(setTasks(mockTasks));
    }
  }, []);

  // タスクをGanttTask型に変換
  const ganttTasks: GanttTask[] = useMemo(() => {
    return tasks.map((task) => {
      // このタスクに割り当てられているリソースを取得
      const taskResources = resources
        .filter((resource) =>
          resource.allocations.some((alloc) => alloc.taskId === task.id)
        )
        .map((resource) => {
          const allocation = resource.allocations.find(
            (alloc) => alloc.taskId === task.id
          );
          return {
            id: resource.id,
            name: resource.name,
            allocation: allocation?.allocation || 0,
          };
        });

      return {
        id: task.id,
        name: task.name,
        startDate: new Date(task.plannedStartDate),
        endDate: new Date(task.plannedEndDate),
        progress: task.percentComplete,
        type: task.type,
        level: 0, // TODO: 階層レベルの計算
        dependencies: task.dependencies.map((d) => d.predecessorId),
        isCritical: task.cpm?.isCritical || false,
        resources: taskResources.length > 0 ? taskResources : undefined,
      };
    });
  }, [tasks, resources]);

  // CPMスケジューリング計算を実行
  const handleCalculateSchedule = () => {
    if (tasks.length === 0) {
      alert('タスクがありません。まずタスクを追加してください。');
      return;
    }

    // プロジェクト開始日を決定（現在のタスクの最早日付を使用）
    const projectStartDate = currentProject?.startDate
      ? new Date(currentProject.startDate)
      : new Date();

    console.log('CPMスケジューリング計算を開始...', {
      taskCount: tasks.length,
      projectStartDate
    });

    dispatch(calculateSchedule({ projectStartDate }));

    alert(`CPMスケジューリング計算が完了しました！\nタスク数: ${tasks.length}\nクリティカルパス: ${tasks.filter(t => t.cpm?.isCritical).length}件`);
  };

  // 時間範囲を計算
  const timeRange: TimeRange = useMemo(() => {
    if (ganttTasks.length === 0) {
      // デフォルトの時間範囲（今日から30日間）
      const today = new Date();
      return {
        start: today,
        end: addDays(today, 30),
      };
    }
    return calculateVisibleTimeRange(ganttTasks, 15);
  }, [ganttTasks]);

  // ピクセル/日を計算
  const pixelsPerDay = calculatePixelsPerDay(timeScale, zoomLevel);

  const settings: GanttSettings = DEFAULT_GANTT_SETTINGS;

  // 分割バー（簡易）
  const [segmentsMap, setSegmentsMap] = useState<Record<string, Array<{ startDate: Date; endDate: Date }>>>({});

  const handleTaskDateChange = (taskId: string, start: Date, end: Date) => {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const bounds = computeDateBoundsForTask(t, tasks as any);
    let s = new Date(start);
    let e = new Date(end);
    if (bounds.minStart && s < bounds.minStart) s = bounds.minStart;
    if (bounds.maxStart && s > bounds.maxStart) s = bounds.maxStart;
    if (bounds.minEnd && e < bounds.minEnd) e = bounds.minEnd;
    if (bounds.maxEnd && e > bounds.maxEnd) e = bounds.maxEnd;
    if (e <= s) e = new Date(s.getTime() + 24 * 60 * 60 * 1000);
    dispatch(updateTask({ id: taskId, plannedStartDate: s, plannedEndDate: e } as any));
    // 依存・制約の再計算
    dispatch(calculateSchedule({ projectStartDate: s }));
  };

  const handleTaskProgressChange = (taskId: string, progress: number) => {
    dispatch(updateTask({ id: taskId, percentComplete: progress } as any));
  };

  const handleTaskSplit = (taskId: string, splitDate: Date) => {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const current = segmentsMap[taskId] || [{ startDate: new Date(t.plannedStartDate), endDate: new Date(t.plannedEndDate) }];
    const next: Array<{ startDate: Date; endDate: Date }> = [];
    for (const seg of current) {
      if (splitDate > seg.startDate && splitDate < seg.endDate) {
        next.push({ startDate: seg.startDate, endDate: new Date(splitDate) });
        next.push({ startDate: new Date(splitDate), endDate: seg.endDate });
      } else {
        next.push(seg);
      }
    }
    setSegmentsMap({ ...segmentsMap, [taskId]: next });
  };

  const handleTaskClick = (task: GanttTask) => {
    console.log('Task clicked:', task.name);
  };

  const handleTaskDoubleClick = (task: GanttTask) => {
    console.log('Task double-clicked:', task.name);
  };

  // スクロール同期ハンドラー
  const handleTimelineScroll = (scrollLeft: number) => {
    if (taskAreaRef.current) {
      taskAreaRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleTaskAreaScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const scrollLeft = target.scrollLeft;
    const scrollTop = target.scrollTop;

    // 水平スクロール同期
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = scrollLeft;
    }

    // 垂直スクロール同期
    if (wbsAreaRef.current) {
      wbsAreaRef.current.scrollTop = scrollTop;
    }
  };

  const handleWbsAreaScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = (event.target as HTMLDivElement).scrollTop;
    if (taskAreaRef.current) {
      taskAreaRef.current.scrollTop = scrollTop;
    }
  };

  // ドラッグ開始ハンドラー
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);

    // ドラッグ中の要素にスタイルを追加
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  // ドラッグ終了ハンドラー
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedTaskId(null);
    setDragOverIndex(null);

    // スタイルを元に戻す
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1';
    }
  };

  // ドラッグオーバーハンドラー
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedTaskId) {
      setDragOverIndex(index);
    }
  };

  // ドロップハンドラー
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    if (!draggedTaskId) return;

    const draggedIndex = ganttTasks.findIndex(t => t.id === draggedTaskId);

    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedTaskId(null);
      setDragOverIndex(null);
      return;
    }

    // Reduxアクションで並び替えを実行
    dispatch(reorderTasks({
      fromIndex: draggedIndex,
      toIndex: dropIndex,
    }));

    setDraggedTaskId(null);
    setDragOverIndex(null);
  };

  const rowHeight = 50;

  return (
    <Box sx={{ padding: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">ガントチャート</Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* CPMスケジューリング計算ボタン */}
          <Tooltip title="CPMスケジューリング計算を実行">
            <Button
              variant="contained"
              color="primary"
              startIcon={<CalculateIcon />}
              onClick={handleCalculateSchedule}
              size="small"
            >
              スケジュール計算
            </Button>
          </Tooltip>

          {/* タイムスケール切り替え */}
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={timeScale === 'day' ? 'contained' : 'outlined'}
              onClick={() => setTimeScale('day')}
            >
              日
            </Button>
            <Button
              variant={timeScale === 'week' ? 'contained' : 'outlined'}
              onClick={() => setTimeScale('week')}
            >
              週
            </Button>
            <Button
              variant={timeScale === 'month' ? 'contained' : 'outlined'}
              onClick={() => setTimeScale('month')}
            >
              月
            </Button>
          </ButtonGroup>

          {/* ズームコントロール */}
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}>-</Button>
            <Button disabled>ズーム: {Math.round(zoomLevel * 100)}%</Button>
            <Button onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}>+</Button>
          </ButtonGroup>
        </Box>
      </Box>

      <Paper sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* ヘッダー行: WBS列ヘッダー + タイムライン */}
        <Box sx={{ display: 'flex', borderBottom: '2px solid #424242' }}>
          {/* WBS列ヘッダー */}
          <Box
            sx={{
              width: '250px',
              minWidth: '250px',
              backgroundColor: '#fafafa',
              borderRight: '2px solid #424242',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '14px',
              padding: '8px',
            }}
          >
            タスク名
          </Box>

          {/* タイムラインヘッダー */}
          <Box ref={timelineRef} sx={{ flexGrow: 1, overflowX: 'hidden' }}>
            <GanttTimeline
              timeRange={timeRange}
              pixelsPerDay={pixelsPerDay}
              timeScale={timeScale}
              onScroll={handleTimelineScroll}
            />
          </Box>
        </Box>

        {/* メイン表示エリア: WBS列 + ガントチャート */}
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* WBS列（タスク名） */}
          <Box
            ref={wbsAreaRef}
            onScroll={handleWbsAreaScroll}
            sx={{
              width: '250px',
              minWidth: '250px',
              borderRight: '2px solid #424242',
              backgroundColor: '#ffffff',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {ganttTasks.map((task, index) => (
              <Box
                key={`wbs-${task.id}`}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                sx={{
                  height: `${rowHeight}px`,
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px 0 4px',
                  backgroundColor: dragOverIndex === index ? '#e3f2fd' : '#ffffff',
                  cursor: 'move',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: dragOverIndex === index ? '#e3f2fd' : '#f5f5f5',
                    '& .drag-handle': {
                      opacity: 1,
                    },
                  },
                  opacity: draggedTaskId === task.id ? 0.5 : 1,
                  borderTop: dragOverIndex === index ? '2px solid #1976d2' : 'none',
                }}
              >
                <DragIndicator
                  className="drag-handle"
                  sx={{
                    fontSize: 18,
                    color: '#999',
                    marginRight: 0.5,
                    opacity: 0.3,
                    transition: 'opacity 0.2s ease',
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: task.type === 'summary' ? 600 : 400,
                    color: task.isCritical ? '#d32f2f' : '#333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {task.name}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* ガントチャート表示エリア */}
          <Box
            ref={taskAreaRef}
            onScroll={handleTaskAreaScroll}
            id="gantt-chart-container"
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              overflowX: 'auto',
              position: 'relative',
              backgroundColor: '#fafafa',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                minHeight: `${ganttTasks.length * rowHeight}px`,
              }}
            >
              {/* グリッド背景 */}
              <GanttGrid
                timeRange={timeRange}
                pixelsPerDay={pixelsPerDay}
                rowHeight={rowHeight}
                rowCount={ganttTasks.length}
              />

              {/* タスクバー */}
              {ganttTasks.map((task, index) => (
                <Box
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  sx={{
                    position: 'relative',
                    height: `${rowHeight}px`,
                    borderBottom: '1px solid #e0e0e0',
                    zIndex: 10,
                    backgroundColor: dragOverIndex === index ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: dragOverIndex === index ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                    },
                    opacity: draggedTaskId === task.id ? 0.5 : 1,
                    borderTop: dragOverIndex === index ? '2px solid #1976d2' : 'none',
                    cursor: 'move',
                  }}
                >
              <GanttTaskBar
                task={{ ...task, segments: segmentsMap[task.id] }}
                timeRangeStart={timeRange.start}
                pixelsPerDay={pixelsPerDay}
                rowHeight={rowHeight}
                settings={settings}
                onTaskClick={handleTaskClick}
                onTaskDoubleClick={handleTaskDoubleClick}
                onTaskDateChange={handleTaskDateChange}
                onTaskProgressChange={handleTaskProgressChange}
                onTaskSplit={handleTaskSplit}
              />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* ステータス表示 */}
        <Box
          sx={{
            padding: 1,
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            表示タスク数: {ganttTasks.length} | クリティカルパス: {ganttTasks.filter(t => t.isCritical).length}件
          </Typography>
          <Typography variant="caption" color="text.secondary">
            表示期間: {timeRange.start.toLocaleDateString('ja-JP')} 〜{' '}
            {timeRange.end.toLocaleDateString('ja-JP')}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default GanttView;
