import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-8 text-center">
      <div className="mx-auto mb-4 h-10 w-10 rounded-full border border-gray-200 bg-gray-50" />
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          className="mt-5 inline-flex min-h-10 items-center rounded-full bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-900"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
