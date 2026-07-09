export type EchoReportForm = {
  phm: string;
  rvid: string;
  lvidd: string;
  lvids: string;
  ivsd: string;
  pwd: string;
  lvef: string;
  simpsonEf: string;
  lvMass: string;
  sm: string;
  telIndex: string;
  avAnnulus: string;
  sinusValsalva: string;
  stJunction: string;
  acs: string;
  ascAo: string;
  laArea: string;
  laDia: string;
  laVolume: string;
  edv: string;
  esv: string;
  mve: string;
  mva: string;
  mvdt: string;
  mvpht: string;
  mvMean: string;
  mvArea: string;
  mvAnnulus: string;
  pvsMax: string;
  pvdMax: string;
  dtiEm: string;
  dtiAm: string;
  aovMax: string;
  lvotVmax: string;
  lvotVti: string;
  avVti: string;
  aoPeak: string;
  aoMean: string;
  ava: string;
  at: string;
  aovMg: string;
  aovPg: string;
  trgMax: string;
  rvsp: string;
  pap: string;
  tvMean: string;
  tvAnnulus: string;
  tvMg: string;
  tvPg: string;
  pvMax: string;
  pvPg: string;
  pvVti: string;
  rvotVti: string;
  piphi: string;
  ivc: string;
  raArea: string;
  septalE: string;
  lateralE: string;
  sPrime: string;
  aPrime: string;
  smTdi: string;
  tapsie: string;
  conclusion: string;
  recommendation: string;
};

export const emptyEchoReport = (): EchoReportForm => ({
  phm: '',
  rvid: '',
  lvidd: '',
  lvids: '',
  ivsd: '',
  pwd: '',
  lvef: '',
  simpsonEf: '',
  lvMass: '',
  sm: '',
  telIndex: '',
  avAnnulus: '',
  sinusValsalva: '',
  stJunction: '',
  acs: '',
  ascAo: '',
  laArea: '',
  laDia: '',
  laVolume: '',
  edv: '',
  esv: '',
  mve: '',
  mva: '',
  mvdt: '',
  mvpht: '',
  mvMean: '',
  mvArea: '',
  mvAnnulus: '',
  pvsMax: '',
  pvdMax: '',
  dtiEm: '',
  dtiAm: '',
  aovMax: '',
  lvotVmax: '',
  lvotVti: '',
  avVti: '',
  aoPeak: '',
  aoMean: '',
  ava: '',
  at: '',
  aovMg: '',
  aovPg: '',
  trgMax: '',
  rvsp: '',
  pap: '',
  tvMean: '',
  tvAnnulus: '',
  tvMg: '',
  tvPg: '',
  pvMax: '',
  pvPg: '',
  pvVti: '',
  rvotVti: '',
  piphi: '',
  ivc: '',
  raArea: '',
  septalE: '',
  lateralE: '',
  sPrime: '',
  aPrime: '',
  smTdi: '',
  tapsie: '',
  conclusion: '',
  recommendation: '',
});

export type EchoFieldDef = { key: keyof EchoReportForm; label: string; range: string };

export const ECHO_SECTIONS: { title: string; fields: EchoFieldDef[] }[] = [
  {
    title: '2D / M-mode',
    fields: [
      { key: 'rvid', label: 'RVID', range: '0.9-2.6 cm' },
      { key: 'lvidd', label: 'LVIDd', range: '3.9-5.3 cm' },
      { key: 'lvids', label: 'LVIDs', range: '2.4-3.6 cm' },
      { key: 'ivsd', label: 'IVSD', range: '0.6-0.9 cm' },
      { key: 'pwd', label: 'PWd', range: '0.6-0.9 cm' },
      { key: 'lvef', label: 'LVEF', range: '>55%' },
      { key: 'simpsonEf', label: 'Simpson EF', range: '' },
      { key: 'lvMass', label: 'LV mass', range: '66-150 g' },
      { key: 'sm', label: 'Sm', range: '>9 cm/s' },
      { key: 'telIndex', label: 'Tel Index', range: '' },
      { key: 'avAnnulus', label: 'AV Annulus', range: '2-2.4 cm' },
      { key: 'sinusValsalva', label: 'Sinus Valsalva', range: '2.9-3.5 cm' },
      { key: 'stJunction', label: 'ST junction', range: '2-2.4 cm' },
      { key: 'acs', label: 'ACS', range: '1.5-2 cm' },
      { key: 'ascAo', label: 'Asc Ao', range: '2.5-2.9 cm' },
      { key: 'laArea', label: 'LA area', range: '<20 cm²' },
      { key: 'laDia', label: 'LA Dia', range: '2.7-3.8 cm' },
      { key: 'laVolume', label: 'LA Volume', range: '' },
      { key: 'edv', label: 'EDV', range: '' },
      { key: 'esv', label: 'ESV', range: '' },
    ],
  },
  {
    title: 'MV + Diastole',
    fields: [
      { key: 'mve', label: 'MVE', range: '0.6-1.3 m/s' },
      { key: 'mva', label: 'MVA', range: '0.3-0.7 m/s' },
      { key: 'mvdt', label: 'MVDT', range: '160-240 m' },
      { key: 'mvpht', label: 'MVPHT', range: '<150' },
      { key: 'mvMean', label: 'MV mean', range: '<5 mmHg' },
      { key: 'mvArea', label: 'MV Area', range: '4-6 cm²' },
      { key: 'mvAnnulus', label: 'MV Annulus', range: '2.5-3.1 cm' },
      { key: 'pvsMax', label: 'PVS max', range: '0.4-0.8 cm/s' },
      { key: 'pvdMax', label: 'PVDmax', range: '0.2-0.6 cm/s' },
      { key: 'dtiEm', label: 'DTI Em', range: '' },
      { key: 'dtiAm', label: 'DTI Am', range: '' },
    ],
  },
  {
    title: 'AOV',
    fields: [
      { key: 'aovMax', label: 'AOV max', range: '1-1.7 m/s' },
      { key: 'lvotVmax', label: 'LVOT Vmax', range: '0.7-1.1 m/s' },
      { key: 'lvotVti', label: 'LVOT VTI', range: '' },
      { key: 'avVti', label: 'AV VTI', range: '' },
      { key: 'aoPeak', label: 'AO peak', range: '' },
      { key: 'aoMean', label: 'AO mean', range: '<10 mmHg' },
      { key: 'ava', label: 'AVA', range: '2-4 cm²' },
      { key: 'at', label: 'AT', range: '' },
      { key: 'aovMg', label: 'MG', range: '' },
      { key: 'aovPg', label: 'PG', range: '' },
    ],
  },
  {
    title: 'TV / PV',
    fields: [
      { key: 'trgMax', label: 'TRGmax', range: '' },
      { key: 'rvsp', label: 'RVSP', range: '<36 mmHg' },
      { key: 'pap', label: 'PAP', range: '<36 mmHg' },
      { key: 'tvMean', label: 'TV mean', range: '<5 mmHg' },
      { key: 'tvAnnulus', label: 'TV Annulus', range: '1.3-2.8 cm' },
      { key: 'tvMg', label: 'MG', range: '' },
      { key: 'tvPg', label: 'PG', range: '' },
      { key: 'pvMax', label: 'PVmax', range: '0.4-0.8 cm/s' },
      { key: 'pvPg', label: 'PVPG', range: '<10 mmHg' },
      { key: 'pvVti', label: 'PV VTI', range: '' },
      { key: 'rvotVti', label: 'RVOT VTI', range: '' },
      { key: 'piphi', label: 'PIPHI', range: '' },
      { key: 'ivc', label: 'IVC', range: '1.2-2.3 cm' },
      { key: 'raArea', label: 'Ra area', range: '<18 cm²' },
    ],
  },
  {
    title: 'IDI-LV',
    fields: [
      { key: 'septalE', label: "Septal e'", range: '>8 cm/s' },
      { key: 'lateralE', label: "Lateral e'", range: '>10 cm/s' },
      { key: 'sPrime', label: "S'", range: '' },
      { key: 'aPrime', label: "A'", range: '' },
    ],
  },
  {
    title: 'RV',
    fields: [
      { key: 'smTdi', label: 'Sm TDI', range: '' },
      { key: 'tapsie', label: 'Tapsie', range: '>1.6 cm' },
    ],
  },
];

export function mapEchoFromApi(raw: Record<string, unknown> | null | undefined): EchoReportForm {
  const base = emptyEchoReport();
  if (!raw) return base;
  (Object.keys(base) as (keyof EchoReportForm)[]).forEach((key) => {
    const value = raw[key] ?? raw[key.charAt(0).toUpperCase() + key.slice(1)];
    if (typeof value === 'string') base[key] = value;
    else if (value != null) base[key] = String(value);
  });
  return base;
}

export function echoHasAnyValue(echo: EchoReportForm): boolean {
  return Object.values(echo).some((v) => String(v ?? '').trim().length > 0);
}
