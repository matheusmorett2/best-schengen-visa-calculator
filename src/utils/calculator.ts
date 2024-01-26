import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isBefore,
  isEqual,
  isToday,
  isValid,
  isWithinInterval,
  max,
  min,
  subDays,
} from "date-fns";
import { DateRange } from "../components/DateRange";

export const mergeAndSortDates = (dateRanges: DateRange[]): DateRange[] => {
  if (!dateRanges.length) return [];

  // Convert strings to Date objects for sorting
  const ranges = dateRanges.map((range) => ({
    ...range,
    entry: new Date(range.entry),
    exit: new Date(range.exit),
  }));

  // Sort ranges by entry date
  ranges.sort((a, b) => a.entry.getTime() - b.entry.getTime());

  const mergedRanges: DateRange[] = [{ ...dateRanges[0] }];

  for (let i = 1; i < ranges.length; i++) {
    const current = ranges[i];
    const lastMerged = mergedRanges[mergedRanges.length - 1];

    if (
      isBefore(current.entry, new Date(lastMerged.exit)) ||
      isEqual(current.entry, new Date(lastMerged.exit))
    ) {
      // Merge ranges
      lastMerged.exit = max([new Date(lastMerged.exit), current.exit])
        .toISOString()
        .split("T")[0];
    } else {
      // No overlap, add the current range to the merged list
      mergedRanges.push({ ...dateRanges[i] });
    }
  }

  return mergedRanges;
};

export const calculateSchengenStay = (dateRanges: DateRange[], rejoinDateStr: string) => {
  const rejoinDate = new Date(rejoinDateStr);

  // Function to calculate the number of days spent in Schengen in the last 180 days from a given date
  const daysSpentInLast180Days = (date: Date) => {
    let daysSpent = 0;
    for (let i = 0; i < dateRanges.length; i++) {
      const { entry, exit } = dateRanges[i];
      const entryDate = new Date(entry);
      const exitDate = new Date(exit);
      const startOf180DayPeriod = subDays(date, 179);

      // Check if the date range overlaps with the 180-day period ending on 'date'
      if (isWithinInterval(entryDate, { start: startOf180DayPeriod, end: date }) ||
          isWithinInterval(exitDate, { start: startOf180DayPeriod, end: date }) ||
          (entryDate < startOf180DayPeriod && exitDate > date)) {

        const overlapStart = entryDate < startOf180DayPeriod ? startOf180DayPeriod : entryDate;
        const overlapEnd = exitDate > date ? date : exitDate;
        daysSpent += differenceInCalendarDays(overlapEnd, overlapStart) + 1;
      }
    }
    return daysSpent;
  };

  // Calculate days left to stay
  let daysLeft = 90 - daysSpentInLast180Days(rejoinDate);

  // The last permissible exit date
  let lastExitDate = addDays(rejoinDate, daysLeft);

  if (daysLeft >= 0) {
    return `You can still stay ${daysLeft} days in the Schengen area, until ${format(lastExitDate, 'PPP')}.`;
  } else {
    const overstay = -daysLeft;
    return `You are exceeding the limit by ${overstay} days in the Schengen area. Please adjust your travel dates.`;
  }
};

export const schengenStatusMessage = (
  rejoinDate: string,
  dateRanges: DateRange[]
) => {
  let rejoinDateObj = new Date(rejoinDate);

  // Check if rejoinDate is invalid or empty, and use today's date in that case
  if (!isValid(rejoinDateObj) || !rejoinDate) {
    rejoinDateObj = new Date();
  }

  const message = calculateSchengenStay(
    dateRanges || [],
    rejoinDateObj.toISOString().split("T")[0]
  );

  return `If you plan to re-join the Schengen area on ${format(
    rejoinDateObj,
    "PPP"
  )}, ${message}`;
};
