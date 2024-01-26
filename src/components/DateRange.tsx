import React, { useState } from "react";
import { useLocalStorage } from "react-use";
import { format } from "date-fns";
import { SchengenStatus, schengenStatus } from "../utils/calculator";

export type DateRange = {
  entry: string;
  exit: string;
};

const DateRangeInput: React.FC = () => {
  const [dateRanges = [], setDateRanges] = useLocalStorage<DateRange[]>(
    "dateRanges",
    [{ entry: "", exit: "" }]
  );
  const [errors, setErrors] = useLocalStorage<{ [key: string]: string }>(
    "dateRangeErrors",
    {}
  );
  const [rejoinDate, setRejoinDate] = useLocalStorage<string>(
    "rejoinDate",
    format(new Date(), "yyyy-MM-dd")
  );
  const [calculationResult, setCalculationResult] = useState<SchengenStatus>({
    message: "",
    futureStay: [],
  });

  // Function to handle the calculation
  const handleCalculation = () => {
    const result = schengenStatus(rejoinDate!, dateRanges || []);
    setCalculationResult(result);
  };

  const addDateRange = () => {
    setDateRanges([...(dateRanges || []), { entry: "", exit: "" }]);
  };

  const getLastExitDate = () => {
    if (dateRanges && dateRanges.length > 0) {
      return new Date(dateRanges[dateRanges.length - 1].exit);
    }
    return null;
  };

  const validateDateRange = (
    index: number,
    field: "entry" | "exit",
    value: string
  ) => {
    const newErrors = { ...errors };
    const newDate = new Date(value);
    const lastExitDate =
      index > 0 ? new Date(dateRanges[index - 1].exit) : null;
    if (field === "entry" && lastExitDate && newDate < lastExitDate) {
      newErrors[`range-${index}-entry`] =
        "Entry date cannot be before the last exit date.";
    } else if (
      field === "exit" &&
      new Date(dateRanges[index].entry) > newDate
    ) {
      newErrors[`range-${index}-exit`] =
        "Exit date cannot be before the entry date.";
    } else {
      delete newErrors[`range-${index}-${field}`];
    }
    setErrors(newErrors);
  };

  const handleBlur = (index: number, field: "entry" | "exit") => {
    const value = dateRanges[index][field];
    validateDateRange(index, field, value);
  };

  const updateDateRange = (
    index: number,
    field: "entry" | "exit",
    value: string
  ) => {
    const newDateRanges = [...(dateRanges || [])];
    newDateRanges[index][field] = value;
    setDateRanges(newDateRanges);
  };

  const updateRejoinDate = (value: string) => {
    const newRejoinDate = new Date(value);
    setRejoinDate(value);
    const lastExitDate = getLastExitDate();

    if (lastExitDate && newRejoinDate < lastExitDate) {
      setErrors({
        ...errors,
        rejoinDate: "Rejoin date cannot be before the last exit date.",
      });
      return;
    }

    setErrors({ ...errors, rejoinDate: "" });
  };

  const calculateDays = (entry: string, exit: string) => {
    if (!entry || !exit) return "";
    const entryDate = new Date(entry);
    const exitDate = new Date(exit);
    const difference = exitDate.getTime() - entryDate.getTime();
    const days = Math.ceil(difference / (1000 * 3600 * 24));
    return days > 0 ? `${days} days` : "";
  };

  const removeDateRange = (index: number) => {
    const newDateRanges = [...(dateRanges || [])];
    newDateRanges.splice(index, 1); // Remove the element at the specified index
    setDateRanges(newDateRanges);
  };

  return (
    <div>
      {dateRanges?.map((range, index) => (
        <div key={index} className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => removeDateRange(index)}
            className={`bg-red-500 text-white p-2 rounded ${
              index === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={index === 0}
          >
            Delete
          </button>
          <div>
            <input
              type="date"
              value={range.entry}
              onChange={(e) => updateDateRange(index, "entry", e.target.value)}
              onBlur={() => handleBlur(index, "entry")}
              className={`border p-2 rounded ${
                errors?.[`range-${index}-entry`]
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
          </div>
          <div>
            <input
              type="date"
              value={range.exit}
              onChange={(e) => updateDateRange(index, "exit", e.target.value)}
              onBlur={() => handleBlur(index, "exit")}
              className={`border p-2 rounded ${
                errors?.[`range-${index}-exit`]
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
          </div>
          <span className="ml-2">{calculateDays(range.entry, range.exit)}</span>
        </div>
      ))}
      <button
        onClick={addDateRange}
        className="bg-blue-500 text-white p-2 rounded"
      >
        Add row
      </button>
      <div className="my-4">
        <label
          htmlFor="rejoinDate"
          className="block text-sm font-medium text-gray-700"
        >
          When are you planning to re-join Schengen?
        </label>
        <input
          type="date"
          id="rejoinDate"
          value={rejoinDate}
          onChange={(e) => updateRejoinDate(e.target.value)}
          className={`mt-1 block w-full border p-2 rounded-md ${
            errors?.rejoinDate ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors?.rejoinDate && (
          <p className="text-red-500 text-xs italic">{errors.rejoinDate}</p>
        )}
      </div>
      <button
        onClick={handleCalculation}
        className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Calculate
      </button>
      {calculationResult.message && (
        <>
          <div className="mt-4 p-4 border rounded">
            {calculationResult.message}
          </div>
          <div className="overflow-x-auto justify-start">
            <div className="min-w-screen min-h-screen bg-gray-100 flex justify-center bg-gray-100 font-sans overflow-hidden">
              <div className="w-full lg:w-5/6">
                <h1 className="text-5sm font-bold inline-block my-3 p-1">
                  This is how many days you can stay if you join on this day
                </h1>
                <div className="bg-white shadow-md rounded my-3">
                  <table className="min-w-max w-full table-auto">
                    <thead>
                      <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                        <th className="py-3 px-6 text-left">Date</th>
                        <th className="py-3 px-6 text-left">Days Left</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-light">
                      {calculationResult.futureStay.map((day, index) => (
                        <tr
                          className="border-b border-gray-200 hover:bg-gray-100"
                          key={index}
                        >
                          <td className="py-3 px-6 text-left whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="font-medium">{day.date}</span>
                            </div>
                          </td>
                          <td className="py-3 px-6 text-left">
                            <div className="flex items-center">
                              <span>{day.daysLeft}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangeInput;
