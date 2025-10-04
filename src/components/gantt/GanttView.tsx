import React, { useState, useMemo, useRef } from 'react';
import { Box, Typography, Paper, Button, ButtonGroup } from '@mui/material';
import { addDays, addMonths } from 'date-fns';
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
import { calculatePixelsPerDay, calculateVisibleTimeRange } from '../../utils/ganttUtils';

/**
 * ガントチャート表示コンポーネント
 * タイムライン + タスクバーを統合表示
 */
const GanttView: React.FC = () => {
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [zoomLevel, setZoomLevel] = useState(1);

  // スクロール同期用のref
  const timelineRef = useRef<HTMLDivElement>(null);
  const taskAreaRef = useRef<HTMLDivElement>(null);
  const wbsAreaRef = useRef<HTMLDivElement>(null);

  // ダミーデータ（テスト用）
  const dummyTasks: GanttTask[] = useMemo(() => {
    const today = new Date();
    return [
      {
        id: '1',
        name: 'プロジェクト計画',
        startDate: today,
        endDate: addDays(today, 10),
        progress: 75,
        type: 'task',
        level: 0,
        dependencies: [],
        isCritical: false,
      },
      {
        id: '2',
        name: '要件定義',
        startDate: addDays(today, 2),
        endDate: addDays(today, 15),
        progress: 50,
        type: 'task',
        level: 0,
        dependencies: [],
        isCritical: true,
      },
      {
        id: '3',
        name: 'マイルストーン：設計完了',
        startDate: addDays(today, 20),
        endDate: addDays(today, 20),
        progress: 0,
        type: 'milestone',
        level: 0,
        dependencies: [],
      },
      {
        id: '4',
        name: 'フェーズ1（サマリー）',
        startDate: addDays(today, -5),
        endDate: addDays(today, 30),
        progress: 60,
        type: 'summary',
        level: 0,
        dependencies: [],
      },
      {
        id: '5',
        name: '実装作業',
        startDate: addDays(today, 25),
        endDate: addDays(today, 45),
        progress: 30,
        type: 'task',
        level: 0,
        dependencies: [],
      },
    ];
  }, []);

  // 時間範囲を計算
  const timeRange: TimeRange = useMemo(() => {
    return calculateVisibleTimeRange(dummyTasks, 15);
  }, [dummyTasks]);

  // ピクセル/日を計算
  const pixelsPerDay = calculatePixelsPerDay(timeScale, zoomLevel);

  const settings: GanttSettings = DEFAULT_GANTT_SETTINGS;

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

  const rowHeight = 50;

  return (
    <Box sx={{ padding: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">ガントチャート</Typography>

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
            {dummyTasks.map((task, index) => (
              <Box
                key={`wbs-${task.id}`}
                sx={{
                  height: `${rowHeight}px`,
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  backgroundColor: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
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
                minHeight: `${dummyTasks.length * rowHeight}px`,
              }}
            >
              {/* グリッド背景 */}
              <GanttGrid
                timeRange={timeRange}
                pixelsPerDay={pixelsPerDay}
                rowHeight={rowHeight}
                rowCount={dummyTasks.length}
              />

              {/* タスクバー */}
              {dummyTasks.map((task, index) => (
                <Box
                  key={task.id}
                  sx={{
                    position: 'relative',
                    height: `${rowHeight}px`,
                    borderBottom: '1px solid #e0e0e0',
                    zIndex: 10,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <GanttTaskBar
                    task={task}
                    timeRangeStart={timeRange.start}
                    pixelsPerDay={pixelsPerDay}
                    rowHeight={rowHeight}
                    settings={settings}
                    onTaskClick={handleTaskClick}
                    onTaskDoubleClick={handleTaskDoubleClick}
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
            表示タスク数: {dummyTasks.length}
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