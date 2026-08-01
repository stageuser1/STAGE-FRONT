/**
 * `next/link`, reduced to what a test can observe.
 *
 * The real component adds prefetching and client-side navigation on top of an
 * anchor. Neither is a thing a component test asserts, and both need an App
 * Router context, so this renders the anchor and forwards the rest. A test that
 * cares about where a row points reads `href` and gets the same answer it would
 * from the real thing.
 */
import type { AnchorHTMLAttributes, ReactNode } from "react";

export default function Link({
  href,
  children,
  ...rest
}: { href: string; children?: ReactNode } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
