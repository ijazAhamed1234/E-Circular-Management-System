import type { CircularStatus } from "../../lib/types";
import { statusCls, statusDot, statusLabel } from "../../lib/helpers";

interface Props {
  status: CircularStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCls(status)}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusDot(status)}`} />
      {statusLabel(status)}
    </span>
  );
}
