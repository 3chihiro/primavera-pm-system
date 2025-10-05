import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ViewList as ViewListIcon,
  BarChart as BarChartIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import {
  setView,
  setFilter,
  setSelectedResource,
  deleteResource,
  addResource,
  updateResource,
} from '../../store/slices/resourceSlice';
import { Resource, ResourceType } from '../../types/resource';
import ResourceDialog from './ResourceDialog';

/**
 * リソース管理表示コンポーネント
 */
const ResourceView: React.FC = () => {
  const dispatch = useDispatch();
  const { items, view, filter, selectedResource } = useSelector((state: RootState) => state.resource);
  const [searchText, setSearchText] = useState(filter.search);
  const [dialogOpen, setDialogOpen] = useState(false);

  // リソースタイプの日本語表示
  const getResourceTypeLabel = (type: ResourceType): string => {
    const labels: Record<ResourceType, string> = {
      work: '人的',
      material: '材料',
      cost: 'コスト',
      equipment: '設備',
    };
    return labels[type];
  };

  // リソースタイプの色
  const getResourceTypeColor = (type: ResourceType): 'primary' | 'success' | 'warning' | 'info' => {
    const colors: Record<ResourceType, 'primary' | 'success' | 'warning' | 'info'> = {
      work: 'primary',
      material: 'success',
      cost: 'warning',
      equipment: 'info',
    };
    return colors[type];
  };

  // フィルタリング処理
  const filteredResources = items.filter((resource) => {
    if (filter.type !== 'all' && resource.type !== filter.type) {
      return false;
    }
    if (searchText && !resource.name.toLowerCase().includes(searchText.toLowerCase()) &&
        !resource.code.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    return true;
  });

  // ビュー切り替えハンドラー
  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: 'list' | 'histogram' | 'usage' | null,
  ) => {
    if (newView !== null) {
      dispatch(setView(newView));
    }
  };

  // 検索処理
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchText(value);
    dispatch(setFilter({ search: value }));
  };

  // 新規作成
  const handleCreate = () => {
    dispatch(setSelectedResource(null));
    setDialogOpen(true);
  };

  // リソース編集
  const handleEdit = (resource: Resource) => {
    dispatch(setSelectedResource(resource));
    setDialogOpen(true);
  };

  // リソース削除
  const handleDelete = (resourceId: string) => {
    if (window.confirm('このリソースを削除してもよろしいですか？')) {
      dispatch(deleteResource(resourceId));
    }
  };

  // ダイアログから保存
  const handleSave = (resource: Resource) => {
    if (selectedResource) {
      dispatch(updateResource(resource));
    } else {
      dispatch(addResource(resource));
    }
    setDialogOpen(false);
  };

  // ダイアログを閉じる
  const handleDialogClose = () => {
    setDialogOpen(false);
    dispatch(setSelectedResource(null));
  };

  // リスト表示
  const renderListView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>コード</TableCell>
            <TableCell>名前</TableCell>
            <TableCell>タイプ</TableCell>
            <TableCell>部署</TableCell>
            <TableCell align="right">標準単価</TableCell>
            <TableCell align="center">最大稼働率</TableCell>
            <TableCell align="center">ステータス</TableCell>
            <TableCell align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredResources.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                  リソースが登録されていません
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            filteredResources.map((resource) => (
              <TableRow key={resource.id} hover>
                <TableCell>{resource.code}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {resource.name}
                  </Typography>
                  {resource.description && (
                    <Typography variant="caption" color="text.secondary">
                      {resource.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getResourceTypeLabel(resource.type)}
                    color={getResourceTypeColor(resource.type)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{resource.department || '-'}</TableCell>
                <TableCell align="right">
                  {resource.standardRate > 0
                    ? `¥${resource.standardRate.toLocaleString()}/h`
                    : '-'}
                </TableCell>
                <TableCell align="center">{resource.maxUnits}%</TableCell>
                <TableCell align="center">
                  <Chip
                    label={resource.isActive ? 'アクティブ' : '非アクティブ'}
                    color={resource.isActive ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="編集">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEdit(resource)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="削除">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(resource.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // ヒストグラム表示（プレースホルダー）
  const renderHistogramView = () => (
    <Paper sx={{ padding: 3, textAlign: 'center', minHeight: 400 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        リソースヒストグラム
      </Typography>
      <Typography variant="body2" color="text.secondary">
        リソースの時間別使用状況をグラフで表示します（実装予定）
      </Typography>
    </Paper>
  );

  // 使用率表示（プレースホルダー）
  const renderUsageView = () => (
    <Paper sx={{ padding: 3, textAlign: 'center', minHeight: 400 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        リソース使用率レポート
      </Typography>
      <Typography variant="body2" color="text.secondary">
        リソースの使用率と効率性の詳細レポートを表示します（実装予定）
      </Typography>
    </Paper>
  );

  return (
    <Box sx={{ padding: 3 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">リソース管理</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          新規リソース
        </Button>
      </Box>

      {/* ツールバー */}
      <Paper sx={{ mb: 3 }}>
        <Toolbar>
          {/* 検索 */}
          <TextField
            size="small"
            placeholder="リソース名またはコードで検索"
            value={searchText}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />

          {/* スペーサー */}
          <Box sx={{ flexGrow: 1 }} />

          {/* ビュー切り替え */}
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            aria-label="表示切り替え"
            size="small"
          >
            <ToggleButton value="list" aria-label="リスト表示">
              <Tooltip title="リスト表示">
                <ViewListIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="histogram" aria-label="ヒストグラム表示">
              <Tooltip title="ヒストグラム表示">
                <BarChartIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="usage" aria-label="使用率表示">
              <Tooltip title="使用率表示">
                <AssessmentIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Toolbar>
      </Paper>

      {/* メインコンテンツ */}
      {view === 'list' && renderListView()}
      {view === 'histogram' && renderHistogramView()}
      {view === 'usage' && renderUsageView()}

      {/* リソース作成・編集ダイアログ */}
      <ResourceDialog
        open={dialogOpen}
        resource={selectedResource}
        onClose={handleDialogClose}
        onSave={handleSave}
      />
    </Box>
  );
};

export default ResourceView;