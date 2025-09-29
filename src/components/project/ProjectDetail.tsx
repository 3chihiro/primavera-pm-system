import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { Save, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { createProject, updateProject, fetchProject } from '../../store/slices/projectSlice';
import { showNotification } from '../../store/slices/appSlice';
import { CreateProjectData } from '../../types/project';

/**
 * プロジェクト詳細コンポーネント
 * 新規プロジェクト作成および既存プロジェクトの編集機能を提供
 */
const ProjectDetail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
  
  const { currentProject, isLoading } = useSelector((state: RootState) => ({
    currentProject: state.project.currentProject,
    isLoading: state.project.isLoading,
  }));

  const isEditMode = Boolean(id && id !== 'new');

  // フォームの状態管理
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
    status: 'planning',
    priority: 'normal',
    manager: '',
    budget: 0,
    actualCost: 0,
    currency: 'JPY',
    baseline: null,
    settings: {
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: { start: '09:00', end: '18:00' },
      holidays: [],
      currency: 'JPY',
      currencyFormat: { symbol: '¥', position: 'before', decimalPlaces: 0 },
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      firstDayOfWeek: 'monday',
      autoSchedule: true,
      criticalPath: true,
      resourceLeveling: false,
      evmEnabled: true,
      baselineRequired: true,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, isEditMode, id]);

  useEffect(() => {
    if (isEditMode && currentProject) {
      setFormData({
        name: currentProject.name,
        description: currentProject.description,
        startDate: currentProject.startDate,
        endDate: currentProject.endDate,
        status: currentProject.status,
        priority: currentProject.priority,
        manager: currentProject.manager,
        budget: currentProject.budget,
        actualCost: currentProject.actualCost,
        currency: currentProject.currency,
        baseline: currentProject.baseline,
        settings: currentProject.settings,
      });
    }
  }, [isEditMode, currentProject]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'プロジェクト名は必須です';
    }

    if (!formData.startDate) {
      newErrors.startDate = '開始日は必須です';
    }

    if (!formData.endDate) {
      newErrors.endDate = '終了日は必須です';
    }

    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = '終了日は開始日より後の日付を指定してください';
    }

    if (formData.budget < 0) {
      newErrors.budget = '予算は0以上で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode && currentProject) {
        const updates = {
          name: formData.name,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          priority: formData.priority,
          manager: formData.manager,
          budget: formData.budget,
          currency: formData.currency,
          settings: formData.settings,
        };

        await dispatch(updateProject({
          projectId: currentProject.id,
          updates
        })).unwrap();

        dispatch(showNotification({
          message: 'プロジェクトが更新されました',
          severity: 'success',
        }));
      } else {
        const projectData = {
          ...formData,
          progress: {
            plannedValue: 0,
            earnedValue: 0,
            actualCost: 0,
            schedulePerformanceIndex: 1,
            costPerformanceIndex: 1,
            scheduleVariance: 0,
            costVariance: 0,
          }
        };
        await dispatch(createProject(projectData)).unwrap();
        dispatch(showNotification({
          message: 'プロジェクトが作成されました',
          severity: 'success',
        }));
      }

      navigate('/projects');
    } catch (error) {
      dispatch(showNotification({
        message: `プロジェクトの${isEditMode ? '更新' : '作成'}に失敗しました`,
        severity: 'error',
      }));
    }
  };

  const handleCancel = () => {
    navigate('/projects');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box sx={{ padding: 3 }}>
        {/* ページヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleCancel}
            sx={{ marginRight: 2 }}
          >
            戻る
          </Button>
          <Typography variant="h4">
            {isEditMode ? 'プロジェクト編集' : '新規プロジェクト作成'}
          </Typography>
        </Box>

        <Paper sx={{ padding: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* 基本情報 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  基本情報
                </Typography>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="プロジェクト名"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>優先度</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    label="優先度"
                  >
                    <MenuItem value="low">低</MenuItem>
                    <MenuItem value="normal">通常</MenuItem>
                    <MenuItem value="high">高</MenuItem>
                    <MenuItem value="critical">緊急</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="説明"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>ステータス</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    label="ステータス"
                  >
                    <MenuItem value="planning">計画中</MenuItem>
                    <MenuItem value="active">実行中</MenuItem>
                    <MenuItem value="on_hold">保留中</MenuItem>
                    <MenuItem value="completed">完了</MenuItem>
                    <MenuItem value="cancelled">中止</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="プロジェクトマネージャー"
                  value={formData.manager}
                  onChange={(e) => handleInputChange('manager', e.target.value)}
                />
              </Grid>

              <Divider sx={{ width: '100%', margin: '24px 0' }} />

              {/* スケジュール情報 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  スケジュール
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="開始日"
                  value={formData.startDate}
                  onChange={(date) => handleInputChange('startDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: Boolean(errors.startDate),
                      helperText: errors.startDate,
                      required: true,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="終了日"
                  value={formData.endDate}
                  onChange={(date) => handleInputChange('endDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: Boolean(errors.endDate),
                      helperText: errors.endDate,
                      required: true,
                    },
                  }}
                />
              </Grid>

              <Divider sx={{ width: '100%', margin: '24px 0' }} />

              {/* 予算情報 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  予算
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="予算"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', Number(e.target.value))}
                  error={Boolean(errors.budget)}
                  helperText={errors.budget}
                  InputProps={{
                    startAdornment: <Typography sx={{ marginRight: 1 }}>¥</Typography>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>通貨</InputLabel>
                  <Select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    label="通貨"
                  >
                    <MenuItem value="JPY">日本円 (¥)</MenuItem>
                    <MenuItem value="USD">米ドル ($)</MenuItem>
                    <MenuItem value="EUR">ユーロ (€)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* アクションボタン */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginTop: 3 }}>
                  <Button variant="outlined" onClick={handleCancel}>
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={isLoading}
                  >
                    {isEditMode ? '更新' : '作成'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default ProjectDetail;