import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

export type ReportsChartType = 'column' | 'line' | 'pie' | 'bar';

export interface ReportsChartProps {
  type: ReportsChartType;
  title: string;
  categories?: string[];
  series: { name: string; data: number[]; color?: string }[];
  height?: number;
  yAxisTitle?: string;
  emptyMessage?: string;
}

const CHART_COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

export function ReportsChart({
  type,
  title,
  categories = [],
  series,
  height = 320,
  yAxisTitle,
  emptyMessage = 'داده‌ای برای نمایش وجود ندارد',
}: ReportsChartProps) {
  const hasData = series.some((s) => s.data.some((v) => v > 0));

  const options = useMemo<Highcharts.Options>(() => {
    const base: Highcharts.Options = {
      chart: { type, height, style: { fontFamily: 'Tahoma, Vazirmatn, sans-serif' } },
      title: { text: title, style: { fontSize: '14px', fontWeight: '600' } },
      credits: { enabled: false },
      colors: CHART_COLORS,
      legend: { enabled: type === 'pie' || series.length > 1 },
    };

    if (type === 'pie') {
      const pieData = categories.map((name, i) => ({
        name,
        y: series[0]?.data[i] ?? 0,
      }));
      return {
        ...base,
        tooltip: { pointFormat: '<b>{point.y}</b> ({point.percentage:.1f}%)' },
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.y}' },
          },
        },
        series: [{ type: 'pie', name: series[0]?.name ?? '', data: pieData }],
      };
    }

    return {
      ...base,
      xAxis: {
        categories,
        crosshair: true,
        labels: {
          style: { fontSize: '10px' },
          rotation: categories.some((c) => c.length > 14) ? -35 : 0,
        },
      },
      yAxis: {
        min: 0,
        title: { text: yAxisTitle ?? '' },
        labels: { style: { fontSize: '11px' } },
      },
      tooltip: { shared: true },
      plotOptions: {
        column: { borderRadius: 4 },
        bar: { borderRadius: 4 },
        line: { marker: { radius: 4 } },
      },
      series: series.map((s) => ({
        type,
        name: s.name,
        data: s.data,
        color: s.color,
      })) as Highcharts.SeriesOptionsType[],
    };
  }, [type, title, categories, series, height, yAxisTitle]);

  if (!hasData) {
    return (
      <div className="healan-chart-card healan-chart-card--empty" style={{ minHeight: height }}>
        <h4>{title}</h4>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="healan-chart-card">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
