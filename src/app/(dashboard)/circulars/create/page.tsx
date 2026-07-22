"use client";

import { Suspense } from "react";
import CreateCircularPage from "../../../../views/circulars/CreateCircularPage";

export default function CreateCircularRoute() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-[#5a6483]">Loading circular form...</div>}>
      <CreateCircularPage />
    </Suspense>
  );
}
