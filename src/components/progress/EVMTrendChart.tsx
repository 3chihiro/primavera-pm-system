import React from 'react';
import {
  Box,
  Typography,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { EVMTrend } from '../../types/progress';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface EVMTrendChartProps {
  trends: EVMTrend[];
  title?: string;
}

/**
 * EVMトレンドグラフ
 * PV/EV/ACの時系列推移を表示
 */
const EVMTrendChart: React.FC<EVMTrendChartProps> = ({
  trends,
  title = 'EVMトレンド',
}) => {
  const [viewMode, setViewMode] = React.useState<'value' | 'index'>('value');

  // グラフ用のデータを整形
  const chartData = trends.map((trend) => ({
    date: format(trend.date, 'M/d', { locale: ja }),
    fullDate: format(trend.date, 'yyyy年M月d日', { locale: ja }),
    pv: Math.round(trend.pv),
    ev: Math.round(trend.ev),
    ac: Math.round(trend.ac),
    cpi: Number(trend.cpi.toFixed(2)),
    spi: Number(trend.spi.toFixed(2)),
  }));

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="caption" fontWeight="bold">
            {data.fullDate}
          </Typography>
          {viewMode === 'value' ? (
            <>
              <Typography variant="body2" color="primary">
                PV: ¥{data.pv.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="success.main">
                EV: ¥{data.ev.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="error">
                AC: ¥{data.ac.toLocaleString()}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body2" color="primary">
                SPI: {data.spi}
              </Typography>
              <Typography variant="body2" color="success.main">
                CPI: {data.cpi}
              </Typography>
            </>
          )}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value="value">
            金額
          </ToggleButton>
          <ToggleButton value="index">
            指標
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {viewMode === 'value' ? (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            PV（計画値）、EV（出来高）、AC（実コスト）の推移
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="pv"
                stroke="#1976d2"
                strokeWidth={2}
                name="PV（計画値）"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="ev"
                stroke="#2e7d32"
                strokeWidth={2}
                name="EV（出来高）"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="ac"
                stroke="#d32f2f"
                strokeWidth={2}
                name="AC（実コスト）"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* 凡例説明 */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" display="block">
              <strong>PV（青線）:</strong> 計画値 - 基準日時点で計画通りに進んでいた場合の価値
            </Typography>
            <Typography variant="caption" display="block">
              <strong>EV（緑線）:</strong> 出来高 - 実際に完了した作業の価値
            </Typography>
            <Typography variant="caption" display="block">
              <strong>AC（赤線）:</strong> 実コスト - 実際に発生したコスト
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              • EVがPVより上 → スケジュール先行 | EVがPVより下 → スケジュール遅延
            </Typography>
            <Typography variant="caption" display="block">
              • EVがACより上 → 予算内 | EVがACより下 → 予算超過
            </Typography>
          </Box>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            CPI（コスト効率指標）、SPI（スケジュール効率指標）の推移
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 2]} ticks={[0, 0.5, 1.0, 1.5, 2.0]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {/* 基準線（1.0） */}
              <Line
                type="monotone"
                dataKey={() => 1.0}
                stroke="#999"
                strokeDasharray="5 5"
                strokeWidth={1}
                name="基準（1.0）"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="spi"
                stroke="#1976d2"
                strokeWidth={2}
                name="SPI（スケジュール効率）"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="cpi"
                stroke="#2e7d32"
                strokeWidth={2}
                name="CPI（コスト効率）"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* 指標説明 */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" display="block">
              <strong>SPI（青線）:</strong> スケジュール効率指標 = EV / PV
            </Typography>
            <Typography variant="caption" display="block">
              <strong>CPI（緑線）:</strong> コスト効率指標 = EV / AC
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              • 1.0より上 → 効率良好 | 1.0 → 計画通り | 1.0より下 → 効率悪化
            </Typography>
            <Typography variant="caption" display="block">
              • SPI &gt; 1.0: スケジュール先行 | SPI &lt; 1.0: スケジュール遅延
            </Typography>
            <Typography variant="caption" display="block">
              • CPI &gt; 1.0: 予算内で進行 | CPI &lt; 1.0: 予算超過
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default EVMTrendChart;
