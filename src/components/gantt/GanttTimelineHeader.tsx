import React from 'react';
import { Box, Typography } from '@mui/material';
import { TimelineHeader, TimelineCell } from '../../types/gantt';

interface GanttTimelineHeaderProps {
  timeline: TimelineHeader;
  pixelsPerDay: number;
}

/**
 * 3階層タイムラインヘッダーコンポーネント
 * Level 1: 年
 * Level 2: 月
 * Level 3: 日
 */
const GanttTimelineHeader: React.FC<GanttTimelineHeaderProps> = ({
  timeline,
  pixelsPerDay
}) => {
  // 各階層のセルをレンダリング
  const renderTimelineLevel = (cells: TimelineCell[], level: number) => {
    const heights = {
      1: 40,  // 年レベルの高さ
      2: 35,  // 月レベルの高さ
      3: 30,  // 日レベルの高さ
    };

    const fontSize = {
      1: '14px',
      2: '13px',
      3: '12px',
    };

    return (
      <Box
        sx={{
          display: 'flex',
          height: `${heights[level as keyof typeof heights]}px`,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        {cells.map((cell, index) => (
          <Box
            key={`level-${level}-${index}`}
            sx={{
              width: `${cell.width}px`,
              minWidth: `${cell.width}px`,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: '1px solid #e0e0e0',
              backgroundColor: cell.isWeekend
                ? '#f0f0f0'
                : cell.isToday
                ? '#fff3e0'
                : cell.isHoliday
                ? '#ffebee'
                : '#ffffff',
              position: 'relative',
            }}
          >
            <Typography
              sx={{
                fontSize: fontSize[level as keyof typeof fontSize],
                fontWeight: level === 1 ? 600 : level === 2 ? 500 : 400,
                color: cell.isWeekend
                  ? '#757575'
                  : cell.isToday
                  ? '#ff6f00'
                  : cell.isHoliday
                  ? '#c62828'
                  : '#333333',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                padding: '0 4px',
              }}
            >
              {cell.label}
            </Typography>

            {/* 今日の日付に視覚的なマーカーを表示 */}
            {cell.isToday && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  backgroundColor: '#ff6f00',
                }}
              />
            )}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#fafafa',
        borderBottom: '2px solid #424242',
      }}
    >
      {/* Level 1: 年 */}
      {renderTimelineLevel(timeline.level1, 1)}

      {/* Level 2: 月 */}
      {renderTimelineLevel(timeline.level2, 2)}

      {/* Level 3: 日 */}
      {renderTimelineLevel(timeline.level3, 3)}
    </Box>
  );
};

export default GanttTimelineHeader;