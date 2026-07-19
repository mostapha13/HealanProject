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
  /** وقتی هدر بیرون از چارت است */
  hideTitle?: boolean;
  /** داخل کارت والد — بدون حاشیه/سایه اضافه */
  embedded?: boolean;
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
  hideTitle = false,
  embedded = false,
}: ReportsChartProps) {
  const hasData = series.some((s) => s.data.some((v) => v > 0));

  const options = useMemo<Highcharts.Options>(() => {
    const base: Highcharts.Options = {
      chart: {
        type,
        height,
        backgroundColor: 'transparent',
        style: { fontFamily: 'Tahoma, Vazirmatn, sans-serif' },
        spacing: embedded ? [8, 4, 8, 4] : [12, 10, 10, 10],
      },
      title: hideTitle
        ? { text: undefined }
        : { text: title, style: { fontSize: '14px', fontWeight: '600', color: '#0f172a' } },
      credits: { enabled: false },
      colors: CHART_COLORS,
      legend: {
        enabled: type === 'pie' || series.length > 1,
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: { fontSize: '11px', fontWeight: '600', color: '#475569' },
      },
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
        lineColor: '#e2e8f0',
        tickColor: '#e2e8f0',
        labels: {
          style: { fontSize: '10px', color: '#64748b' },
          rotation: categories.some((c) => c.length > 14) ? -35 : 0,
        },
      },
      yAxis: {
        min: type === 'line' ? undefined : 0,
        softMin: type === 'line' ? 40 : undefined,
        gridLineColor: '#f1f5f9',
        title: {
          text: yAxisTitle ?? '',
          style: { fontSize: '11px', color: '#94a3b8', fontWeight: '600' },
        },
        labels: { style: { fontSize: '11px', color: '#64748b' } },
      },
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderWidth: 0,
        borderRadius: 10,
        style: { color: '#f8fafc', fontSize: '12px' },
        shadow: false,
      },
      plotOptions: {
        column: {
          borderRadius: 5,
          borderWidth: 0,
          groupPadding: 0.12,
          pointPadding: 0.08,
        },
        bar: { borderRadius: 4 },
        line: {
          marker: {
            radius: 5,
            symbol: 'circle',
            lineWidth: 2,
            lineColor: '#fff',
            states: { hover: { radius: 7, lineWidth: 2 } },
          },
          lineWidth: 2.75,
          connectNulls: false,
        },
        series: {
          animation: { duration: 650 },
        },
      },
      series: series.map((s) => ({
        type,
        name: s.name,
        data: s.data,
        color: s.color,
      })) as Highcharts.SeriesOptionsType[],
    };
  }, [type, title, categories, series, height, yAxisTitle, hideTitle, embedded]);

  const wrapClass = [
    'healan-chart-card',
    embedded ? 'healan-chart-card--embedded' : '',
    !hasData ? 'healan-chart-card--empty' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (!hasData) {
    return (
      <div className={wrapClass} style={{ minHeight: Math.max(height - 40, 180) }}>
        {!hideTitle && <h4>{title}</h4>}
        <div className="healan-chart-card__empty-icon" aria-hidden="true">
          📈
        </div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={wrapClass}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
