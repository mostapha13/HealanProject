import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { ClassNames } from '@emotion/react';
const mockData = [
  {
    name: 'Process',
    y: 60,
    sliced: false,
    selected: false,
  },
  {
    name: 'Fail',
    y: 20,
    sliced: false,
    selected: false,
  },
  {
    name: '',
    y: 20,
    sliced: false,
    selected: false,
  },
];
interface PieChartProps {
  className?: any;
  data?: any;
  width?: number;
  height?: number;
  title?: string;
  color?: any;
}
export function PieChart({
  className,
  data,
  width,
  height,
  title,
  color,
}: PieChartProps) {
  const options = {
    chart: {
      type: 'pie',
      height: height ? height : 140,
      width: width ? width : 140,
    },
    title: {
      verticalAlign: 'middle',
      floating: true,
      text: title ? title : 'نمودار',
    },
    credits: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        shadow: false,
        colors: color ? color : ['#FF7676', '#91D0BD', '#FFD12F'],
      },
    },
    series: [
      {
        name: 'درصد',
        size: '130%',
        innerSize: '70%',
        data: data ? data : mockData,
        dataLabels: {
          formatter: function (): any {
            const _this: any = this;
            return _this.point.name;
          },
          color: '#ffffff',
          distance: -12,
        },
      },
    ],
    tooltip: {
      useHTML: true,
      headerFormat: '<table>',
      footerFormat: '</table>',
      followPointer: true,
      shared: true,
      formatter() {
        const _this: any = this;
        return `
            <tr><th><h1>${_this.point?.name}</h1></th></tr>
            <tr><th></th><td>${_this.point?.y.toFixed(2)} : درصد </td></tr>
         `;
      },
    },
  };
  return (
    <div className={` overflow-hidden ${className}`}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
