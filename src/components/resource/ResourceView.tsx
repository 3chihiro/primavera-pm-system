import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

/**
 * リソース管理表示コンポーネント
 * Sprint 5で詳細実装予定
 */
const ResourceView: React.FC = () => {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        リソース管理
      </Typography>
      
      <Paper sx={{ padding: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          リソース管理機能
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ marginTop: 2 }}>
          この機能はSprint 5で実装予定です
        </Typography>
      </Paper>
    </Box>
  );
};

export default ResourceView;