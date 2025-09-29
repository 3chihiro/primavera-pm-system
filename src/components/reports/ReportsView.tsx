import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

/**
 * レポート表示コンポーネント
 * Sprint 7で詳細実装予定
 */
const ReportsView: React.FC = () => {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        レポート
      </Typography>
      
      <Paper sx={{ padding: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          レポート生成機能
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ marginTop: 2 }}>
          この機能はSprint 7で実装予定です
        </Typography>
      </Paper>
    </Box>
  );
};

export default ReportsView;