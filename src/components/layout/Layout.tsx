import React, { ReactNode } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import Header from './Header';
import Sidebar from './Sidebar';
import LoadingOverlay from '../common/LoadingOverlay';

interface LayoutProps {
  children: ReactNode;
}

/**
 * アプリケーションのメインレイアウトコンポーネント
 * ヘッダー、サイドバー、メインコンテンツエリアを含む
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen, isLoading } = useSelector((state: RootState) => ({
    sidebarOpen: state.app.sidebarOpen,
    isLoading: state.app.isLoading,
  }));

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* ヘッダー */}
      <Header />
      
      {/* サイドバー */}
      <Sidebar open={sidebarOpen} />
      
      {/* メインコンテンツエリア */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          marginTop: '64px', // ヘッダーの高さ分
          marginLeft: sidebarOpen ? '280px' : '64px', // サイドバーの幅に応じて調整
          transition: (theme) =>
            theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          backgroundColor: '#f5f5f5',
          overflow: 'hidden',
        }}
      >
        {/* コンテンツエリア */}
        <Box
          sx={{
            flexGrow: 1,
            padding: 3,
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* ローディングオーバーレイ */}
      {isLoading && <LoadingOverlay />}
    </Box>
  );
};

export default Layout;