import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  FormControlLabel,
  Switch,
  Chip,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Resource, ResourceType, ResourceSkill, SkillLevel } from '../../types/resource';
import { v4 as uuidv4 } from 'uuid';

interface ResourceDialogProps {
  open: boolean;
  resource: Resource | null;
  onClose: () => void;
  onSave: (resource: Resource) => void;
}

/**
 * リソース作成・編集ダイアログ
 */
const ResourceDialog: React.FC<ResourceDialogProps> = ({
  open,
  resource,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Resource>>({
    code: '',
    name: '',
    type: 'work',
    category: '',
    description: '',
    email: '',
    phone: '',
    department: '',
    standardRate: 0,
    overtimeRate: 0,
    costPerUse: 0,
    currency: 'JPY',
    maxUnits: 100,
    availability: [],
    allocations: [],
    skills: [],
    isActive: true,
    notes: '',
  });

  const [newSkill, setNewSkill] = useState<Partial<ResourceSkill>>({
    name: '',
    level: 'intermediate',
    certified: false,
  });

  useEffect(() => {
    if (resource) {
      setFormData(resource);
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'work',
        category: '',
        description: '',
        email: '',
        phone: '',
        department: '',
        standardRate: 0,
        overtimeRate: 0,
        costPerUse: 0,
        currency: 'JPY',
        maxUnits: 100,
        availability: [],
        allocations: [],
        skills: [],
        isActive: true,
        notes: '',
      });
    }
  }, [resource, open]);

  const handleChange = (field: keyof Resource, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.name && newSkill.level) {
      const skill: ResourceSkill = {
        name: newSkill.name,
        level: newSkill.level as SkillLevel,
        certified: newSkill.certified || false,
      };
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), skill],
      }));
      setNewSkill({
        name: '',
        level: 'intermediate',
        certified: false,
      });
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = () => {
    const now = new Date();
    const resourceData: Resource = {
      id: resource?.id || uuidv4(),
      code: formData.code || '',
      name: formData.name || '',
      type: formData.type || 'work',
      category: formData.category || '',
      description: formData.description || '',
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      standardRate: formData.standardRate || 0,
      overtimeRate: formData.overtimeRate || 0,
      costPerUse: formData.costPerUse || 0,
      currency: formData.currency || 'JPY',
      maxUnits: formData.maxUnits || 100,
      availability: formData.availability || [],
      allocations: formData.allocations || [],
      skills: formData.skills || [],
      isActive: formData.isActive !== false,
      notes: formData.notes || '',
      createdAt: resource?.createdAt || now,
      updatedAt: now,
    };

    onSave(resourceData);
    onClose();
  };

  const getSkillLevelLabel = (level: SkillLevel): string => {
    const labels: Record<SkillLevel, string> = {
      beginner: '初級',
      intermediate: '中級',
      advanced: '上級',
      expert: 'エキスパート',
    };
    return labels[level];
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {resource ? 'リソースの編集' : '新規リソース作成'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* 基本情報 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              基本情報
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="リソースコード"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="例: ENG001"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="リソース名"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="例: 山田太郎"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>リソースタイプ</InputLabel>
              <Select
                value={formData.type}
                label="リソースタイプ"
                onChange={(e) => handleChange('type', e.target.value as ResourceType)}
              >
                <MenuItem value="work">人的リソース</MenuItem>
                <MenuItem value="material">材料リソース</MenuItem>
                <MenuItem value="cost">コストリソース</MenuItem>
                <MenuItem value="equipment">設備リソース</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="カテゴリ"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="例: エンジニア"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="説明"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </Grid>

          {/* 連絡先情報 */}
          {formData.type === 'work' && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  連絡先情報
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="部署"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="電話番号"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </Grid>
            </>
          )}

          {/* コスト情報 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              コスト情報
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="標準単価"
              value={formData.standardRate}
              onChange={(e) => handleChange('standardRate', Number(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                endAdornment: <InputAdornment position="end">/時</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="残業単価"
              value={formData.overtimeRate}
              onChange={(e) => handleChange('overtimeRate', Number(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                endAdornment: <InputAdornment position="end">/時</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="使用ごとのコスト"
              value={formData.costPerUse}
              onChange={(e) => handleChange('costPerUse', Number(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">¥</InputAdornment>,
              }}
            />
          </Grid>

          {/* 稼働情報 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              稼働情報
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="最大稼働率"
              value={formData.maxUnits}
              onChange={(e) => handleChange('maxUnits', Number(e.target.value))}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{ min: 0, max: 200 }}
              helperText="100% = 1人分の稼働"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                />
              }
              label="アクティブ"
            />
          </Grid>

          {/* スキル情報 */}
          {formData.type === 'work' && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  スキル
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                  <TextField
                    label="スキル名"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    placeholder="例: JavaScript"
                    sx={{ flex: 1 }}
                  />
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>レベル</InputLabel>
                    <Select
                      value={newSkill.level}
                      label="レベル"
                      onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as SkillLevel })}
                    >
                      <MenuItem value="beginner">初級</MenuItem>
                      <MenuItem value="intermediate">中級</MenuItem>
                      <MenuItem value="advanced">上級</MenuItem>
                      <MenuItem value="expert">エキスパート</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddSkill}
                    disabled={!newSkill.name}
                  >
                    追加
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {formData.skills?.map((skill, index) => (
                    <Chip
                      key={index}
                      label={`${skill.name} (${getSkillLevelLabel(skill.level)})`}
                      onDelete={() => handleRemoveSkill(index)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            </>
          )}

          {/* 備考 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="備考"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.code || !formData.name}
        >
          {resource ? '更新' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResourceDialog;
