// Electronモジュールのインポート（メインプロセス用）
import { app } from 'electron';

/**
 * 開発環境かどうかを判定するユーティリティ関数
 */
// Electronの開発サーバー（webpack dev server）を使う場合のみ true
// npm start（ビルド→ファイル読み込み）では false にして dist/index.html を読む
export const isDev = (): boolean => {
  return process.env.ELECTRON_DEV_SERVER === 'true';
};

/**
 * 本番環境かどうかを判定するユーティリティ関数
 */
export const isProd = (): boolean => {
  return !isDev();
};

/**
 * 現在のプラットフォームを取得
 */
export const getPlatform = (): 'win32' | 'darwin' | 'linux' | 'unknown' => {
  const platform = process.platform;
  if (platform === 'win32' || platform === 'darwin' || platform === 'linux') {
    return platform;
  }
  return 'unknown';
};

/**
 * アプリケーションのユーザーデータディレクトリを取得
 */
export const getUserDataPath = (): string => {
  return app.getPath('userData');
};

/**
 * アプリケーションのドキュメントディレクトリを取得
 */
export const getDocumentsPath = (): string => {
  return app.getPath('documents');
};
