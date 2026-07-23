"use client";

import { useParams } from "next/navigation";
import CircularDetailPage from "../../../../views/circulars/CircularDetailPage";
import { useAppContext } from "../../../../lib/context/AppContext";
import { useEffect, useState } from "react";

export default function CircularDetailRoute() {
  const params = useParams();
  const id = params?.id as string;
  const { circulars, updateCircular } = useAppContext();
  
  const [circular, setCircular] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = circulars.find(c => c.id === id);
    if (existing) {
      setCircular(existing);
      setLoading(false);
    } else {
      fetch(`/api/circulars/${id}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Not found');
        })
        .then(data => {
          setCircular(data);
          updateCircular(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [id, circulars, updateCircular]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!circular) return <div className="p-6">Circular not found.</div>;

  return <CircularDetailPage circular={circular} />;
}
