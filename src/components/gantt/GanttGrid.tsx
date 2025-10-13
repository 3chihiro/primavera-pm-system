import React from 'react';
import { Box } from '@mui/material';
import { TimeRange, TimelineCell } from '../../types/gantt';
import { addDays, isWeekend, isSameDay } from 'date-fns';
import { isHoliday, getJapaneseHolidays } from '../../utils/ganttUtils';

interface GanttGridProps {
  timeRange: TimeRange;
  pixelsPerDay: number;
  rowHeight: number;
  rowCount: number;
}

/**
 * ガントチャートのグリッド背景コンポーネント
 * 日付ごとの縦線と休日・週末の色分けを表示
 */
const GanttGrid: React.FC<GanttGridProps> = ({
  timeRange,
  pixelsPerDay,
  rowHeight,
  rowCount
}) => {
  // 祝日データを取得
  const years = new Set<number>();
  let tempDate = new Date(timeRange.start);
  while (tempDate <= timeRange.end) {
    years.add(tempDate.getFullYear());
    tempDate = addDays(tempDate, 365);
  }
  const holidays = Array.from(years).flatMap(y => getJapaneseHolidays(y));

  // 日付ごとのグリッド列を生成
  const gridColumns: TimelineCell[] = [];
  let currentDate = new Date(timeRange.start);

  while (currentDate <= timeRange.end) {
    gridColumns.push({
      date: new Date(currentDate),
      label: '',
      width: pixelsPerDay,
      isWeekend: isWeekend(currentDate),
      isHoliday: isHoliday(currentDate, holidays),
      isToday: isSameDay(currentDate, new Date())
    });
    currentDate = addDays(currentDate, 1);
  }

  const totalHeight = rowCount * rowHeight;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${totalHeight}px`,
        display: 'flex',
        pointerEvents: 'none',
        zIndex: 50
      }}
    >
      {gridColumns.map((column, index) => {
        // 休日・週末かどうか判定
        const isNonWorkingDay = column.isHoliday || column.isWeekend;

        // 背景色の決定（仕様色: 休日/週末は #D6DCE5、今日を薄いオレンジで強調）
        const backgroundColor = column.isToday
          ? 'rgba(255, 152, 0, 0.15)'
          : isNonWorkingDay
          ? '#D6DCE5'
          : 'transparent';

        return (
          <Box
            key={`grid-col-${index}`}
            sx={{
              width: `${column.width}px`,
              minWidth: `${column.width}px`,
              height: '100%',
              backgroundColor,
              borderRight: isNonWorkingDay ? '2px solid #c9ced7' : '1px solid #e0e0e0',
              position: 'relative',
            }}
          >
            {/* 今日の日付には特別なマーカーを表示 */}
            {column.isToday && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '2px',
                  height: '100%',
                  backgroundColor: '#ff6f00',
                  zIndex: 10
                }}
              />
            )}
            {/* 休日は単色背景のみ（Excel準拠イメージ） */}
          </Box>
        );
      })}
    </Box>
  );
};

export default GanttGrid;
