import { Suspense } from "react";

import { PageLoader } from "@/components/ui/Spinner";

import { LearnView } from "./LearnView";

export default async function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<PageLoader />}>
      <LearnView slug={slug} />
    </Suspense>
  );
}
