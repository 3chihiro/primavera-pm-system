import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * エラーバウンダリコンポーネント
 * アプリケーション内で発生した予期しないエラーをキャッチし、
 * ユーザーフレンドリーなエラー画面を表示する
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // エラーが発生した際にstateを更新してエラーUIを表示
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーログの記録
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 本番環境では、ここでエラー追跡サービス（例：Sentry）に送信
    // if (isProd()) {
    //   sendErrorToTrackingService(error, errorInfo);
    // }
  }

  handleReload = () => {
    // アプリケーションをリロード
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 3,
            backgroundColor: '#f5f5f5',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              maxWidth: 600,
              textAlign: 'center',
            }}
          >
            <ErrorOutline
              color="error"
              sx={{ fontSize: 64, marginBottom: 2 }}
            />
            
            <Typography variant="h4" gutterBottom color="error">
              予期しないエラーが発生しました
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              申し訳ございませんが、アプリケーションでエラーが発生しました。
              この問題は開発チームに報告されます。
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleReload}
              sx={{ marginTop: 2 }}
            >
              アプリを再起動
            </Button>

            {/* 開発環境でのデバッグ情報表示 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ marginTop: 3, textAlign: 'left' }}>
                <Typography variant="h6" color="error" gutterBottom>
                  デバッグ情報:
                </Typography>
                
                <Paper
                  sx={{
                    padding: 2,
                    backgroundColor: '#f5f5f5',
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    <strong>エラー:</strong> {this.state.error.message}
                    {'\n\n'}
                    <strong>スタックトレース:</strong>
                    {'\n'}
                    {this.state.error.stack}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <strong>コンポーネントスタック:</strong>
                        {'\n'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;