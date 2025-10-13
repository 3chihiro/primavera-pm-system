// Excelエクスポート機能
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Task } from '../types/task';
import { Resource } from '../types/resource';
import { ExcelSheet, ExportOptions } from '../types/report';

/**
 * タスク一覧をExcel形式でエクスポート
 */
export function exportTasksToExcel(
  tasks: Task[],
  options: ExportOptions = {}
): Blob {
  const headers = [
    'タスクコード',
    'タスク名',
    'WBSレベル',
    '開始日',
    '終了日',
    '期間(日)',
    '進捗率(%)',
    'ステータス',
    'クリティカル',
    '最早開始日',
    '最遅開始日',
    'トータルフロート',
    '備考',
  ];

  const data = tasks.map((task) => [
    task.task_code || '',
    task.task_name,
    task.wbs_level,
    task.start_date ? format(new Date(task.start_date), 'yyyy/MM/dd') : '',
    task.end_date ? format(new Date(task.end_date), 'yyyy/MM/dd') : '',
    task.duration || 0,
    task.progress || 0,
    getStatusLabel(task.status),
    task.is_critical ? 'はい' : 'いいえ',
    task.early_start ? format(new Date(task.early_start), 'yyyy/MM/dd') : '',
    task.late_start ? format(new Date(task.late_start), 'yyyy/MM/dd') : '',
    task.total_float || 0,
    task.notes || '',
  ]);

  const sheet: ExcelSheet = {
    name: 'タスク一覧',
    headers,
    data,
    columnWidths: [12, 30, 8, 12, 12, 10, 10, 12, 10, 12, 12, 12, 30],
  };

  return createExcelFile([sheet], options);
}

/**
 * リソース一覧をExcel形式でエクスポート
 */
export function exportResourcesToExcel(
  resources: Resource[],
  options: ExportOptions = {}
): Blob {
  const headers = [
    'リソースコード',
    'リソース名',
    'タイプ',
    'カテゴリ',
    '部署',
    'メール',
    '電話',
    '標準単価',
    '残業単価',
    '最大稼働率(%)',
    'スキル',
  ];

  const data = resources.map((resource) => [
    resource.resource_code || '',
    resource.resource_name,
    getResourceTypeLabel(resource.resource_type),
    resource.category || '',
    resource.department || '',
    resource.email || '',
    resource.phone || '',
    resource.standard_rate || 0,
    resource.overtime_rate || 0,
    (resource.max_units || 1) * 100,
    resource.skills ? resource.skills.join(', ') : '',
  ]);

  const sheet: ExcelSheet = {
    name: 'リソース一覧',
    headers,
    data,
    columnWidths: [15, 20, 12, 15, 15, 25, 15, 12, 12, 12, 30],
  };

  return createExcelFile([sheet], options);
}

/**
 * プロジェクトデータを複数シートでエクスポート
 */
export function exportProjectToExcel(
  projectData: {
    tasks: Task[];
    resources: Resource[];
    projectInfo: any;
  },
  options: ExportOptions = {}
): Blob {
  const sheets: ExcelSheet[] = [];

  // プロジェクト情報シート
  sheets.push({
    name: 'プロジェクト情報',
    headers: ['項目', '値'],
    data: [
      ['プロジェクト名', projectData.projectInfo.name],
      ['プロジェクトコード', projectData.projectInfo.code || ''],
      ['開始日', projectData.projectInfo.start_date || ''],
      ['終了日', projectData.projectInfo.end_date || ''],
      ['ステータス', projectData.projectInfo.status || ''],
      ['説明', projectData.projectInfo.description || ''],
      ['エクスポート日時', format(new Date(), 'yyyy/MM/dd HH:mm:ss')],
    ],
    columnWidths: [20, 50],
  });

  // タスク一覧シート
  const taskHeaders = [
    'タスクコード',
    'タスク名',
    'WBSレベル',
    '開始日',
    '終了日',
    '期間(日)',
    '進捗率(%)',
    'ステータス',
  ];

  const taskData = projectData.tasks.map((task) => [
    task.task_code || '',
    task.task_name,
    task.wbs_level,
    task.start_date ? format(new Date(task.start_date), 'yyyy/MM/dd') : '',
    task.end_date ? format(new Date(task.end_date), 'yyyy/MM/dd') : '',
    task.duration || 0,
    task.progress || 0,
    getStatusLabel(task.status),
  ]);

  sheets.push({
    name: 'タスク一覧',
    headers: taskHeaders,
    data: taskData,
    columnWidths: [12, 30, 8, 12, 12, 10, 10, 12],
  });

  // リソース一覧シート
  const resourceHeaders = [
    'リソースコード',
    'リソース名',
    'タイプ',
    '標準単価',
    '最大稼働率(%)',
  ];

  const resourceData = projectData.resources.map((resource) => [
    resource.resource_code || '',
    resource.resource_name,
    getResourceTypeLabel(resource.resource_type),
    resource.standard_rate || 0,
    (resource.max_units || 1) * 100,
  ]);

  sheets.push({
    name: 'リソース一覧',
    headers: resourceHeaders,
    data: resourceData,
    columnWidths: [15, 20, 12, 12, 12],
  });

  return createExcelFile(sheets, options);
}

/**
 * CSV形式でエクスポート
 */
export function exportToCSV(
  headers: string[],
  data: any[][],
  options: ExportOptions = {}
): Blob {
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      row.map((cell) => {
        // CSVエスケープ処理
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ),
  ].join('\n');

  // BOM付きUTF-8でエンコード（Excel対応）
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  return blob;
}

/**
 * Excelファイルを作成
 */
function createExcelFile(
  sheets: ExcelSheet[],
  options: ExportOptions = {}
): Blob {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    // ヘッダーとデータを結合
    const worksheetData = [sheet.headers, ...sheet.data];

    // ワークシート作成
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // 列幅設定
    if (sheet.columnWidths) {
      worksheet['!cols'] = sheet.columnWidths.map((width) => ({ wch: width }));
    }

    // ヘッダー行のスタイル設定（太字、背景色）
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      // スタイル設定（xlsxライブラリの制限により、一部のスタイルのみ）
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'CCCCCC' } },
      };
    }

    // ワークブックに追加
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  // Excelファイルをバイナリで生成
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return blob;
}

/**
 * ファイルをダウンロード
 */
export function downloadFile(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ヘルパー関数

function getStatusLabel(status: string): string {
  const statusMap: { [key: string]: string } = {
    not_started: '未着手',
    in_progress: '進行中',
    completed: '完了',
    on_hold: '保留',
  };
  return statusMap[status] || status;
}

function getResourceTypeLabel(type: string): string {
  const typeMap: { [key: string]: string } = {
    labor: '人的リソース',
    material: '材料',
    equipment: '設備',
    cost: 'コスト',
  };
  return typeMap[type] || type;
}
