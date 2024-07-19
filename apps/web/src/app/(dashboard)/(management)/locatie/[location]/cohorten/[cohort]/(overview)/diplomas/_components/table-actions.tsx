import { ChevronDownIcon } from "@heroicons/react/16/solid";
import type { Row } from "@tanstack/react-table";
import { useState, useTransition } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";

import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";

import dayjs from "dayjs";
import { toast } from "sonner";
import { z } from "zod";
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import { ErrorMessage, Label } from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import Spinner from "~/app/_components/spinner";
import { completeAllCoreCompetencies } from "../../_actions/nwd";
import {
  issueCertificates,
  withDrawCertificates,
} from "../_actions/quick-actions";
import type { Student } from "./students-table";

interface Props {
  count?: number;
  rows: Row<Student>[];
  cohortId: string;
  defaultVisibleFrom?: string;
}

export function ActionButtons(props: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<string | null>(null);

  const allRowsHaveIssuedCertificates = props.rows.every(
    (row) => !!row.original.certificate?.issuedAt,
  );
  const noneRowsHaveIssuedCertificates = props.rows.every(
    (row) => !row.original.certificate,
  );

  const allRowsHaveACurriculum = props.rows.every((row) => {
    return !!row.original.studentCurriculum;
  });

  const allRowsHaveACurriculumWithAtLeastOneModule = props.rows.every((row) => {
    if (!row.original.studentCurriculum) return false;

    const completedModules = row.original.studentCurriculum.moduleStatus.filter(
      (status) => status.completedCompetencies === status.totalCompetencies,
    ).length;

    return completedModules > 0;
  });

  const params = new URLSearchParams();

  props.rows.forEach((row) => {
    if (!row.original.certificate) return;
    params.append("certificate[]", row.original.certificate.handle);
  });

  return (
    <>
      <Dropdown>
        <DropdownButton aria-label="Acties" className="!absolute left-12 top-0">
          {`(${props.count})`} Acties <ChevronDownIcon />
        </DropdownButton>
        <DropdownMenu anchor="bottom start">
          <DropdownItem
            onClick={() => setIsDialogOpen("issue")}
            disabled={
              !(
                noneRowsHaveIssuedCertificates &&
                allRowsHaveACurriculumWithAtLeastOneModule
              )
            }
          >
            Diploma's uitgeven
          </DropdownItem>
          <DropdownItem
            onClick={() => setIsDialogOpen("remove")}
            disabled={!allRowsHaveIssuedCertificates}
          >
            Diploma's verwijderen
          </DropdownItem>
          <DropdownItem
            href={`/api/export/certificate/pdf?${params.toString()}`}
            target="_blank"
            disabled={!allRowsHaveIssuedCertificates}
          >
            Download
          </DropdownItem>
          <DropdownItem
            onClick={() => setIsDialogOpen("complete-core-modules")}
            disabled={!allRowsHaveACurriculum}
          >
            Kerncompetencies afronden
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <IssueCertificateDialog
        {...props}
        isOpen={isDialogOpen === "issue"}
        setIsOpen={(value) => setIsDialogOpen(value ? "issue" : null)}
      />

      <RemoveCertificateDialog
        {...props}
        isOpen={isDialogOpen === "remove"}
        setIsOpen={(value) => setIsDialogOpen(value ? "remove" : null)}
      />

      <CompleteCoreModulesDialog
        {...props}
        isOpen={isDialogOpen === "complete-core-modules"}
        setIsOpen={(value) =>
          setIsDialogOpen(value ? "complete-core-modules" : null)
        }
      />
    </>
  );
}

export function IssueCertificateDialog({
  rows,
  cohortId,
  defaultVisibleFrom,
  isOpen,
  setIsOpen,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const [delayVisibility, setDelayVisibility] = useState(!!defaultVisibleFrom);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Alert open={isOpen} onClose={setIsOpen} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();

          const formData = new FormData(e.target as HTMLFormElement);
          const visibleFrom = formData.get("visibleFrom") as string | null;

          startTransition(async () => {
            await issueCertificates({
              cohortAllocationIds: rows.map((row) => row.original.id),
              visibleFrom: delayVisibility
                ? dayjs(visibleFrom).toISOString()
                : null,
              cohortId,
            })
              .then(() => setIsOpen(false))
              .catch((error) => {
                if (error instanceof Error) {
                  return setError(error.message);
                }
                setError("Er is een fout opgetreden.");
              });
          });
        }}
      >
        <AlertTitle>Diploma's uitgeven</AlertTitle>

        <AlertBody>
          <CheckboxField>
            <Checkbox
              checked={delayVisibility}
              onChange={() => setDelayVisibility(!delayVisibility)}
            />
            <Label>Vertraagd zichtbaar maken</Label>
          </CheckboxField>

          {delayVisibility ? (
            <>
              <Text className="mt-2">
                Het diploma kan met een maximale vertraging van 72 uur worden
                uitgegeven voordat het zichtbaar wordt in de online omgeving van
                de cursist. <Strong>Let op:</Strong> De QR-code op het diploma
                werkt altijd.
              </Text>
              <div className="mt-4">
                <Input
                  name="visibleFrom"
                  type="datetime-local"
                  aria-label="Zichtbaar vanaf"
                  required={true}
                  defaultValue={
                    (defaultVisibleFrom ?? dayjs().toISOString()).split(".")[0]
                  }
                />
              </div>
            </>
          ) : null}

          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        </AlertBody>
        <AlertActions>
          <Button plain onClick={() => setIsOpen(false)}>
            Annuleren
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner className="text-white" /> : null}
            Uitgeven
          </Button>
        </AlertActions>
      </form>
    </Alert>
  );
}

export function RemoveCertificateDialog({
  rows,
  isOpen,
  cohortId,
  setIsOpen,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Alert open={isOpen} onClose={setIsOpen} size="md">
      <AlertTitle>Diploma's verwijderen</AlertTitle>
      <AlertDescription>
        Tot 24 uur na het uitgeven van een diploma kan deze nog verwijderd
        worden.{" "}
        <strong>
          Het verwijderen maakt het reeds uitgegeven diploma onbruikbaar!
        </strong>{" "}
        <br />
        Weet je zeker dat je de diploma's wilt verwijderen?
      </AlertDescription>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <AlertActions>
        <Button plain onClick={() => setIsOpen(false)}>
          Annuleren
        </Button>
        <Button
          color="red"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await withDrawCertificates({
                certificateIds: rows.map((row) => row.original.certificate!.id),
                cohortId,
              })
                .then(() => setIsOpen(false))
                .catch((error) => {
                  if (error instanceof Error) {
                    return setError(error.message);
                  }
                  setError("Er is een fout opgetreden.");
                });
            });
          }}
        >
          {pending ? <Spinner className="text-white" /> : null} Verwijderen
        </Button>
      </AlertActions>
    </Alert>
  );
}

const CONFIRMATION_WORD = "begrepen";

function CompleteCoreModulesDialog({
  rows,
  isOpen,
  setIsOpen,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const submit = async (_prevState: unknown, formData: FormData) => {
    try {
      z.literal(CONFIRMATION_WORD).parse(formData.get("confirm"));

      await completeAllCoreCompetencies({
        cohortAllocationId: rows.map((row) => row.original.id),
      });

      toast.success("Kernmodules afgerond");
      setIsOpen(false);
    } catch (error) {
      toast.error("Er is iets misgegaan");
    }
  };

  const [_state, formAction] = useActionState(submit, undefined);

  return (
    <>
      <Alert open={isOpen} onClose={setIsOpen} size="lg">
        <AlertTitle>Alle kernmodules afronden</AlertTitle>
        <AlertDescription>
          With great power comes great responsibility. Houd rekening met het
          volgende:
          <ul className="list-inside list-disc mt-2 mb-4">
            <li>
              Niet alle kernmodules zijn vereist voor het behalen van een
              diploma.
            </li>
            <li>
              Het doel is een realistisch en herkenbaar diploma dat alleen de
              daadwerkelijk geoefende en beheerste modules weergeeft.
            </li>
            <li>
              Niet alle kernmodules kunnen in elk vaartuig worden afgerond.
            </li>
          </ul>
          Als je zeker bent van wat je doet en de gevolgen begrijpt, typ dan het
          woord <Strong>{CONFIRMATION_WORD}</Strong> om de kernmodules af te
          ronden.
        </AlertDescription>
        <form action={formAction}>
          <AlertBody>
            <Input
              name="confirm"
              type="text"
              required
              pattern={CONFIRMATION_WORD}
            />
          </AlertBody>
          <AlertActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Annuleren
            </Button>
            <CoreModulesSubmitButton />
          </AlertActions>
        </form>
      </Alert>
    </>
  );
}

function CoreModulesSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Afronden
    </Button>
  );
}
