import {
  addDays,
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

export const calculateSchengenStay = (
  dateRanges: DateRange[],
  rejoinDate: string
) => {
  if (!dateRanges.length) return "";

  const mergedRanges = mergeAndSortDates(dateRanges);

  // Set the end of the 180-day period as either today or the rejoin date
  const periodEnd = isToday(new Date(rejoinDate))
    ? new Date()
    : new Date(rejoinDate);
  const periodStart = subDays(periodEnd, 179); // Start of the 180-day period

  let totalDaysStayed = 0;

  // Calculate total stay within the 180-day period
  mergedRanges.forEach((range) => {
    const entry = new Date(range.entry);
    const exit = new Date(range.exit);

    if (
      isWithinInterval(entry, { start: periodStart, end: periodEnd }) ||
      isWithinInterval(exit, { start: periodStart, end: periodEnd })
    ) {
      const period = eachDayOfInterval({
        start: max([periodStart, entry]),
        end: min([periodEnd, exit]),
      });
      totalDaysStayed += period.length;
    }
  });

  const daysLeft = 90 - totalDaysStayed;
  const lastExitDate = addDays(new Date(rejoinDate), daysLeft);

  if (daysLeft >= 0) {
    return `you can still stay ${daysLeft} days in the Schengen area, until ${lastExitDate.toDateString()}.`;
  } else {
    return `you are exceeding the limit by ${-daysLeft} days in the Schengen area, you should have left by ${subDays(
      lastExitDate,
      -daysLeft
    ).toDateString()}.`;
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
