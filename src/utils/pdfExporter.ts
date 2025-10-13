// PDFエクスポート機能
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { Task } from '../types/task';
import { Resource } from '../types/resource';
import { ExportOptions } from '../types/report';

// 日本語フォント対応のための設定
// 注: 実際の日本語フォント埋め込みには追加の設定が必要
// 現時点では英数字とカタカナのみ対応

/**
 * タスク一覧をPDF形式でエクスポート
 */
export async function exportTasksToPDF(
  tasks: Task[],
  projectName: string,
  options: ExportOptions = {}
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: options.pageOrientation || 'landscape',
    unit: 'mm',
    format: options.paperSize || 'a4',
  });

  // タイトル設定
  addPDFHeader(doc, options.title || 'Task List Report', projectName);

  // タスク一覧テーブル
  const tableData = tasks.map((task) => [
    task.task_code || '',
    task.task_name,
    task.start_date ? format(new Date(task.start_date), 'yyyy/MM/dd') : '',
    task.end_date ? format(new Date(task.end_date), 'yyyy/MM/dd') : '',
    `${task.duration || 0}`,
    `${task.progress || 0}%`,
    getStatusLabel(task.status),
    task.is_critical ? 'Yes' : 'No',
  ]);

  autoTable(doc, {
    head: [
      [
        'Code',
        'Task Name',
        'Start Date',
        'End Date',
        'Duration',
        'Progress',
        'Status',
        'Critical',
      ],
    ],
    body: tableData,
    startY: 30,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 },
      7: { cellWidth: 20 },
    },
  });

  // フッター追加
  addPDFFooter(doc, options);

  return doc.output('blob');
}

/**
 * リソース使用率レポートをPDF形式でエクスポート
 */
export async function exportResourceUtilizationToPDF(
  resources: Resource[],
  utilizationData: any[],
  projectName: string,
  options: ExportOptions = {}
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: options.pageOrientation || 'portrait',
    unit: 'mm',
    format: options.paperSize || 'a4',
  });

  // タイトル設定
  addPDFHeader(
    doc,
    options.title || 'Resource Utilization Report',
    projectName
  );

  // リソース使用率テーブル
  const tableData = utilizationData.map((data) => [
    data.resourceName,
    getResourceTypeLabel(data.resourceType),
    `${data.averageUtilization.toFixed(1)}%`,
    `${data.maxUtilization.toFixed(1)}%`,
    data.overloadedPeriods,
    data.status,
  ]);

  autoTable(doc, {
    head: [
      [
        'Resource Name',
        'Type',
        'Avg Utilization',
        'Max Utilization',
        'Overloaded Periods',
        'Status',
      ],
    ],
    body: tableData,
    startY: 30,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
    },
  });

  // サマリー情報を追加
  const finalY = (doc as any).lastAutoTable.finalY || 30;
  doc.setFontSize(10);
  doc.text('Summary:', 14, finalY + 15);
  doc.setFontSize(9);
  doc.text(
    `Total Resources: ${resources.length}`,
    14,
    finalY + 22
  );

  const overloadedCount = utilizationData.filter(
    (d) => d.averageUtilization > 100
  ).length;
  doc.text(
    `Overloaded Resources: ${overloadedCount}`,
    14,
    finalY + 28
  );

  const avgUtilization =
    utilizationData.reduce((sum, d) => sum + d.averageUtilization, 0) /
    utilizationData.length;
  doc.text(
    `Average Utilization: ${avgUtilization.toFixed(1)}%`,
    14,
    finalY + 34
  );

  // フッター追加
  addPDFFooter(doc, options);

  return doc.output('blob');
}

/**
 * プロジェクトサマリーレポートをPDF形式でエクスポート
 */
export async function exportProjectSummaryToPDF(
  projectData: {
    projectInfo: any;
    tasks: Task[];
    resources: Resource[];
    evmData?: any;
  },
  options: ExportOptions = {}
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: options.pageOrientation || 'portrait',
    unit: 'mm',
    format: options.paperSize || 'a4',
  });

  // タイトル設定
  addPDFHeader(
    doc,
    options.title || 'Project Summary Report',
    projectData.projectInfo.name
  );

  let currentY = 35;

  // プロジェクト基本情報
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Information', 14, currentY);
  currentY += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Project Code: ${projectData.projectInfo.code || 'N/A'}`,
    14,
    currentY
  );
  currentY += 5;
  doc.text(
    `Status: ${projectData.projectInfo.status || 'N/A'}`,
    14,
    currentY
  );
  currentY += 5;
  doc.text(
    `Start Date: ${
      projectData.projectInfo.start_date
        ? format(new Date(projectData.projectInfo.start_date), 'yyyy/MM/dd')
        : 'N/A'
    }`,
    14,
    currentY
  );
  currentY += 5;
  doc.text(
    `End Date: ${
      projectData.projectInfo.end_date
        ? format(new Date(projectData.projectInfo.end_date), 'yyyy/MM/dd')
        : 'N/A'
    }`,
    14,
    currentY
  );
  currentY += 10;

  // タスク統計
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Task Statistics', 14, currentY);
  currentY += 7;

  const totalTasks = projectData.tasks.length;
  const completedTasks = projectData.tasks.filter(
    (t) => t.status === 'completed'
  ).length;
  const inProgressTasks = projectData.tasks.filter(
    (t) => t.status === 'in_progress'
  ).length;
  const criticalTasks = projectData.tasks.filter((t) => t.is_critical).length;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Tasks: ${totalTasks}`, 14, currentY);
  currentY += 5;
  doc.text(`Completed Tasks: ${completedTasks}`, 14, currentY);
  currentY += 5;
  doc.text(`In Progress Tasks: ${inProgressTasks}`, 14, currentY);
  currentY += 5;
  doc.text(`Critical Path Tasks: ${criticalTasks}`, 14, currentY);
  currentY += 10;

  // リソース統計
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resource Statistics', 14, currentY);
  currentY += 7;

  const totalResources = projectData.resources.length;
  const laborResources = projectData.resources.filter(
    (r) => r.resource_type === 'labor'
  ).length;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Resources: ${totalResources}`, 14, currentY);
  currentY += 5;
  doc.text(`Labor Resources: ${laborResources}`, 14, currentY);
  currentY += 10;

  // EVM統計（データがある場合）
  if (projectData.evmData) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EVM Metrics', 14, currentY);
    currentY += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `CPI: ${projectData.evmData.cpi?.toFixed(2) || 'N/A'}`,
      14,
      currentY
    );
    currentY += 5;
    doc.text(
      `SPI: ${projectData.evmData.spi?.toFixed(2) || 'N/A'}`,
      14,
      currentY
    );
    currentY += 5;
    doc.text(
      `EAC: ${projectData.evmData.eac?.toFixed(0) || 'N/A'}`,
      14,
      currentY
    );
  }

  // フッター追加
  addPDFFooter(doc, options);

  return doc.output('blob');
}

/**
 * ガントチャートをPDF形式でエクスポート
 * HTML要素をCanvasに変換してPDFに埋め込む
 */
export async function exportGanttChartToPDF(
  ganttElement: HTMLElement,
  projectName: string,
  options: ExportOptions = {}
): Promise<Blob> {
  // HTML要素をCanvasに変換
  const canvas = await html2canvas(ganttElement, {
    scale: 2, // 高解像度化
    logging: false,
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3', // ガントチャートは大きいのでA3
  });

  // タイトル設定
  addPDFHeader(doc, options.title || 'Gantt Chart', projectName);

  // 画像を追加
  const imgWidth = 400;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  doc.addImage(imgData, 'PNG', 14, 30, imgWidth, imgHeight);

  // フッター追加
  addPDFFooter(doc, options);

  return doc.output('blob');
}

/**
 * PDFヘッダーを追加
 */
function addPDFHeader(
  doc: jsPDF,
  title: string,
  projectName: string
): void {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, 14, 22);

  // 生成日時を右上に表示
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(8);
  doc.text(
    `Generated: ${format(new Date(), 'yyyy/MM/dd HH:mm')}`,
    pageWidth - 14,
    15,
    { align: 'right' }
  );
}

/**
 * PDFフッターを追加
 */
function addPDFFooter(doc: jsPDF, options: ExportOptions): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    if (options.author) {
      doc.text(
        `Author: ${options.author}`,
        14,
        pageHeight - 10
      );
    }
  }
}

// ヘルパー関数

function getStatusLabel(status: string): string {
  const statusMap: { [key: string]: string } = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    on_hold: 'On Hold',
  };
  return statusMap[status] || status;
}

function getResourceTypeLabel(type: string): string {
  const typeMap: { [key: string]: string } = {
    labor: 'Labor',
    material: 'Material',
    equipment: 'Equipment',
    cost: 'Cost',
  };
  return typeMap[type] || type;
}
