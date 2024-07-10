"use client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { Badge } from "~/app/(dashboard)/_components/badge";
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
import { Code } from "~/app/(dashboard)/_components/text";
import type { listCertificateOverviewByCohortId } from "~/lib/nwd";
import { ActionButtons } from "./table-actions";

export type Student = Awaited<
  ReturnType<typeof listCertificateOverviewByCohortId>
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
    header: ({ table }) => (
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
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("certificate.handle", {
    header: "Diploma",
    cell: ({ getValue }) => {
      const value = getValue();
      return value ? <Code>{getValue()}</Code> : null;
    },
  }),
  columnHelper.accessor(
    (data) =>
      [data.person.firstName, data.person.lastNamePrefix, data.person.lastName]
        .filter(Boolean)
        .join(" "),
    {
      header: "Naam",
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-950">{getValue()}</span>
      ),
    },
  ),
  columnHelper.accessor("person.dateOfBirth", {
    header: "Leeftijd",
    cell: ({ getValue }) => {
      const dateOfBirth = getValue();
      return dateOfBirth
        ? `${dayjs().diff(dayjs(dateOfBirth), "year")} jr.`
        : null;
    },
  }),
  columnHelper.display({
    id: "completedRequired",
    header: "Kernmodules",
    cell: ({ row }) => {
      if (!row.original.studentCurriculum) {
        return null;
      }

      const coreModules = row.original.studentCurriculum.moduleStatus.filter(
        (status) => status.module.type === "required",
      );

      return (
        <div className="flex items-center gap-x-1.5">
          <span className="font-medium text-zinc-950">
            {
              coreModules.filter(
                (status) =>
                  status.completedCompetencies === status.totalCompetencies,
              ).length
            }
          </span>
          <span className="text-zinc-500">/</span>
          <span className="text-zinc-950">{coreModules.length}</span>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "completedOptional",
    header: "Keuzemodules",
    cell: ({ row }) => {
      if (!row.original.studentCurriculum) {
        return null;
      }

      const electiveModules =
        row.original.studentCurriculum.moduleStatus.filter(
          (status) => status.module.type === "optional",
        );

      return (
        <div className="flex items-center gap-x-1.5">
          <span className="font-medium text-zinc-950">
            {
              electiveModules.filter(
                (status) =>
                  status.completedCompetencies === status.totalCompetencies,
              ).length
            }
          </span>
          <span className="text-zinc-500">/</span>
          <span className="text-zinc-950">{electiveModules.length}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor(
    (data) =>
      data.studentCurriculum?.program.title ??
      data.studentCurriculum?.course.title,
    {
      header: "Programma",
    },
  ),
  columnHelper.accessor("studentCurriculum.degree.title", {
    header: "Niveau",
  }),
  columnHelper.accessor("studentCurriculum.gearType.title", {
    header: "Vaartuig",
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
        : null,
    {
      header: "Instructeur",
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-950">{getValue()}</span>
      ),
    },
  ),
  columnHelper.accessor("tags", {
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
  }),
];

export default function StudentsTable({
  cohortId,
  students,
  totalItems,
  noOptionsLabel = "Geen items gevonden",
  defaultCertificateVisibleFromDate,
}: {
  cohortId: string;
  students: Awaited<ReturnType<typeof listCertificateOverviewByCohortId>>;
  totalItems: number;
  noOptionsLabel?: React.ReactNode;
  defaultCertificateVisibleFromDate?: string;
}) {
  const table = useReactTable({
    data: students,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const params = useParams();

  const anyRowSelected =
    table.getIsAllRowsSelected() || table.getIsSomeRowsSelected();

  return (
    <div className="mt-8 relative">
      <Table
        className="[--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]"
        dense
      >
        {anyRowSelected ? (
          <ActionButtons
            rows={table.getSelectedRowModel().rows}
            cohortId={cohortId}
            defaultVisibleFrom={defaultCertificateVisibleFromDate}
          />
        ) : null}
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHeader
                  key={header.id}
                  className={clsx(header.column.columnDef.meta?.align)}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHeader>
              ))}
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
                  // suppressLinkBehavior={
                  //   cell.column.columnDef.meta?.suppressLinkBehavior
                  // }
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
        {/* <TablePagination totalItems={totalItems} /> */}
      </TableFooter>
    </div>
  );
}
