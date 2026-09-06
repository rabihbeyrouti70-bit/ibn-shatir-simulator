import { useMemo } from 'react';
import { computeTelemetry } from '../utils/astroMath';
import { AstroTelemetry } from '../types/astronomy';

export function useZodiacTelemetry(simDate: Date): AstroTelemetry {
  return useMemo(() => {
    return computeTelemetry(simDate);
  }, [simDate]);
}
