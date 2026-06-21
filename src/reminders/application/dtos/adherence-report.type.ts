export type AdherenceReportLine = {
  medicationName: string;
  confirmed: number;
  skipped: number;
  pending: number;
  total: number;
  adherenceRate: number;
};

export type AdherenceReportOverall = {
  confirmed: number;
  skipped: number;
  pending: number;
  total: number;
  adherenceRate: number;
};

export type AdherenceReport = {
  rangeDays: number;
  from: Date;
  until: Date;
  lines: AdherenceReportLine[];
  overall: AdherenceReportOverall;
};
