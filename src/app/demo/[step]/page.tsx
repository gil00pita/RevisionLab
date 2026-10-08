import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoJourney } from "../_components/DemoJourney";
import { demoSteps } from "../_components/demoData";

export function generateStaticParams() {
  return demoSteps.map(({ slug }) => ({ step: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ step: string }>;
}): Promise<Metadata> {
  const { step } = await params;
  const current = demoSteps.find(({ slug }) => slug === step);
  return { title: `${current?.label ?? "Demo"} | Northstar Finance demo` };
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const index = demoSteps.findIndex(({ slug }) => slug === step);
  if (index === -1) notFound();
  return <DemoJourney key={step} step={index} />;
}
