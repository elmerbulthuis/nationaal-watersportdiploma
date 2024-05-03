import { constants } from "@nawadi/lib";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { retrieveCertificateById } from "~/lib/nwd";
import { Text, TextLink } from "../../_components/text";
import { generateAdvise } from "../_utils/generate-advise";
import { Confetti } from "./_components/confetti";
import CertificateTemplate from "./_components/template";

export default async function Page({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const [certificate, advice] = await Promise.all([
    retrieveCertificateById(params.id).catch(() => notFound()),
    generateAdvise(params.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-gray-950">
          {`Gefeliciteerd, ${certificate.student.firstName}! Een nieuw diploma!`}
        </h2>

        <Suspense>
          <Confetti />
        </Suspense>
      </div>

      <div className="rounded-sm overflow-hidden bg-white drop-shadow-[0_10px_8px_rgba(0,0,0,0.04),0_4px_3px_rgba(0,0,0,0.1)]">
        <CertificateTemplate id={params.id} />
      </div>

      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-gray-950">En nu?</h2>

        <Text className="max-w-prose mx-auto mt-1.5">{advice}</Text>

        <Text className="max-w-prose mx-auto mt-2">
          Leer meer over alle verschillende diploma's op{" "}
          <TextLink href="/diplomalijn/consument">onze diplomalijn</TextLink>{" "}
          pagina!
        </Text>

        <Text className="max-w-prose mx-auto mt-8">
          <strong>Psst..</strong> Deel een foto van jou en je diploma op
          Instagram, tag ons op{" "}
          <TextLink href={constants.INSTAGRAM_URL}>
            @nationaalwatersportdiploma
          </TextLink>{" "}
          en krijg een unieke NWD sticker thuisgestuurd!
        </Text>
      </div>
    </div>
  );
}
