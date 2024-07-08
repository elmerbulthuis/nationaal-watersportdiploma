"use client";

import { XMarkIcon } from "@heroicons/react/16/solid";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import { DropdownItem } from "~/app/(dashboard)/_components/dropdown";
import {
  claimStudents,
  releaseStudent,
  releaseStudentFromCohortByAllocationId,
  withdrawStudentFromCurriculum,
} from "../../(overview)/_actions/nwd";

export function ClaimInstructorAllocation({
  cohortId,
  studentAllocationId,
}: {
  cohortId: string;
  studentAllocationId: string;
}) {
  return (
    <Button
      outline
      className="shrink-0"
      onClick={async () => {
        await claimStudents(cohortId, [studentAllocationId])
          .then(() => toast.success("Cursist toegekent"))
          .catch(() => toast.error("Er is iets misgegaan"));
      }}
    >
      Claim
    </Button>
  );
}

export function ReleaseInstructorAllocation({
  cohortId,
  studentAllocationId,
}: {
  cohortId: string;
  studentAllocationId: string;
}) {
  return (
    <Button
      plain
      className="shrink-0"
      onClick={async () => {
        await releaseStudent(cohortId, [studentAllocationId])
          .then(() => toast.success("Cursist vrijgegeven"))
          .catch(() => toast.error("Er is iets misgegaan"));
      }}
    >
      <XMarkIcon />
    </Button>
  );
}

export function ReleaseStudentAllocation({
  cohortId,
  studentAllocationId,
  locationId,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;
}) {
  const router = useRouter();
  const params = useParams();

  return (
    <DropdownItem
      onClick={async () => {
        try {
          await releaseStudentFromCohortByAllocationId({
            allocationId: studentAllocationId,
            cohortId,
            locationId,
          });

          // We deleted the allocation, so the page does not exist anymore
          // We need to redirect to the cohort overview
          router.push(
            `/locatie/${params.location as string}/cohorten/${params.cohort as string}`,
          );
          toast.success("Cursist verwijderd");
        } catch (error) {
          toast.error("Er is iets misgegaan");
        }
      }}
    >
      Verwijder uit cohort
    </DropdownItem>
  );
}

export function WithdrawStudentCurriculum({
  studentAllocationId,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;
}) {
  return (
    <DropdownItem
      onClick={async () => {
        try {
          await withdrawStudentFromCurriculum({
            allocationId: studentAllocationId,
          });
        } catch (error) {
          toast.error("Er is iets misgegaan");
        }
      }}
    >
      Verwijder programma
    </DropdownItem>
  );
}
