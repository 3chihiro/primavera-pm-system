/**
 * ガントチャート関連のユーティリティ関数
 */

import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWeekend, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { TimeRange, TimelineHeader, TimelineCell, GanttTask, GanttSettings, TimeScale } from '../types/gantt';

/**
 * 指定された期間の3階層タイムラインヘッダーを生成
 */
export function generateTimelineHeader(timeRange: TimeRange, timeScale: TimeScale): TimelineHeader {
  const { start, end } = timeRange;

  switch (timeScale) {
    case 'day':
      return generateDayTimelineHeader(start, end);
    case 'week':
      return generateWeekTimelineHeader(start, end);
    case 'month':
      return generateMonthTimelineHeader(start, end);
    default:
      return generateDayTimelineHeader(start, end);
  }
}

/**
 * 日単位のタイムラインヘッダーを生成
 */
function generateDayTimelineHeader(start: Date, end: Date): TimelineHeader {
  const level1: TimelineCell[] = []; // 年
  const level2: TimelineCell[] = []; // 月
  const level3: TimelineCell[] = []; // 日

  let currentDate = new Date(start);
  let currentYear = currentDate.getFullYear();
  let currentMonth = currentDate.getMonth();
  let yearWidth = 0;
  let monthWidth = 0;

  while (currentDate <= end) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dayWidth = 40; // 1日あたりのピクセル幅

    // 日レベル
    level3.push({
      date: new Date(currentDate),
      label: format(currentDate, 'd', { locale: ja }),
      width: dayWidth,
      isWeekend: isWeekend(currentDate),
      isToday: isSameDay(currentDate, new Date())
    });

    yearWidth += dayWidth;
    monthWidth += dayWidth;

    // 次の日に進める
    const nextDate = addDays(currentDate, 1);
    const isLastDay = nextDate > end;
    const nextYear = nextDate.getFullYear();
    const nextMonth = nextDate.getMonth();

    // 月が変わる時、または最終日
    if (nextMonth !== month || isLastDay) {
      level2.push({
        date: new Date(currentYear, currentMonth, 1),
        label: format(new Date(currentYear, currentMonth, 1), 'yyyy年M月', { locale: ja }),
        width: monthWidth
      });
      monthWidth = 0;
    }

    // 年が変わる時、または最終日
    if (nextYear !== year || isLastDay) {
      level1.push({
        date: new Date(currentYear, 0, 1),
        label: `${currentYear}年`,
        width: yearWidth
      });
      yearWidth = 0;
    }

    currentDate = nextDate;
    currentYear = nextYear;
    currentMonth = nextMonth;
  }

  return { level1, level2, level3 };
}

/**
 * 週単位のタイムラインヘッダーを生成
 */
function generateWeekTimelineHeader(start: Date, end: Date): TimelineHeader {
  // 週単位の実装は後で追加
  return generateDayTimelineHeader(start, end);
}

/**
 * 月単位のタイムラインヘッダーを生成
 */
function generateMonthTimelineHeader(start: Date, end: Date): TimelineHeader {
  // 月単位の実装は後で追加
  return generateDayTimelineHeader(start, end);
}

/**
 * 日付からX座標を計算
 */
export function dateToX(date: Date, startDate: Date, pixelsPerDay: number): number {
  const diffTime = date.getTime() - startDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays * pixelsPerDay;
}

/**
 * X座標から日付を計算
 */
export function xToDate(x: number, startDate: Date, pixelsPerDay: number): Date {
  const days = x / pixelsPerDay;
  return addDays(startDate, days);
}

/**
 * タスクの幅を計算
 */
export function calculateTaskWidth(startDate: Date, endDate: Date, pixelsPerDay: number): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return Math.max(diffDays * pixelsPerDay, 10); // 最小幅10px
}

/**
 * 休日かどうかを判定
 */
export function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some(holiday => isSameDay(date, holiday));
}

/**
 * 稼働日かどうかを判定
 */
export function isWorkingDay(date: Date, workingDays: number[], holidays: Date[]): boolean {
  const dayOfWeek = date.getDay();
  return workingDays.includes(dayOfWeek) && !isHoliday(date, holidays);
}

/**
 * タスクの階層レベルを計算
 */
export function calculateTaskLevel(task: GanttTask, allTasks: GanttTask[]): number {
  if (!task.parentId) return 0;

  const parent = allTasks.find(t => t.id === task.parentId);
  if (!parent) return 0;

  return calculateTaskLevel(parent, allTasks) + 1;
}

/**
 * タスクリストを階層構造に変換
 */
export function buildTaskHierarchy(tasks: GanttTask[]): GanttTask[] {
  const taskMap = new Map<string, GanttTask>();
  const rootTasks: GanttTask[] = [];

  // マップを作成
  tasks.forEach(task => {
    task.children = [];
    task.level = 0;
    taskMap.set(task.id, task);
  });

  // 階層構造を構築
  tasks.forEach(task => {
    if (task.parentId) {
      const parent = taskMap.get(task.parentId);
      if (parent) {
        parent.children!.push(task);
        task.level = parent.level + 1;
      }
    } else {
      rootTasks.push(task);
    }
  });

  return rootTasks;
}

/**
 * 階層構造のタスクリストを平坦化
 */
export function flattenTaskHierarchy(tasks: GanttTask[]): GanttTask[] {
  const result: GanttTask[] = [];

  function flatten(taskList: GanttTask[]) {
    taskList.forEach(task => {
      result.push(task);
      if (task.children && task.children.length > 0 && task.isExpanded !== false) {
        flatten(task.children);
      }
    });
  }

  flatten(tasks);
  return result;
}

/**
 * タイムスケールに応じたピクセル/日を計算
 */
export function calculatePixelsPerDay(timeScale: TimeScale, zoomLevel: number): number {
  const basePixels = {
    hour: 480,  // 1日 = 480px (1時間 = 20px)
    day: 40,    // 1日 = 40px
    week: 6,    // 1日 = 6px (1週間 = 42px)
    month: 2,   // 1日 = 2px (1ヶ月 = 60px)
    quarter: 1, // 1日 = 1px (1四半期 = 90px)
    year: 0.5   // 1日 = 0.5px (1年 = 182.5px)
  };

  return basePixels[timeScale] * zoomLevel;
}

/**
 * デフォルトの日本の祝日を取得
 */
export function getJapaneseHolidays(year: number): Date[] {
  // 簡略化された祝日リスト（実際の実装では外部ライブラリを使用推奨）
  return [
    new Date(year, 0, 1),   // 元日
    new Date(year, 1, 11),  // 建国記念の日
    new Date(year, 2, 21),  // 春分の日（近似）
    new Date(year, 3, 29),  // 昭和の日
    new Date(year, 4, 3),   // 憲法記念日
    new Date(year, 4, 4),   // みどりの日
    new Date(year, 4, 5),   // こどもの日
    new Date(year, 6, 20),  // 海の日（近似）
    new Date(year, 7, 11),  // 山の日
    new Date(year, 8, 21),  // 敬老の日（近似）
    new Date(year, 8, 23),  // 秋分の日（近似）
    new Date(year, 9, 12),  // スポーツの日（近似）
    new Date(year, 10, 3),  // 文化の日
    new Date(year, 10, 23), // 勤労感謝の日
  ];
}

/**
 * 表示可能な時間範囲を計算
 */
export function calculateVisibleTimeRange(
  allTasks: GanttTask[],
  bufferDays: number = 30
): TimeRange {
  if (allTasks.length === 0) {
    const today = new Date();
    return {
      start: addDays(today, -bufferDays),
      end: addDays(today, bufferDays * 2)
    };
  }

  const startDates = allTasks.map(task => task.startDate);
  const endDates = allTasks.map(task => task.endDate);

  const minStart = new Date(Math.min(...startDates.map(d => d.getTime())));
  const maxEnd = new Date(Math.max(...endDates.map(d => d.getTime())));

  return {
    start: addDays(minStart, -bufferDays),
    end: addDays(maxEnd, bufferDays)
  };
}