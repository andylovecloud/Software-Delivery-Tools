import { Slot, WorkingHours } from '@/types';

export function generateSlots(
  workingHours: WorkingHours | null,
  bookedHours: number[]
): Slot[] {
  if (!workingHours || !workingHours.is_active) return [];
  const slots: Slot[] = [];
  for (let h = workingHours.start_hour; h < workingHours.end_hour; h++) {
    slots.push({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      available: !bookedHours.includes(h),
    });
  }
  return slots;
}
