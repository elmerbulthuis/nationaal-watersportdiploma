"use client";

import { usePostHog } from "posthog-js/react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";
import {
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import CreateBulkDialog from "./create-bulk-dialog";
import CreateSingleDialog from "./create-single-dialog";

const DialogContext = createContext<{
  isOpen: "single" | "bulk" | null;
  setIsOpen: Dispatch<SetStateAction<"single" | "bulk" | null>>;
}>({
  isOpen: null,
  //   eslint-disable-next-line @typescript-eslint/no-empty-function
  setIsOpen: () => {},
});

export function DialogWrapper({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState<"single" | "bulk" | null>(null);
  const posthog = usePostHog();
  return (
    <DialogContext.Provider
      value={{
        isOpen,
        setIsOpen: (newValue) => {
          posthog.capture("Create Person Dialog Opened", { type: newValue });
          setIsOpen(newValue);
        },
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  return useContext(DialogContext);
}

export function DialogButtons() {
  const { setIsOpen } = useDialog();

  return (
    <>
      <DropdownItem onClick={() => setIsOpen("single")}>
        <DropdownLabel>Enkel</DropdownLabel>
      </DropdownItem>
      <DropdownItem onClick={() => setIsOpen("bulk")}>
        <DropdownLabel>Meerdere (bulk)</DropdownLabel>
      </DropdownItem>
    </>
  );
}

export function Dialogs(props: {
  countries: { code: string; name: string }[];
  locationId: string;
}) {
  const { isOpen, setIsOpen } = useDialog();

  return (
    <>
      <CreateBulkDialog
        {...props}
        isOpen={isOpen === "bulk"}
        setIsOpen={(next) => {
          setIsOpen(next ? "bulk" : null);
        }}
      />
      <CreateSingleDialog
        {...props}
        isOpen={isOpen === "single"}
        setIsOpen={(next) => {
          setIsOpen(next ? "single" : null);
        }}
      />
    </>
  );
}
