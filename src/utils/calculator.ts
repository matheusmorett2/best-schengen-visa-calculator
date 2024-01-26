import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  isEqual,
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

export const calculateDaysSpentInLast180Days = (
  dateRanges: DateRange[],
  date: Date
) => {
  let daysSpent = 0;
  for (let i = 0; i < dateRanges.length; i++) {
    const { entry, exit } = dateRanges[i];
    const entryDate = new Date(entry);
    const exitDate = new Date(exit);
    const startOf180DayPeriod = subDays(date, 179);

    if (
      isWithinInterval(entryDate, { start: startOf180DayPeriod, end: date }) ||
      isWithinInterval(exitDate, { start: startOf180DayPeriod, end: date }) ||
      (entryDate < startOf180DayPeriod && exitDate > date)
    ) {
      const overlapStart =
        entryDate < startOf180DayPeriod ? startOf180DayPeriod : entryDate;
      const overlapEnd = exitDate > date ? date : exitDate;
      daysSpent += differenceInCalendarDays(overlapEnd, overlapStart) + 1;
    }
  }
  return daysSpent;
};

export const calculateSchengenStay = (
  dateRanges: DateRange[],
  rejoinDateStr: string
) => {
  const rejoinDate = new Date(rejoinDateStr);
  const daysLeft = 90 - calculateDaysSpentInLast180Days(dateRanges, rejoinDate);
  const lastExitDate = addDays(rejoinDate, daysLeft);

  if (daysLeft >= 0) {
    return `You can still stay ${daysLeft} days in the Schengen area, until ${format(
      lastExitDate,
      "PPP"
    )}.`;
  } else {
    const overstay = -daysLeft;
    return `You are exceeding the limit by ${overstay} days in the Schengen area. Please adjust your travel dates.`;
  }
};

type FutureStay = {
  date: string;
  daysLeft: number;
};

export const calculateFutureStay = (
  dateRanges: DateRange[],
  rejoinDateStr: string
): FutureStay[] => {
  const rejoinDate = new Date(rejoinDateStr);
  let futureAvailability = [];

  for (let i = 0; i < 90; i++) {
    const futureDate = addDays(rejoinDate, i);
    const startOf180DayPeriod = subDays(futureDate, 179);
    let daysSpent = 0;

    for (const range of dateRanges) {
      const entryDate = new Date(range.entry);
      const exitDate = new Date(range.exit);

      if (
        isWithinInterval(entryDate, {
          start: startOf180DayPeriod,
          end: futureDate,
        }) ||
        isWithinInterval(exitDate, {
          start: startOf180DayPeriod,
          end: futureDate,
        }) ||
        (entryDate < startOf180DayPeriod && exitDate > futureDate)
      ) {
        const overlapStart = max([startOf180DayPeriod, entryDate]);
        const overlapEnd = min([futureDate, exitDate]);
        daysSpent += differenceInCalendarDays(overlapEnd, overlapStart) + 1;
      }
    }

    const daysLeft = 90 - daysSpent;
    if (daysLeft >= 0) {
      futureAvailability.push({
        date: format(futureDate, "PPP"),
        daysLeft: daysLeft,
      });
    }
  }

  return futureAvailability;
};

const formatDate = (date: Date) => format(date, "PPP");

export type SchengenStatus = {
  message: string;
  futureStay: FutureStay[];
};

export const schengenStatus = (
  rejoinDate: string,
  dateRanges: DateRange[]
): SchengenStatus => {
  let rejoinDateObj = isValid(new Date(rejoinDate))
    ? new Date(rejoinDate)
    : new Date();

  const futureStay = calculateFutureStay(
    dateRanges || [],
    rejoinDateObj.toISOString().split("T")[0]
  );

  if (futureStay.length > 0) {
    const rejoinDateInFutureStay = futureStay.some(
      (day) => day.date === format(rejoinDateObj, "MMMM do, yyyy")
    );

    let amountOfDays = 0;

    // If rejoin date is in future stay, find the maximum amount of days
    if (rejoinDateInFutureStay) {
      for (let i = 0; i < futureStay.length - 1; i++) {
        const currentDay = futureStay[i];
        const nextDay = futureStay[i + 1];

        if (currentDay.daysLeft === 0) {
          break;
        }

        if (currentDay.daysLeft < nextDay.daysLeft) {
          continue;
        } else {
          amountOfDays = currentDay.daysLeft;
          break;
        }
      }
    }

    return {
      message: `If you re-join the Schengen area on ${formatDate(
        rejoinDateObj
      )}, you can initially stay for ${amountOfDays} days.`,
      futureStay: futureStay.reduce<FutureStay[]>((acc, day) => {
        if (!acc.some((item) => item.daysLeft === day.daysLeft)) {
          acc.push(day);
        }
        return acc;
      }, []),
    };
  } else {
    return {
      message: `As of ${formatDate(
        rejoinDateObj
      )}, you have already exceeded the 90-day limit in the Schengen area.`,
      futureStay: [],
    };
  }
};
