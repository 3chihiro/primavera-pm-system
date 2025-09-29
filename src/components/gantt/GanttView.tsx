import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

/**
 * ガントチャート表示コンポーネント
 * Sprint 3で詳細実装予定
 */
const GanttView: React.FC = () => {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        ガントチャート
      </Typography>
      
      <Paper sx={{ padding: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          ガントチャート表示機能
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ marginTop: 2 }}>
          この機能はSprint 3で実装予定です
        </Typography>
      </Paper>
    </Box>
  );
};

export default GanttView;