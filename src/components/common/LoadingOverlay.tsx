import React from 'react';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';

interface LoadingOverlayProps {
  message?: string;
  open?: boolean;
}

/**
 * ローディングオーバーレイコンポーネント
 * データ読み込み中にユーザーに視覚的なフィードバックを提供
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = '読み込み中...',
  open = true,
}) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
      open={open}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {message}
        </Typography>
      </Box>
    </Backdrop>
  );
};

export default LoadingOverlay;