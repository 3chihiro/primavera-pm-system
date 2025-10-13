import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Assessment as ReportIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { format } from 'date-fns';
import {
  PRESET_REPORTS,
  ReportTemplate,
  ReportConfig,
  ExportFormat,
  ReportType,
} from '../../types/report';
// TODO: PDF/Excelエクスポート機能は現在開発中です
// ブラウザ環境での動作に問題があるため、一時的に無効化しています
/*
import {
  exportTasksToExcel,
  exportResourcesToExcel,
  exportProjectToExcel,
  downloadFile,
  exportToCSV,
} from '../../utils/excelExporter';
import {
  exportTasksToPDF,
  exportResourceUtilizationToPDF,
  exportProjectSummaryToPDF,
  exportGanttChartToPDF,
} from '../../utils/pdfExporter';
*/

/**
 * レポート表示・エクスポートコンポーネント
 */
const ReportsView: React.FC = () => {
  const dispatch = useDispatch();
  const currentProject = useSelector(
    (state: RootState) => state.project.currentProject
  );
  const tasks = useSelector((state: RootState) => state.task.tasks);
  const resources = useSelector((state: RootState) => state.resource.resources);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplate | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [reportConfig, setReportConfig] = useState<Partial<ReportConfig>>({});

  useEffect(() => {
    if (!currentProject) {
      setError('プロジェクトが選択されていません');
    } else {
      setError(null);
    }
  }, [currentProject]);

  /**
   * レポートエクスポートダイアログを開く
   */
  const handleOpenExportDialog = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setExportFormat(template.format);
    setReportConfig({
      name: template.name,
      type: template.type,
      format: template.format,
      projectId: currentProject?.id,
      filters: template.defaultFilters,
      columns: template.defaultColumns,
    });
    setExportDialogOpen(true);
  };

  /**
   * レポートエクスポートダイアログを閉じる
   */
  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
    setSelectedTemplate(null);
    setReportConfig({});
  };

  /**
   * レポート生成・エクスポート実行
   * TODO: PDF/Excelエクスポート機能は現在開発中です
   */
  const handleExportReport = async () => {
    if (!currentProject || !selectedTemplate) {
      setError('プロジェクトまたはレポートテンプレートが選択されていません');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: PDF/Excelエクスポート機能は開発中
      // ブラウザ環境での動作に問題があるため、一時的にモック応答を返します
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機（処理のシミュレーション）

      setSuccess(`レポート機能は現在開発中です。エクスポート機能は次のアップデートで利用可能になります。

選択されたレポート: ${selectedTemplate.name}
形式: ${exportFormat.toUpperCase()}
タスク数: ${tasks.length}
リソース数: ${resources.length}`);

      handleCloseExportDialog();
    } catch (err: any) {
      console.error('Export error:', err);
      setError(`エクスポートエラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * レポートカードのアイコン取得
   */
  const getReportIcon = (type: ReportType) => {
    switch (type) {
      case 'task_list':
      case 'critical_path':
        return <ExcelIcon sx={{ fontSize: 40, color: '#217346' }} />;
      case 'gantt_chart':
        return <ReportIcon sx={{ fontSize: 40, color: '#1976d2' }} />;
      case 'resource_usage':
      case 'evm_progress':
      case 'project_summary':
        return <PdfIcon sx={{ fontSize: 40, color: '#d32f2f' }} />;
      default:
        return <ReportIcon sx={{ fontSize: 40, color: '#757575' }} />;
    }
  };

  if (!currentProject) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="warning">
          プロジェクトを選択してください。レポート機能を使用するには、プロジェクトが必要です。
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 3,
        }}
      >
        <Typography variant="h4">レポート・エクスポート</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          更新
        </Button>
      </Box>

      {/* エラー・成功メッセージ */}
      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ marginBottom: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* プロジェクト情報 */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h6" gutterBottom>
          現在のプロジェクト
        </Typography>
        <Typography variant="body1">
          <strong>{currentProject.project_name}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          タスク数: {tasks.length} | リソース数: {resources.length}
        </Typography>
      </Paper>

      <Divider sx={{ marginY: 3 }} />

      {/* プリセットレポート一覧 */}
      <Typography variant="h5" gutterBottom>
        プリセットレポート
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
        よく使うレポートを簡単にエクスポートできます
      </Typography>

      <Grid container spacing={3}>
        {PRESET_REPORTS.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                  {getReportIcon(template.type)}
                  <Box sx={{ marginLeft: 2 }}>
                    <Typography variant="h6" component="div">
                      {template.name}
                    </Typography>
                    <Chip
                      label={template.format.toUpperCase()}
                      size="small"
                      color={template.format === 'pdf' ? 'error' : 'success'}
                      sx={{ marginTop: 0.5 }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {template.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleOpenExportDialog(template)}
                  disabled={loading}
                >
                  エクスポート
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* エクスポート設定ダイアログ */}
      <Dialog
        open={exportDialogOpen}
        onClose={handleCloseExportDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate?.name} - エクスポート設定
        </DialogTitle>
        <DialogContent>
          <Box sx={{ paddingTop: 2 }}>
            <FormControl fullWidth sx={{ marginBottom: 2 }}>
              <InputLabel>エクスポート形式</InputLabel>
              <Select
                value={exportFormat}
                label="エクスポート形式"
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              >
                <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                <MenuItem value="csv">CSV (.csv)</MenuItem>
                <MenuItem value="pdf">PDF (.pdf)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="レポート名"
              value={reportConfig.name || ''}
              onChange={(e) =>
                setReportConfig({ ...reportConfig, name: e.target.value })
              }
              sx={{ marginBottom: 2 }}
            />

            <Typography variant="body2" color="text.secondary">
              エクスポート対象: {tasks.length}タスク, {resources.length}リソース
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExportDialog} disabled={loading}>
            キャンセル
          </Button>
          <Button
            onClick={handleExportReport}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
            disabled={loading}
          >
            {loading ? 'エクスポート中...' : 'エクスポート'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportsView;
