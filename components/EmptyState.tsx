import Link from "next/link";
import { Icon, type IconName } from "./ui/Icon";

interface EmptyStateProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: IconName;
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon = "search",
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-line bg-white px-5 py-10 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-300">
        <Icon name={icon} size={24} />
      </div>
      <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
