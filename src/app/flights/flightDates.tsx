import { addDays, differenceInDays, format, parseISO } from "date-fns";
import { ChangeEvent, useEffect, useState } from "react";
import DateRangePicker, { DateRange } from "rsuite/esm/DateRangePicker";
import { PROGRAMS } from "../lib/contants";
import { BiSolidLeftArrow, BiSolidRightArrow } from "react-icons/bi";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface AvailabilityEntry {
  economy: boolean | null;
  buisness: boolean | null;
  _id: string;
}

export interface Availability {
  [date: string]: AvailabilityEntry;
}

interface Props {
  flightId: string;
  program: string | undefined;
  availability: Availability | undefined;
  handleRefresh: () => void;
}

const FlightDates = ({
  flightId,
  program,
  availability,
  handleRefresh,
}: Props) => {
  const { beforeToday } = DateRangePicker;
  const [value, setValue] = useState<DateRange | null>(null);
  const [selectedDates, setDates] = useState<string[] | undefined>([]);
  const [startIndex, setStartIndex] = useState<number>(0);
  const displayedDates = selectedDates?.slice(startIndex, startIndex + 7);

  useEffect(() => {
    if (value) {
      const { allDates } = processDates(value);
      const formatted = allDates?.map((dateStr) => {
        const date = parseISO(dateStr);
        return format(date, "MMM d");
      });
      setDates(formatted);
    } else {
      setDates([]);
    }
  }, [value]);

  const handleNext = () => {
    if (selectedDates) {
      if (startIndex + 7 < selectedDates.length) {
        setStartIndex(startIndex + 7);
      }
    }
  };

  const handlePrevious = () => {
    if (startIndex - 7 >= 0) {
      setStartIndex(startIndex - 7);
    }
  };

  const handleUpdateProgram = async (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/flights/update-program/${flightId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ program: selectedValue }),
        },
      );
      if (!response.ok) {
        throw new Error("Error while updating program.");
      }
      handleRefresh();
    } catch (error) {}
  };

  const handleUpdateAvailability = async (
    date: string,
    flightClass: string,
    availability: boolean | null,
  ) => {
    const response = await fetch(
      `${BACKEND_URL}/api/flights/update-availability/${flightId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [date]: {
            [flightClass]: availability,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Error while updating availability.");
    }
    handleRefresh();
  };

  return (
    <div className="flex flex-col gap-5 mx-5">
      <div className="flex justify-center">
        <div className="flex justify-between gap-4">
          <DateRangePicker
            shouldDisableDate={beforeToday()}
            showMeridian
            format="dd/MM/yyyy"
            onChange={setValue}
            className="border-2 border-gray-400 rounded-md"
          />
          <select
            value={program || ""}
            className="border-2 border-gray-400 rounded-md font-extrabold"
            onChange={handleUpdateProgram}
          >
            <option value="" className="italic" disabled>
              Program
            </option>
            {PROGRAMS.map((program) => {
              return (
                <option key={program} value={program}>
                  {program}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      {selectedDates && selectedDates?.length > 0 ? (
        <div className="flex items-center justify-between bg-gray-200 rounded-md p-2">
          <button
            onClick={handlePrevious}
            disabled={startIndex === 0}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            <BiSolidLeftArrow />
          </button>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-8 gap-5">
              <div className="flex items-center font-bold text-lg">Economy</div>
              {displayedDates?.map((date, index) => {
                const available = availability?.[date]?.economy === true;
                const notAvailable = availability?.[date]?.economy === false;
                return (
                  <div
                    key={index + date}
                    className="flex flex-col items-center gap-5"
                  >
                    <span className="font-bold text-gray-500">{date}</span>
                    <button
                      className={`${
                        available ? "bg-green-500" : "bg-green-200"
                      } px-3 py-2 text-center rounded-md`}
                      onClick={(e: any) =>
                        handleUpdateAvailability(
                          date,
                          "economy",
                          available ? null : true,
                        )
                      }
                    >
                      Yes
                    </button>
                    <button
                      className={`${
                        notAvailable ? "bg-red-500" : "bg-red-200"
                      } px-3 py-2 text-center rounded-md`}
                      onClick={(e: any) =>
                        handleUpdateAvailability(
                          date,
                          "economy",
                          notAvailable ? null : false,
                        )
                      }
                    >
                      No
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-8 gap-5">
              <div className="flex items-center font-bold text-lg">
                Buisness
              </div>
              {displayedDates?.map((date, index) => {
                const available = availability?.[date]?.buisness === true;
                const notAvailable = availability?.[date]?.buisness === false;
                return (
                  <div
                    key={index + date}
                    className="flex flex-col items-center gap-5"
                  >
                    <span className="font-bold text-gray-500">{date}</span>
                    <button
                      className={`${
                        available ? "bg-green-500" : "bg-green-200"
                      } px-3 py-2 text-center rounded-md`}
                      onClick={(e: any) =>
                        handleUpdateAvailability(
                          date,
                          "buisness",
                          available ? null : true,
                        )
                      }
                    >
                      Yes
                    </button>
                    <button
                      className={`${
                        notAvailable ? "bg-red-500" : "bg-red-200"
                      } px-3 py-2 text-center rounded-md`}
                      onClick={(e: any) =>
                        handleUpdateAvailability(
                          date,
                          "buisness",
                          notAvailable ? null : false,
                        )
                      }
                    >
                      No
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            onClick={handleNext}
            disabled={startIndex + 7 >= selectedDates.length}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            <BiSolidRightArrow />
          </button>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default FlightDates;

const processDates = (dateRange: DateRange) => {
  if (!dateRange || dateRange.length !== 2)
    return { formattedDates: [], daysDiff: 0 };
  // Remove the time component and parse the dates
  const dates = dateRange?.map((dateStr) => dateStr);

  // Format dates to remove time (only keep the date part)
  const formattedDates = dates?.map((date) => format(date, "yyyy-MM-dd"));

  // Calculate the difference in days
  const daysDiff = differenceInDays(dates[1], dates[0]);

  const allDates = [];
  for (let i = 0; i <= daysDiff; i++) {
    allDates.push(format(addDays(dates[0], i), "yyyy-MM-dd"));
  }

  return { formattedDates, daysDiff, allDates };
};
