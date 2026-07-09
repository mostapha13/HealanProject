import type { EchoPrintData } from '../api/types';
import { mapEchoFromApi } from './echoFields';
import { calculateAgeYears, formatJalaliDate } from './formatJalali';
import type { EchoPrintPayload } from './printEchoReport';

export function buildEchoPrintPayload(data: EchoPrintData): EchoPrintPayload {
  const patientBirthdate = formatJalaliDate(data.patientBirthdate) || null;
  const patientAge = data.patientAge || calculateAgeYears(data.patientBirthdate) || null;
  const examDate = formatJalaliDate(data.examDate) || data.examDate;

  return {
    patientName: data.patientName,
    patientNationalCode: data.patientNationalCode,
    patientBirthdate,
    patientAge,
    examDate,
    echo: mapEchoFromApi(data.echo as Record<string, unknown>),
  };
}
