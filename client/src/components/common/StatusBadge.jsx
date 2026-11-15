import { STATUS_CONFIG } from '../../utils/formatter';

export default function StatusBadge({ status }) {
  const info = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${info.color}`}>
      {info.label}
    </span>
  );
}