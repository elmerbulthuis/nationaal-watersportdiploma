"use client";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import type {
  OnChangeFn,
  RowSelectionState,
  SortDirection,
  SortingState,
} from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useParams } from "next/navigation";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import React, { useMemo } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import {
  TableFooter,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import dayjs from "~/lib/dayjs";
import type { listStudentsWithCurriculaByCohortId } from "~/lib/nwd";
import {
  generateSortingState,
  transformSelectionState,
} from "~/utils/table-state";
import { ActionButtons } from "./table-actions";

export type Student = Awaited<
  ReturnType<typeof listStudentsWithCurriculaByCohortId>
>[number];

const columnHelper = createColumnHelper<Student>();

const columns = [
  columnHelper.display({
    id: "select",
    cell: ({ row }) => (
      <CheckboxField>
        <Checkbox
          {...{
            checked: row.getIsSelected(),
            disabled: !row.getCanSelect(),
            indeterminate: row.getIsSomeSelected(),
            onChange: row.getToggleSelectedHandler(),
          }}
          className="-translate-y-[1px]"
        />
      </CheckboxField>
    ),
    header: ({ table }) => {
      return (
        <CheckboxField>
          <Checkbox
            {...{
              disabled: false,
              checked:
                table.getIsSomePageRowsSelected() ||
                table.getIsAllPageRowsSelected(),
              indeterminate: !table.getIsAllPageRowsSelected(),
              onChange: (checked) => table.toggleAllPageRowsSelected(checked),
            }}
            className="-translate-y-[1px]"
          />
        </CheckboxField>
      );
    },
    enableSorting: false,
  }),
  columnHelper.accessor(
    (data) =>
      [data.person.firstName, data.person.lastNamePrefix, data.person.lastName]
        .filter(Boolean)
        .join(" "),
    {
      id: "cursist",
      header: "Naam",
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-950">{getValue()}</span>
      ),
      sortingFn: "text",
    },
  ),
  columnHelper.accessor(
    (row) =>
      row.person.dateOfBirth
        ? dayjs().diff(dayjs(row.person.dateOfBirth), "year")
        : null,
    {
      id: "leeftijd",
      header: "Leeftijd",
      cell: ({ getValue }) => {
        const age = getValue();
        return age ? `${age} jr.` : null;
      },
      sortingFn: "alphanumeric",
    },
  ),
  columnHelper.accessor((data) => data.studentCurriculum?.course.title, {
    id: "cursus",
    header: "Cursus",
    sortUndefined: "last",
    sortingFn: "text",
  }),
  columnHelper.accessor("studentCurriculum.degree.title", {
    id: "niveau",
    header: "Niveau",
    sortUndefined: "last",
    sortingFn: "alphanumeric",
  }),
  columnHelper.accessor("studentCurriculum.gearType.title", {
    id: "vaartuig",
    header: "Vaartuig",
    sortUndefined: "last",
    sortingFn: "text",
  }),
  columnHelper.accessor(
    (data) =>
      data.instructor
        ? [
            data.instructor.firstName,
            data.instructor.lastNamePrefix,
            data.instructor.lastName,
          ]
            .filter(Boolean)
            .join(" ")
        : undefined,
    {
      id: "instructeur",
      header: "Instructeur",
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-950">{getValue()}</span>
      ),
      sortUndefined: "last",
      sortingFn: "text",
    },
  ),
  columnHelper.accessor("tags", {
    id: "tags",
    header: "Tags",
    cell: ({ getValue }) => {
      return (
        <div className="flex gap-x-2 items-center">
          {getValue().map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      );
    },
    enableSorting: false,
  }),
];

export default function StudentsTable({
  cohortId,
  students,
  totalItems,
  noOptionsLabel = "Geen items gevonden",
  locationRoles,
}: {
  cohortId: string;
  students: Awaited<ReturnType<typeof listStudentsWithCurriculaByCohortId>>;
  totalItems: number;
  noOptionsLabel?: React.ReactNode;
  locationRoles: ("student" | "instructor" | "location_admin")[];
}) {
  const [rowSelection, setRowSelection] = React.useState<
    Record<
      string,
      {
        instructor: Student["instructor"];
        studentCurriculum: Student["studentCurriculum"];
        person: Student["person"];
        tags: Student["tags"];
      }
    >
  >({});

  const [sort, setSort] = useQueryState(
    "sorteer",
    parseAsArrayOf(parseAsString).withDefault(["cursist.az"]),
  );

  const sortingState = useMemo(
    () =>
      generateSortingState(
        sort,
        columns.map((c) => c.id),
      ),
    // TODO: this feels a bit hacky, but we need a stable reference
    [sort.join(":")],
  );

  const onRowSelectionChange = React.useCallback<OnChangeFn<RowSelectionState>>(
    (updater) => {
      setRowSelection((prev) => {
        const normalized = transformSelectionState(prev);

        const newSelectionValue =
          updater instanceof Function ? updater(normalized) : updater;

        // Generate new rowSelection object
        return Object.fromEntries(
          Object.keys(newSelectionValue).map((key) => {
            const student = students.find((student) => student.id === key);
            return [
              key,
              rowSelection.hasOwnProperty(key)
                ? rowSelection[key]!
                : {
                    instructor: student!.instructor,
                    studentCurriculum: student!.studentCurriculum,
                    person: student!.person,
                    tags: student!.tags,
                  },
            ];
          }),
        );
      });
    },
    [students],
  );

  const onSortingChange = React.useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      void setSort((previousSort) => {
        const newSortValue =
          updater instanceof Function
            ? updater(
                generateSortingState(
                  previousSort,
                  columns.map((c) => c.id),
                ),
              )
            : updater;

        return newSortValue.map(
          (sort) => `${sort.id}.${sort.desc ? "za" : "az"}`,
        );
      });
    },
    [columns],
  );

  const table = useReactTable({
    data: students,
    columns,
    state: {
      rowSelection: transformSelectionState(rowSelection),
      sorting: sortingState,
    },
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange,
    onSortingChange,
  });
  const params = useParams();

  const selectedRows = Object.keys(rowSelection).length;
  const actionRows = Object.entries(rowSelection).map(([id, props]) => ({
    id,
    ...props,
  }));

  return (
    <div className="mt-8 relative">
      <Table
        className="[--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]"
        dense
      >
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortingHandler =
                  header.column.getToggleSortingHandler?.();
                const getAriaSortValue = (isSorted: false | SortDirection) => {
                  switch (isSorted) {
                    case "asc":
                      return "ascending";
                    case "desc":
                      return "descending";
                    case false:
                    default:
                      return "none";
                  }
                };

                return (
                  <TableHeader
                    key={header.id}
                    onClick={sortingHandler}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && sortingHandler) {
                        sortingHandler(event);
                      }
                    }}
                    className={clsx(
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : "",
                    )}
                    tabIndex={header.column.getCanSort() ? 0 : -1}
                    aria-sort={getAriaSortValue(header.column.getIsSorted())}
                  >
                    <div
                      className={clsx(
                        header.column.columnDef.enableSorting === false
                          ? header.column.columnDef.meta?.align
                          : "flex items-center justify-between gap-2 hover:bg-gray-50 hover:dark:bg-gray-900 px-3 py-1.5 -mx-3 -my-1.5",
                        "rounded-md",
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() &&
                        (header.column.getIsSorted() === false ? (
                          <ArrowsUpDownIcon className="size-3 text-gray-900 dark:text-gray-50 opacity-30" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowUpIcon
                            className="size-3 text-gray-900 dark:text-gray-50"
                            aria-hidden={true}
                          />
                        ) : (
                          <ArrowDownIcon
                            className="size-3 text-gray-900 dark:text-gray-50"
                            aria-hidden={true}
                          />
                        ))}
                    </div>
                  </TableHeader>
                );
              })}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowCount() <= 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                {noOptionsLabel}
              </TableCell>
            </TableRow>
          ) : null}
          {table.getRowModel().rows.map((row) => (
            <TableRow
              className={clsx(
                row.getIsSelected()
                  ? "bg-zinc-950/[1.5%] dark:bg-zinc-950/[1.5%]"
                  : "",
              )}
              key={row.id}
              href={`/locatie/${params.location as string}/cohorten/${params.cohort as string}/${row.id}`}
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={clsx(cell.column.columnDef.meta?.align)}
                >
                  {index === 0 && row.getIsSelected() && (
                    <div className="absolute inset-y-0 left-0 w-0.5 bg-branding-light" />
                  )}
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
      </TableFooter>

      <div
        className={clsx(
          "fixed inset-x-0 bottom-14 mx-auto flex w-fit items-center space-x-2 rounded-lg border border-gray-200 bg-white p-2 shadow-md dark:border-gray-800 dark:bg-gray-950",
          selectedRows > 0 ? "" : "hidden",
        )}
      >
        <p className="select-none text-sm">
          <span className="rounded bg-branding-light/10 px-2 py-1.5 font-medium tabular-nums text-branding-dark">
            {selectedRows}
          </span>
          <span className="ml-2 font-medium text-gray-900 dark:text-gray-50">
            geselecteerd
          </span>
        </p>
        <div className="flex items-center space-x-4">
          <Button plain onClick={() => setRowSelection({})}>
            <XMarkIcon />
          </Button>
          <ActionButtons
            rows={actionRows}
            cohortId={cohortId}
            locationRoles={locationRoles}
          />
        </div>
      </div>
    </div>
  );
}
