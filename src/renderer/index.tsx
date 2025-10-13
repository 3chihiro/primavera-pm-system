import './polyfill'; // EventEmitter polyfill - must be first
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from '../store/store';
import App from './App';
import { setupMockElectronAPI } from '../utils/mockElectronAPI';

// Material-UI縺ｮ繧ｫ繧ｹ繧ｿ繝繝・・繝櫁ｨｭ螳・
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#f57c00',
      light: '#ffb74d',
      dark: '#ef6c00',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// 繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ縺ｮ蛻晄悄蛹・
const initializeApp = async (): Promise<void> => {
  try {
    // 繝悶Λ繧ｦ繧ｶ迺ｰ蠅・・蝣ｴ蜷医√Δ繝・けAPI繧偵そ繝・ヨ繧｢繝・・
    if (typeof window !== 'undefined' && !(window as any).electronAPI) {
      console.log('繝悶Λ繧ｦ繧ｶ迺ｰ蠅・〒螳溯｡御ｸｭ - 繝｢繝・けElectron API繧剃ｽｿ逕ｨ');
      setupMockElectronAPI();
    }

    // 繝・・繧ｿ繝吶・繧ｹ縺ｮ蛻晄悄蛹・
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      const dbResult = await (window as any).electronAPI.database.initialize();
      if (!dbResult.success) {
        console.error('繝・・繧ｿ繝吶・繧ｹ縺ｮ蛻晄悄蛹悶↓螟ｱ謨励＠縺ｾ縺励◆:', dbResult.error);
      } else {
        console.log('繝・・繧ｿ繝吶・繧ｹ縺ｮ蛻晄悄蛹悶′螳御ｺ・＠縺ｾ縺励◆');
      }
    }
  } catch (error) {
    console.error('繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ縺ｮ蛻晄悄蛹悶↓螟ｱ謨励＠縺ｾ縺励◆:', error);
  }
};

// React繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ縺ｮ繝ｬ繝ｳ繝繝ｪ繝ｳ繧ｰ
const renderApp = (): void => {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root element not found');
  }

  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <HashRouter>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
          </ThemeProvider>
        </HashRouter>
      </Provider>
    </React.StrictMode>
  );
};

// DOM隱ｭ縺ｿ霎ｼ縺ｿ螳御ｺ・ｾ後↓繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ繧貞・譛溷喧
// 起動：先に描画し、初期化は並列実行（待機で固まらないように）
const boot = () => {
  try {
    renderApp();
    void initializeApp();
  } catch (e) {
    console.error('Boot error:', e);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
