import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import type { ColDef, SideBarDef, StatusPanelDef } from '@tse/types';
import { AG_GRID_LOCALE_EN } from './locale.en';
import { AG_GRID_LOCALE_FA } from './locale.fa';

interface DynamicGridTypes<T> {
  columnDefs?: ColDef[];
  rowData?: T[];
  onGridReady?: any;
  sideBar?: boolean;
  enableRtl?: boolean;
  paginationAutoPageSize?: boolean;
  paginationPageSize?: number;
  className?: string;
  enableCharts?: boolean;
  enableRangeSelection?: boolean;
  pagination?: boolean;
  animateRows?: boolean;
  gridRef?: any;
  onRowClicked?: any;
  rowBuffer?: number;
  debounceVerticalScrollbar?: boolean;
  defaultSetting?: ColDef;
  rowGroupPanelShow?: 'never' | 'always' | 'onlyWhenGrouping';
  rowModelType?: 'clientSide' | 'infinite' | 'viewport' | 'serverSide';
  setPagination?: boolean;
  cacheBlockSize?: number;
  onFirstDataRendered?: any;
  paginationNumberFormatter?: any;
}

export function ExtendedTable<T>(props: DynamicGridTypes<T>) {
  const {
    columnDefs,
    onGridReady,
    rowData,
    // sideBar = true,
    rowGroupPanelShow = 'onlyWhenGrouping',
    paginationPageSize,
    className,
    enableRtl,
    paginationAutoPageSize = false,
    defaultSetting,
    enableCharts = true,
    enableRangeSelection = true,
    pagination = true,
    animateRows = false,
    debounceVerticalScrollbar = true,
    rowBuffer = 10,
    rowModelType = 'clientSide',
    gridRef,
    onRowClicked,
    setPagination,
    cacheBlockSize,
    onFirstDataRendered,
    paginationNumberFormatter,
  } = props;
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
  const localeText = useMemo<{
    [key: string]: string;
  }>(() => {
    return enableRtl ? AG_GRID_LOCALE_ZZZ_FA : AG_GRID_LOCALE_ZZZ_EN;
  }, [enableRtl]);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      sortable: true,
      //flex: 1,
      minWidth: 80,
      filter: true,
      resizable: true,
      enableRowGroup: false,
      enableValue: false,
      // tooltipComponent: () => {
      //   return <div>ddd</div>;
      // },
      ...defaultSetting,
    };
  }, []);

  const sideBar = useMemo<
    SideBarDef | string | string[] | boolean | null
  >(() => {
    return {
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          minWidth: 225,
          width: 225,
          maxWidth: 225,
        },
        {
          id: 'filters',
          labelDefault: 'Filters',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel',
          minWidth: 180,
          maxWidth: 400,
          width: 250,
        },
      ],
      // position: 'right',
      // defaultToolPanel: 'columns',
    };
  }, []);

  const statusBar = useMemo<{
    statusPanels: StatusPanelDef[];
  }>(() => {
    return {
      statusPanels: [
        { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
        { statusPanel: 'agAggregationComponent', align: 'right' },
      ],
    };
  }, []);
  const getRowClass = (params: any) => {
    if (params.node.rowIndex % 2 === 0) {
      return '!bg-[#f1f1f1]';
    } else return '!bg-[#fff]';
  };
  const autoGroupColumnDef = useMemo<ColDef>(() => {
    return {
      flex: 1,
      minWidth: 280,
      field: 'tradeCount.value',
    };
  }, []);

  return (
    <div className={`h-screen ${className}`}>
      <div style={gridStyle} className="ag-theme-balham">
        <AgGridReact<T>
          {...{
            rowData: Array.isArray(rowData) ? rowData : [],
            columnDefs,
            localeText,
            defaultColDef,
            sideBar,
            statusBar,
            rowGroupPanelShow,
            pagination,
            paginationPageSize,
            paginationAutoPageSize,
            enableRangeSelection,
            enableCharts,
            onGridReady,
            enableRtl,
            animateRows,
            debounceVerticalScrollbar,
            rowBuffer,
            rowModelType,
            ref: gridRef,
            getRowClass,
            // autoGroupColumnDef,
            onRowClicked,
            setPagination,
            cacheBlockSize,
            onFirstDataRendered,
            paginationNumberFormatter,
          }}
        />
      </div>
    </div>
  );
}

let AG_GRID_LOCALE_ZZZ_EN: any = {};
let AG_GRID_LOCALE_ZZZ_FA: any = {};

// Create a dummy locale based on english but prefix everything with zzz
Object.keys(AG_GRID_LOCALE_EN).forEach(function (key: any) {
  if (key === 'thousandSeparator' || key === 'decimalSeparator') {
    return;
  }
  AG_GRID_LOCALE_ZZZ_EN[key] = AG_GRID_LOCALE_EN[key];
});

// Create a dummy locale based on english but prefix everything with zzz
Object.keys(AG_GRID_LOCALE_FA).forEach(function (key: any) {
  if (key === 'thousandSeparator' || key === 'decimalSeparator') {
    return;
  }
  AG_GRID_LOCALE_ZZZ_FA[key] = AG_GRID_LOCALE_FA[key];
});
