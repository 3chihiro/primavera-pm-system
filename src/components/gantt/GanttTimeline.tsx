import React from 'react';
import { Box } from '@mui/material';
import { TimeRange, TimeScale } from '../../types/gantt';
import { generateTimelineHeader } from '../../utils/ganttUtils';
import GanttTimelineHeader from './GanttTimelineHeader';

interface GanttTimelineProps {
  timeRange: TimeRange;
  pixelsPerDay: number;
  timeScale?: TimeScale;
  onScroll?: (scrollLeft: number) => void;
}

/**
 * ガントチャートのタイムライン表示コンポーネント
 * 年・月・日の3階層でタイムラインを表示
 */
const GanttTimeline: React.FC<GanttTimelineProps> = ({
  timeRange,
  pixelsPerDay,
  timeScale = 'day',
  onScroll
}) => {
  const timeline = generateTimelineHeader(timeRange, timeScale);

  // タイムライン全体の幅を計算
  const totalWidth = timeline.level3.reduce((sum, cell) => sum + cell.width, 0);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) {
      const scrollLeft = (event.target as HTMLDivElement).scrollLeft;
      onScroll(scrollLeft);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        borderBottom: '2px solid #e0e0e0',
        backgroundColor: '#f5f5f5',
        userSelect: 'none',
      }}
      onScroll={handleScroll}
    >
      <Box
        sx={{
          width: `${totalWidth}px`,
          minWidth: '100%',
        }}
      >
        <GanttTimelineHeader timeline={timeline} pixelsPerDay={pixelsPerDay} />
      </Box>
    </Box>
  );
};

export default GanttTimeline;