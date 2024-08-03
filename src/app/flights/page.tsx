"use client";
import {
  compareItems,
  RankingInfo,
  rankItem,
} from "@tanstack/match-sorter-utils";
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingFn,
  sortingFns,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { BiSolidDownArrow, BiSolidUpArrow } from "react-icons/bi";
import FlightDates, { Availability } from "./flightDates";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";

declare module "@tanstack/react-table" {
  interface FilterFns {
    fuzzy: FilterFn<unknown>;
  }
  interface FilterMeta {
    itemRank: RankingInfo;
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);

  addMeta({
    itemRank,
  });

  return itemRank.passed;
};

const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
  let dir = 0;

  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]?.itemRank!,
      rowB.columnFiltersMeta[columnId]?.itemRank!,
    );
  }

  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

export type Person = {
  postId: string;
  name: string;
  email: string;
  body: string;
};

interface Flight {
  _id: string;
  airline: string;
  origin: string;
  destination: string;
  lastUpdated?: string;
  program?: string;
  availability?: Availability;
}

export default function Flights() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [refetch, setRefetch] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Flight>();

  const columns = useMemo<ColumnDef<Flight, any>[]>(
    () => [
      {
        id: "Origin",
        accessorFn: (row) => row.origin,
        cell: (info) => info.getValue(),
        header: () => (
          <span className="inline-block px-4 py-2 bg-tableHeader rounded-md font-bold text-lg">
            Origin
          </span>
        ),
        filterFn: "includesString",
      },
      {
        id: "Destination",
        accessorFn: (row) => row.destination,
        header: () => (
          <span className="inline-block px-4 py-2 bg-tableHeader rounded-md font-bold text-lg">
            Destination
          </span>
        ),
        cell: (info) => info.getValue(),
        filterFn: "includesString",
      },
      {
        id: "Airline",
        accessorFn: (row) => row.airline,
        header: () => (
          <span className="inline-block px-4 py-2 bg-tableHeader rounded-md font-bold text-lg">
            Airline
          </span>
        ),
        cell: (info) => info.getValue(),
        filterFn: "fuzzy",
      },
      {
        id: "LastUpdated",
        accessorFn: (row) => row.lastUpdated,
        header: () => (
          <span className="inline-block px-4 py-2 bg-tableHeader rounded-md font-bold text-lg">
            Last Updated
          </span>
        ),
        cell: (info) => format(parseISO(info.getValue()), "MMM dd, yyyy"),
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        id: "Program",
        accessorKey: "program",
        header: () => (
          <span className="inline-block px-4 py-2 bg-tableHeader rounded-md font-bold text-lg">
            Program
          </span>
        ),
        cell: ({ getValue, row }) => {
          return (
            row.getCanExpand() && (
              <div className="relative flex justify-center gap-2">
                <div>{getValue() || "N/A"}</div>
                <button
                  {...{
                    onClick: row.getToggleExpandedHandler(),
                    style: { cursor: "pointer" },
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 right-0"
                >
                  {row.getIsExpanded() ? (
                    <BiSolidUpArrow />
                  ) : (
                    <BiSolidDownArrow />
                  )}
                </button>
              </div>
            )
          );
        },
        enableColumnFilter: false,
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: flights,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "fuzzy",
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/flights/all`)
      .then((response) => response.json())
      .then((res) => setFlights(res));
  }, [refetch]);

  const handleRouteAdd = async (data: Flight) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/flights/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error while adding route");
      }
      setRefetch((prev) => !prev);
      reset();
    } catch (error) {
      console.error("Failed to add route:", error);
      reset();
    }
  };

  return (
    <div className="container flex flex-col gap-5 mx-auto p-5 lg:px-10 lg:py-5">
      <div className="flex justify-end">
        <form
          onSubmit={handleSubmit(handleRouteAdd)}
          className="flex justify-between border-b-2 border-gray-400 gap-4 w-full xl:w-[70%] 2xl:w-[50%] pb-2"
        >
          <input
            type="text"
            className={`border-2 ${
              errors.airline ? "border-red-500" : "border-gray-300"
            } rounded-md px-4 py-2 w-1/4`}
            placeholder="Airline"
            maxLength={2}
            {...register("airline", { required: true, maxLength: 2 })}
          />
          <input
            type="text"
            className={`border-2 ${
              errors.origin ? "border-red-500" : "border-gray-300"
            } rounded-md px-4 py-2 w-1/4`}
            placeholder="Origin"
            maxLength={3}
            {...register("origin", { required: true, maxLength: 3 })}
          />
          <input
            type="text"
            className={`border-2 ${
              errors.destination ? "border-red-500" : "border-gray-300"
            } rounded-md px-4 py-2 w-1/4`}
            placeholder="Destination"
            maxLength={3}
            {...register("destination", { required: true, maxLength: 3 })}
          />
          <button
            type="submit"
            className="bg-gray-400 px-4 py-2 rounded-md font-semibold text-lg"
          >
            Add Route
          </button>
        </form>
      </div>
      <>
        <div className="overflow-auto bg-gray-200">
          <div className="border-2 border-gray-300 rounded-md p-5 min-w-[800px]">
            {table.getHeaderGroups().map((headerGroup) => (
              <div key={headerGroup.id} className="flex justify-center gap-5">
                {headerGroup.headers.map((header) => {
                  return (
                    <div
                      key={header.id}
                      className="flex flex-col gap-2 text-center w-1/5"
                    >
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            {...{
                              className: `${
                                header.column.getCanSort()
                                  ? "cursor-pointer select-none"
                                  : ""
                              }`,
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{
                              asc: " 🔼",
                              desc: " 🔽",
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                          {header.column.getCanFilter() ? (
                            <div className="my-2">
                              <Filter column={header.column} />
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="flex flex-col gap-2">
              {table.getRowModel().rows.map((row) => {
                return (
                  <div
                    key={row.id}
                    className="flex flex-col gap-5 bg-white border-2 border-gray-400 rounded-md p-2"
                  >
                    <div className="flex items-center gap-8">
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <div
                            key={cell.id}
                            className="text-center text-base font-semibold w-1/5 break-all"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {row.getIsExpanded() && (
                      <div className="w-100">
                        <FlightDates
                          flightId={row.original._id}
                          program={row.original.program}
                          availability={row.original.availability}
                          handleRefresh={() => setRefetch((prev) => !prev)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 mt-5">
          <div className="flex justify-center gap-2">
            <span className="flex items-center gap-1">
              <div>Page </div>
              <strong>
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </strong>
            </span>
            <span className="flex items-center gap-1">
              | &nbsp;Go to page:
              <input
                type="number"
                defaultValue={table.getState().pagination.pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  table.setPageIndex(page);
                }}
                className="border p-1 rounded w-16"
              />
            </span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-center gap-2">
            <button
              className="border rounded bg-gray-400 font-semibold p-1"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {"<<"}
            </button>
            <button
              className="border rounded bg-gray-400 font-semibold p-1"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {"<"}
            </button>
            <button
              className="border rounded bg-gray-400 font-semibold p-1"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {">"}
            </button>
            <button
              className="border rounded bg-gray-400 font-semibold p-1"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {">>"}
            </button>
          </div>
        </div>
      </>
    </div>
  );
}

function Filter({ column }: { column: Column<any, unknown> }) {
  const columnFilterValue = column.getFilterValue();

  return (
    <DebouncedInput
      type="text"
      value={(columnFilterValue ?? "") as string}
      onChange={(value) => column.setFilterValue(value)}
      placeholder={`Search ${column.id}`}
      className="w-full border-2 border-gray-300 rounded-md px-4 py-2 shadow-lg"
    />
  );
}

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
