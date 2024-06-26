"use client";

import { type PropsWithChildren } from "react";
import { useFormState as useActionState } from "react-dom";
import { toast } from "sonner";
import { updateSettings } from "../_actions/update";

import { useFormStatus } from "react-dom";
import { Button } from "~/app/(dashboard)/_components/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      Opslaan
    </Button>
  );
}

export default function SettingsForm({
  children,
  className,
  locationId,
}: PropsWithChildren<{ className?: string; locationId: string }>) {
  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await updateSettings(locationId, prevState, formData);
    if (result.message === "Success") {
      toast.success("Instellingen zijn geüpdatet.");
    } else {
      toast.error("Er is iets misgegaan");
    }
    return result;
  };

  const [_state, formAction] = useActionState(submit, undefined);

  return (
    <form className={className} action={formAction}>
      {children}

      <div className="mt-6 flex gap-x-2.5 justify-end">
        <Button plain type="reset">
          Reset
        </Button>

        <SubmitButton />
      </div>
    </form>
  );
}
