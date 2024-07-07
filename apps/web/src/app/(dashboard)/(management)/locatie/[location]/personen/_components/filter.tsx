"use client";

import { ChevronDownIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";
import { useOptimistic, useTransition } from "react";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from "~/app/(dashboard)/_components/popover";
import { useSetQueryParams } from "~/app/(dashboard)/_utils/set-query-params";
import Spinner from "~/app/_components/spinner";

function CheckboxButton({
  children,
  className,
  onClick,
  ...props
}: Pick<ComponentProps<"button">, "onClick" | "className" | "children"> &
  ComponentProps<typeof Checkbox>) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className={clsx([
        className,

        // Base
        "relative isolate inline-flex items-center gap-x-2 rounded-lg text-base/6",

        // Sizing
        "px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing[1.5])-1px)] sm:text-sm/6",

        // Disabled
        "data-[disabled]:opacity-50",
      ])}
      onClick={(...e) => {
        if (!onClick) return;

        return startTransition(() => {
          onClick(...e);
        });
      }}
    >
      {isPending ? (
        <Spinner className="text-gray-700" size="sm" />
      ) : (
        <Checkbox {...props} />
      )}
      {children}
    </button>
  );
}

export function FilterSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setQueryParams = useSetQueryParams();

  const [optimisticSelectedStatus, setOptimisticSelectedStatus] = useOptimistic(
    searchParams.has("filter") ? searchParams.getAll("filter") : [],
    (current, toggle: "student" | "instructor" | "location_admin") => {
      return current.includes(toggle)
        ? current.filter((item) => item !== toggle)
        : [...current, toggle];
    },
  );

  const handleToggle = (
    toggle: "student" | "instructor" | "location_admin",
  ) => {
    setOptimisticSelectedStatus(toggle);

    router.push(
      setQueryParams({
        filter: optimisticSelectedStatus.includes(toggle)
          ? optimisticSelectedStatus.filter((item) => item !== toggle)
          : [...optimisticSelectedStatus, toggle],
        page: undefined,
        limit: undefined,
      }),
    );
  };

  return (
    <Popover className="relative">
      <PopoverButton outline>
        Filter <ChevronDownIcon />
      </PopoverButton>
      <PopoverPanel anchor="bottom end" className="flex flex-col gap-1">
        <CheckboxButton
          onClick={() => handleToggle("student")}
          checked={optimisticSelectedStatus.includes("student")}
        >
          Cursist
        </CheckboxButton>
        <CheckboxButton
          onClick={() => handleToggle("instructor")}
          checked={optimisticSelectedStatus.includes("instructor")}
        >
          Instructeur
        </CheckboxButton>
        <CheckboxButton
          onClick={() => handleToggle("location_admin")}
          checked={optimisticSelectedStatus.includes("location_admin")}
        >
          Locatie-beheerder
        </CheckboxButton>
      </PopoverPanel>
    </Popover>
  );
}
