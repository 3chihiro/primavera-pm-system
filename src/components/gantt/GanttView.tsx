import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Button, ButtonGroup } from '@mui/material';
import { addDays, addMonths } from 'date-fns';
import GanttTimeline from './GanttTimeline';
import GanttTaskBar from './GanttTaskBar';
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
        {/* タイムラインヘッダー */}
        <GanttTimeline
          timeRange={timeRange}
          pixelsPerDay={pixelsPerDay}
          timeScale={timeScale}
        />

        {/* タスクバー表示エリア */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            overflowX: 'auto',
            position: 'relative',
            backgroundColor: '#fafafa',
          }}
        >
          {/* グリッド背景（将来的に追加） */}
          <Box
            sx={{
              position: 'relative',
              minHeight: `${dummyTasks.length * rowHeight}px`,
            }}
          >
            {dummyTasks.map((task, index) => (
              <Box
                key={task.id}
                sx={{
                  position: 'relative',
                  height: `${rowHeight}px`,
                  borderBottom: '1px solid #e0e0e0',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
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