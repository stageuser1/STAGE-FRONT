import Link from "next/link";
import { footer } from "@/content/landing";

/**
 * Marketing footer (doc 03 §11). Brand + tagline, product/company link
 * columns, contact, and a bottom legal row.
 */
export function MarketingFooter() {
  return (
    <footer className="border-t border-stage-border bg-stage-bg-soft">
      <div className="mx-auto max-w-stage px-6 py-16 md:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="text-h3 font-bold tracking-tight text-stage-fg">
              STAGE
            </span>
            <p className="mt-3 max-w-[24ch] text-body text-stage-fg-muted">
              {footer.tagline}
            </p>
          </div>

          {footer.columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-caption font-medium uppercase text-stage-fg-muted">
                {column.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link, i) => (
                  <li key={`${link.href}-${i}`}>
                    <Link
                      href={link.href}
                      className="text-body text-stage-fg-muted transition hover:text-stage-fg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-caption font-medium uppercase text-stage-fg-muted">
              {footer.contactTitle}
            </h3>
            <a
              href={`mailto:${footer.contactEmail}`}
              className="mt-4 inline-block text-body text-stage-fg-muted transition hover:text-stage-fg"
            >
              {footer.contactEmail}
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-stage-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-stage-fg-muted">{footer.copyright}</p>
          <div className="flex gap-6">
            {footer.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-caption text-stage-fg-muted transition hover:text-stage-fg"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
