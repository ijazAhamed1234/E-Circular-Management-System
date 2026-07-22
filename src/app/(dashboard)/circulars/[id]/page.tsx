"use client";

import { useParams } from "next/navigation";
import CircularDetailPage from "../../../../views/circulars/CircularDetailPage";
import { useAppContext } from "../../../../lib/context/AppContext";

export default function CircularDetailRoute() {
  const params = useParams();
  const id = params?.id as string;
  const { circulars } = useAppContext();
  
  const circular = circulars.find(c => c.id === id);
  if (!circular) {
    return <div className="p-6">Circular not found.</div>;
  }

  return <CircularDetailPage circular={circular} />;
}
