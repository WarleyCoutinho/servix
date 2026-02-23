import { differenceInDays } from "date-fns";

const GRACE_PERIOD_DAYS = 90;
const DAYS_PER_MONTH = 30;
const FEE_INCREMENT_PER_MONTH = 1;
const DEFAULT_FEE_PERCENTAGE = 10;
const MIN_FEE_PERCENTAGE = 0;
const MAX_FEE_PERCENTAGE = 10;

type FeeStatus = "grace_period" | "progressive" | "default" | "manual_override";

interface FeeCalculationResult {
  feePercentage: number;
  status: FeeStatus;
  daysRemaining?: number;
}

interface BarbershopFeeData {
  createdAt: Date;
  platformFeePercentage: number | null;
  feeOverride: boolean;
}

export function getEffectiveFee(
  barbershop: BarbershopFeeData,
): FeeCalculationResult {
  if (barbershop.feeOverride && barbershop.platformFeePercentage !== null) {
    return {
      feePercentage: barbershop.platformFeePercentage,
      status: "manual_override",
    };
  }

  const daysOld = differenceInDays(new Date(), barbershop.createdAt);

  if (daysOld <= GRACE_PERIOD_DAYS) {
    return {
      feePercentage: barbershop.platformFeePercentage ?? 0,
      status: "grace_period",
      daysRemaining: GRACE_PERIOD_DAYS - daysOld,
    };
  }

  const monthsAfterGrace = Math.floor(
    (daysOld - GRACE_PERIOD_DAYS) / DAYS_PER_MONTH,
  );
  const progressiveFee = Math.min(
    (monthsAfterGrace + 1) * FEE_INCREMENT_PER_MONTH,
    MAX_FEE_PERCENTAGE,
  );

  if (progressiveFee < MAX_FEE_PERCENTAGE) {
    return {
      feePercentage: progressiveFee,
      status: "progressive",
    };
  }

  return {
    feePercentage: DEFAULT_FEE_PERCENTAGE,
    status: "default",
  };
}

export function calculatePlatformFeeAmount(
  amountInCents: number,
  feePercentage: number,
): number {
  return Math.round((amountInCents * feePercentage) / 100);
}

export function isValidFeePercentage(fee: number | null): boolean {
  if (fee === null) return true;
  return fee >= MIN_FEE_PERCENTAGE && fee <= MAX_FEE_PERCENTAGE;
}

export const FEE_CONSTANTS = {
  GRACE_PERIOD_DAYS,
  DEFAULT_FEE_PERCENTAGE,
  MIN_FEE_PERCENTAGE,
  MAX_FEE_PERCENTAGE,
} as const;
