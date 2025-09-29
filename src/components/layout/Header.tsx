import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountTree,
  Settings,
  Help,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../store/slices/appSlice';
import { RootState } from '../../store/store';

/**
 * アプリケーションのヘッダーコンポーネント
 * アプリケーションタイトル、ナビゲーション、システムメニューを含む
 */
const Header: React.FC = () => {
  const dispatch = useDispatch();
  const { currentProject } = useSelector((state: RootState) => ({
    currentProject: state.project.currentProject,
  }));

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1976d2',
      }}
    >
      <Toolbar>
        {/* サイドバー切り替えボタン */}
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          onClick={handleToggleSidebar}
          edge="start"
          sx={{ marginRight: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* アプリケーションアイコンとタイトル */}
        <AccountTree sx={{ marginRight: 1 }} />
        <Typography variant="h6" component="div" sx={{ marginRight: 3 }}>
          Primavera PM System
        </Typography>

        {/* 現在のプロジェクト表示 */}
        {currentProject && (
          <Box sx={{ marginRight: 'auto' }}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              プロジェクト:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {currentProject.name}
            </Typography>
          </Box>
        )}

        {/* 右側のアクション群 */}
        <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          {/* 設定ボタン */}
          <Tooltip title="設定">
            <IconButton
              color="inherit"
              aria-label="settings"
              onClick={() => {
                // TODO: 設定画面を開く
                console.log('設定画面を開く');
              }}
            >
              <Settings />
            </IconButton>
          </Tooltip>

          {/* ヘルプボタン */}
          <Tooltip title="ヘルプ">
            <IconButton
              color="inherit"
              aria-label="help"
              onClick={() => {
                // TODO: ヘルプ画面を開く
                console.log('ヘルプ画面を開く');
              }}
            >
              <Help />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;