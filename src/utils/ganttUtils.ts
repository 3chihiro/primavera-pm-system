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
  const level4: TimelineCell[] = []; // 曜日

  let currentDate = new Date(start);
  let currentYear = currentDate.getFullYear();
  let currentMonth = currentDate.getMonth();
  let yearWidth = 0;
  let monthWidth = 0;

  // 祝日データを取得（複数年対応）
  const years = new Set<number>();
  let tempDate = new Date(start);
  while (tempDate <= end) {
    years.add(tempDate.getFullYear());
    tempDate = addDays(tempDate, 365);
  }
  const holidays = Array.from(years).flatMap(y => getJapaneseHolidays(y));

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
      isHoliday: isHoliday(currentDate, holidays),
      isToday: isSameDay(currentDate, new Date())
    });

    // 曜日レベル
    level4.push({
      date: new Date(currentDate),
      label: format(currentDate, 'E', { locale: ja }), // 日、月、火、水、木、金、土
      width: dayWidth,
      isWeekend: isWeekend(currentDate),
      isHoliday: isHoliday(currentDate, holidays),
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

  return { level1, level2, level3, level4 };
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
 * 依存関係と制約を考慮した開始・終了日の最小/最大を計算
 * 簡易版: 先行タスクの計画日付とラグのみを考慮
 */
export function computeDateBoundsForTask(
  task: any,
  allTasks: any[]
): { minStart?: Date; minEnd?: Date; maxStart?: Date; maxEnd?: Date } {
  let minStart: Date | undefined;
  let minEnd: Date | undefined;
  let maxStart: Date | undefined;
  let maxEnd: Date | undefined;

  // 依存関係（FS/SS/FF/SF + lag）
  if (task.dependencies && task.dependencies.length > 0) {
    for (const dep of task.dependencies) {
      const pred = allTasks.find((t) => t.id === dep.predecessorId);
      if (!pred) continue;
      const lagMs = (dep.lag || 0) * 24 * 60 * 60 * 1000;
      switch (dep.type) {
        case 'FS': {
          const s = new Date(new Date(pred.plannedEndDate).getTime() + lagMs);
          minStart = !minStart || s > minStart ? s : minStart;
          break;
        }
        case 'SS': {
          const s = new Date(new Date(pred.plannedStartDate).getTime() + lagMs);
          minStart = !minStart || s > minStart ? s : minStart;
          break;
        }
        case 'FF': {
          const e = new Date(new Date(pred.plannedEndDate).getTime() + lagMs);
          minEnd = !minEnd || e > minEnd ? e : minEnd;
          break;
        }
        case 'SF': {
          const e = new Date(new Date(pred.plannedStartDate).getTime() + lagMs);
          minEnd = !minEnd || e > minEnd ? e : minEnd;
          break;
        }
      }
    }
  }

  // 制約（MSO/MFO/SNET/SNLT/FNET/FNLT）
  if (task.constraints && task.constraints.length > 0) {
    for (const c of task.constraints) {
      switch (c.type) {
        case 'MSO':
          minStart = c.date;
          maxStart = c.date;
          break;
        case 'MFO':
          minEnd = c.date;
          maxEnd = c.date;
          break;
        case 'SNET': // Start No Earlier Than
          minStart = !minStart || c.date > minStart ? c.date : minStart;
          break;
        case 'SNLT': // Start No Later Than
          maxStart = !maxStart || c.date < maxStart ? c.date : maxStart;
          break;
        case 'FNET':
          minEnd = !minEnd || c.date > minEnd ? c.date : minEnd;
          break;
        case 'FNLT':
          maxEnd = !maxEnd || c.date < maxEnd ? c.date : maxEnd;
          break;
      }
    }
  }

  return { minStart, minEnd, maxStart, maxEnd };
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
 * デフォルトの日本の祝日を取得（2024-2025年版）
 */
export function getJapaneseHolidays(year: number): Date[] {
  const holidays: Date[] = [];

  // 固定祝日
  holidays.push(
    new Date(year, 0, 1),   // 元日
    new Date(year, 1, 11),  // 建国記念の日
    new Date(year, 1, 23),  // 天皇誕生日
    new Date(year, 3, 29),  // 昭和の日
    new Date(year, 4, 3),   // 憲法記念日
    new Date(year, 4, 4),   // みどりの日
    new Date(year, 4, 5),   // こどもの日
    new Date(year, 7, 11),  // 山の日
    new Date(year, 10, 3),  // 文化の日
    new Date(year, 10, 23)  // 勤労感謝の日
  );

  // ハッピーマンデー（第n月曜日）
  holidays.push(
    getNthWeekday(year, 0, 1, 2),  // 成人の日（1月第2月曜日）
    getNthWeekday(year, 6, 1, 3),  // 海の日（7月第3月曜日）
    getNthWeekday(year, 8, 1, 3),  // 敬老の日（9月第3月曜日）
    getNthWeekday(year, 9, 1, 2)   // スポーツの日（10月第2月曜日）
  );

  // 春分の日・秋分の日（近似計算）
  holidays.push(
    getShunbun(year),  // 春分の日
    getShubun(year)    // 秋分の日
  );

  return holidays;
}

/**
 * 指定月の第n曜日を取得
 * @param year 年
 * @param month 月（0-11）
 * @param dayOfWeek 曜日（0=日曜, 1=月曜...）
 * @param n 第n週
 */
function getNthWeekday(year: number, month: number, dayOfWeek: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();
  const diff = (dayOfWeek - firstDayOfWeek + 7) % 7;
  const date = 1 + diff + (n - 1) * 7;
  return new Date(year, month, date);
}

/**
 * 春分の日を計算（近似式）
 */
function getShunbun(year: number): Date {
  const day = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  return new Date(year, 2, day);
}

/**
 * 秋分の日を計算（近似式）
 */
function getShubun(year: number): Date {
  const day = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  return new Date(year, 8, day);
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
