import { Reveal } from "@/components/motion/Reveal";

/**
 * Shared eyebrow + h2 + optional intro pattern (doc 02 §3 type scale).
 * `onDark` inverts colours for the CTA band. Server component; the entrance
 * animation lives in the Reveal wrapper.
 */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "center",
  onDark = false,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "center" | "left";
  onDark?: boolean;
}) {
  const alignClasses =
    align === "center" ? "items-center text-center" : "items-start text-left";
  const titleColor = onDark ? "text-stage-fg-on-dark" : "text-stage-fg";
  const introColor = onDark ? "text-stage-fg-on-dark-muted" : "text-stage-fg-muted";
  const eyebrowColor = onDark ? "text-stage-blue-200" : "text-stage-primary";

  return (
    <Reveal className={`flex flex-col ${alignClasses}`}>
      {eyebrow ? (
        <span
          className={`mb-3 text-caption font-medium uppercase ${eyebrowColor}`}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={`text-balance text-h2-sm font-bold md:text-h2 ${titleColor}`}
      >
        {title}
      </h2>
      {intro ? (
        <p
          className={`mt-4 max-w-2xl text-body-lg ${introColor} ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {intro}
        </p>
      ) : null}
    </Reveal>
  );
}
