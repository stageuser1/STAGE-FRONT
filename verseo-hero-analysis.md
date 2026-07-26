Read-only inspection completed against the public [Verseo reference site](https://verseo.framer.website/). No repository or local files were changed.

Labels used below:

- **Observed** — verified in the live DOM, computed CSS, rendered assets, or published Framer bundle.
- **Estimate** — visually or mathematically approximated.
- **Inference** — likely implementation intent based on observed behavior.
- **Unverified** — could not be confirmed conclusively.

## A. Hero layout structure

### Desktop

**Observed**

- The Hero is a normal document-flow section with:
  - `position: relative`
  - fixed height `993px`
  - `overflow: visible`
  - full viewport width
- A fixed navigation sits over it at `z-index: 10`; the Hero itself starts at document `y: 0`.
- The main text block is absolutely positioned:
  - `top: 153px`
  - centered horizontally
  - `width: 56%`
  - `max-width: 808px`
  - `z-index: 2`
- At the inspected 1440px viewport, scrollbar-adjusted content width was about `1424.7px`:
  - outer text block: `797.8px`
  - inner readable width after 30px side padding: `737.8px`
- Content geometry:

| Element | Position / size |
|---|---:|
| Eyebrow | y `192.9`, h `16.8` |
| Headline line 1 | y `221.7`, h `66` |
| Headline line 2 | y `287.7`, h `66` |
| Description | y `367.7`, h `50.4` |
| CTAs | y `450.1`, h `48` |
| Floating prompt bar | y `531`, h `112.8` |
| Preview region | y `581–931` |
| Hero bottom | y `993` |

**Observed spacing**

- Eyebrow → headline: `12px`
- Between headline lines: no explicit gap
- Headline → description: `14px`
- Description → CTAs: `32px`
- CTA gap: `12px`
- CTA size: approximately `142 × 48px`
- CTAs → prompt bar: approximately `33px`

**Observed typography**

- Headline: Inter, `60px`, `600`, `66px` line-height, `-0.03em`
- Description: Inter, `18px`, `400`, `25.2px` line-height, `-0.02em`
- Eyebrow: `14px`, `16.8px` line-height, color `#686868`

### Product preview

**Observed**

- The preview is not in normal flow.
- A `position: absolute` illustration region is anchored to the Hero bottom:
  - `height: 412px`
  - top `581px`
  - bottom `993px`
  - `z-index: 2`
- Its main wrapper is centered at `84%` width:
  - measured `1196.7 × 350px`
  - x `114px`
  - bottom around `931px`, leaving roughly `62px` before the Hero boundary
- The dashboard raster is a responsive PNG with an intrinsic size of `2151 × 720`.
  - rendered approximately `948 × 313px`
- The floating prompt/chat element is DOM-based and overlaps the preview:
  - starts `50px` above the preview wrapper
  - extends roughly `63px` into it
  - `z-index: 2`
- The preview has a slight perspective/entrance transform, but it is neither sticky nor scroll-pinned.
- When the page scrolls 200px, the preview moves upward by 200px with the document.

## B. Background layer structure

From back to front:

1. **Page/Hero base**
   - **Observed:** near-white token `#F9F9F9`
   - Hero CSS gradient: `#F9F9F9 0% → transparent 100%`

2. **Cloud/sky sequence**
   - **Observed:** absolute scroll area, `z-index: 1`
   - Desktop scroll area: `3466px` tall
   - It starts at Hero top and protrudes `2473px` below the 993px Hero
   - `pointer-events: none`
   - Internally clipped

3. **Scroll-sequence component**
   - **Observed:** `1828px` high, `opacity: 0.6`
   - Uses `object-fit: cover` and centered object positioning
   - Renders two absolutely stacked `<img>` nodes for frame swapping

4. **Fading “Hero Surface”**
   - **Observed:** `1838px` high, absolute, `z-index: 1`
   - Exact published gradient:
     - `#F9F9F9` at `7%`
     - transparent at `52.2599%`
     - `#F9F9F9` at `76%`
   - This overlays the image sequence and suppresses it at the top and bottom.

5. **Grid**
   - **Observed:** DOM lines, not one CSS background image
   - Desktop vertical spacing is approximately `100.1px`
   - Lines use a `#EDEDED` border
   - The inspected rails use a 2px pseudo-element border on a 1px-wide positioning element
   - Decorative grid/dot layer opacity: `0.7`
   - Main grid layer: `z-index: 2`; internal dots/rails use `z-index: 0–1`

6. **Text and product preview**
   - Text block and preview region: `z-index: 2`
   - Inner text/CTA group: `z-index: 3`

The sky-blue appearance is therefore not a single CSS white-to-blue gradient. It is the composite of the WebP frames at 60% opacity, the near-white page underneath, the two near-white overlay gradients, and the grid.

## C. Cloud movement mechanism

**Directly observed**

- The clouds are not moved with `translateX`.
- At both scroll positions inspected, the cloud image and all relevant ancestors retained:
  - identical dimensions
  - `transform: none`
  - centered object positioning
- The published component references a manifest containing **124 separate static WebP frames**.
- Each inspected frame is `1920 × 1080`.
- The metadata label references a `3840 × 2160`, 30fps source, but the delivered frames are individual WebPs.
- The component maps scroll progress to an integer frame:

  `frame ≈ round(progress × 123)`

- It uses:
  - document/ancestor scroll progress
  - `requestAnimationFrame`
  - wheel-event tracking as a fallback/manual scrubber
  - clamped progress from `0` to `1`
- It double-buffers two `<img>` elements and toggles their opacity.
- At page `scrollY: 0`, frame 0 was visible.
- After one 200px wheel/scroll sample:
  - frame 0 remained in the DOM at opacity `0`
  - frame 27 was visible at opacity `1`
  - both image elements still had `transform: none`

### Why it feels stepped or stop-motion-like

**Observed**

- Progress is rounded to one of 124 integer frames.
- The component may temporarily display the nearest loaded frame when the requested frame has not finished decoding.
- It preloads around the active frame, uses directional look-ahead, and limits the active cache.

**Inference**

The stop-motion character comes from three effects:

1. Scroll is quantized into discrete images rather than continuously interpolated.
2. A frame may repeat for several scroll ticks and then jump.
3. Image decoding/cache fallback can briefly hold a nearby frame before advancing.

This is substantially different from a smooth CSS parallax transform.

### Movement distance

**Observed:** there is no meaningful DOM `translateX` distance to report; the lateral movement is baked into the frame artwork.

**Estimate:** cross-frame comparison suggests roughly `600px` of cumulative lateral image-content drift at the 1920px source scale. Because desktop `cover` scaling is about `1.69×`, that corresponds to roughly `1,000 CSS px` across the complete sequence. Clouds morph and occlude one another, so this is an order-of-magnitude estimate, not one rigid object translation.

Scrolling in the opposite direction reverses the sequence and its apparent direction.

## D. Hero-to-white-section transition

**Observed**

- The Hero ends at `993px`.
- The immediate next strip, “Client Logos,” begins at `993px`, is `168px` high, transparent, and sits at `z-index: 2`.
- The following section begins at `1161px` and is also transparent.
- The page underneath is technically `#F9F9F9`, not pure `#FFFFFF`.
- The cloud/sky scroll area continues underneath these sections.
- The overlay becomes fully `#F9F9F9` at approximately:

  `1838 × 0.76 ≈ 1397px`

So there is no hard Hero-to-white cut. The sequence continues under the first post-Hero content, then the “Hero Surface” progressively covers it between approximately `960px` and `1397px`. White cloud shapes make the transition look even softer.

**Conclusion:** visually it becomes a clean white/near-white second section, but technically it is an extended background layer fading into `#F9F9F9`, not a separate white panel placed directly at the Hero boundary.

## E. Approximate specification

| Property | Value | Confidence |
|---|---:|---|
| Desktop Hero height | `993px` | Observed |
| Desktop text container | `56vw`, max `808px` | Observed |
| Inner text width at 1440 viewport | `~738px` | Observed |
| Text-block top | `153px` | Observed |
| Preview region | `412px` high, bottom-aligned | Observed |
| Preview wrapper | `84%`, ~`1197 × 350px` | Observed |
| Dashboard raster | ~`948 × 313px` rendered | Observed |
| Cloud sequence container | `1828px` | Observed |
| Cloud fade overlay | `1838px` | Observed |
| Extended scroll area | `3466px` desktop | Observed |
| Sequence frame count | `124` | Observed |
| Frame size | `1920 × 1080` WebP | Observed |
| Grid pitch | `~100px` desktop | Observed |
| Grid color | `#EDEDED` | Observed |
| Base white | `#F9F9F9` | Observed |
| Main text | `#181818` | Observed |
| Muted text | `#686868` | Observed |
| Composite upper sky | `~#E8F1F9` | Estimate |
| Composite lower sky | `~#B9D2EA` | Estimate |
| Clouds | `#F8FAFC–#FFFFFF` | Estimate |
| Full sequence lateral drift | order of `600px` source / `1000px` rendered | Estimate |

### Practical z-index order

- Fixed navigation: `10`
- Hero content inner group: `3`
- Text block, preview region, foreground grid: `2`
- Scroll area/cloud sequence/fade: `1`
- Internal grid rails: `0–1`
- Page background: default stacking level

## F. Desktop/mobile differences

The published breakpoints are:

- Desktop: `≥1200px`
- Tablet: `810–1199px`
- Mobile: `<810px`

| Aspect | Desktop | Mobile |
|---|---|---|
| Hero height | Fixed `993px` | `min-content`; estimated `450–480px` depending wrapping |
| Hero alignment | Centered | Starts at left-side container |
| Hero padding | `0` | `120px 0 0 24px` |
| Text block | Absolute, top `153px`, `56%`, max `808px` | Relative, full width, max `1020px`, `20px` right padding |
| Heading | `60/66px` | `42/46.2px` |
| Description | `18/25.2px` | `16/22.4px` |
| CTAs | Two inline, 142px each, 12px gap | Full-width stacked, 6px gap |
| Product preview | Visible and bottom-anchored | Hidden |
| Cloud sequence | Present | Present |
| Grid | Full ~100px grid | Simplified; most interior vertical rails hidden |
| Positioning | Mostly absolute inside fixed Hero | Main copy returns to normal flow |

**Observed tablet behavior:** the intermediate layout keeps the preview, uses a `52px` headline, moves the text block into relative flow at `80%` width, and adds `180px` top padding.

**Unverified:** the in-app viewport override did not produce a separate live mobile render in this inspection session. Mobile findings above come directly from the published responsive CSS and responsive visibility classes, but the final mobile pixel geometry is estimated rather than screenshot-measured.

## G. Concise implementation handoff for Claude Opus

Implement the effect as four independent systems:

1. **Hero layout**
   - Relative, fixed `993px` desktop container.
   - Absolute centered content at `top: 153px`.
   - Max outer width `808px`; 30px internal side padding.
   - Absolute, bottom-aligned preview region.
   - Under 810px, switch the copy to normal flow and hide the preview.

2. **Background**
   - Base `#F9F9F9`.
   - Separate sky/cloud layer at about 60% opacity.
   - DOM or repeating-gradient grid at roughly 100px.
   - Add the exact-style near-white overlay: solid near-white at 7%, transparent around 52%, near-white again by 76%.

3. **Cloud motion**
   - For a close reproduction, use an original 100–125-frame image sequence.
   - Map scroll progress to `Math.round(progress * (frameCount - 1))`.
   - Double-buffer two images to avoid blank frames.
   - Preload a forward-biased frame window.
   - Do not translate the image element itself.
   - For a lightweight approximation, quantize a CSS cloud layer’s `translateX`.

4. **Transition**
   - Let the background extend several hundred pixels beyond the Hero.
   - Put subsequent content above it.
   - Fade the extended background to `#F9F9F9`; do not create a hard section boundary.
   - Honor `prefers-reduced-motion` by showing one static cloud frame.

Avoid using the reference assets. Recreate the clouds, product mockup, and icons independently.

## H. Minimal independent example with tunable variables

This uses CSS-generated clouds and a quantized translation. It recreates the behavior without copying the reference’s assets or component code.

```tsx
// components/Hero.tsx
"use client";

import { useEffect, useRef } from "react";

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const update = () => {
      raf = 0;

      if (reduced.matches) {
        hero.style.setProperty("--cloud-x", "0px");
        return;
      }

      const styles = getComputedStyle(hero);
      const range =
        parseFloat(styles.getPropertyValue("--cloud-range")) || 900;
      const travel =
        parseFloat(styles.getPropertyValue("--cloud-travel")) || 320;
      const steps =
        parseInt(styles.getPropertyValue("--cloud-steps"), 10) || 48;

      const heroTop = hero.getBoundingClientRect().top + window.scrollY;
      const raw = (window.scrollY - heroTop) / range;
      const progress = Math.max(0, Math.min(1, raw));
      const stepped = Math.round(progress * steps) / steps;

      hero.style.setProperty(
        "--cloud-x",
        `${Math.round(stepped * travel)}px`
      );
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <>
      <section
        ref={heroRef}
        className="hero relative isolate overflow-visible bg-[#f9f9f9] text-[#181818]"
      >
        <div className="hero-sky" aria-hidden="true">
          <div className="hero-clouds" />
          <div className="hero-fade" />
        </div>

        <div className="hero-grid" aria-hidden="true" />

        <div className="hero-copy">
          <div className="space-y-3 text-center">
            <p className="text-sm tracking-[-0.02em] text-[#686868]">
              [ AI workspace ]
            </p>

            <h1 className="text-[42px] font-semibold leading-[1.1] tracking-[-0.03em] min-[1200px]:text-[60px]">
              Create stronger content.
              <br />
              Faster with AI.
            </h1>
          </div>

          <p className="mx-auto max-w-[46rem] text-center text-base leading-[1.4] tracking-[-0.02em] min-[1200px]:text-lg">
            Turn a rough idea into structured, ready-to-use copy without
            breaking your workflow.
          </p>

          <div className="hero-actions">
            <a className="rounded bg-[#181818] px-6 py-[14px] text-center text-white">
              Get started
            </a>
            <a className="rounded border border-[#181818] bg-white px-6 py-[14px] text-center">
              Try demo
            </a>
          </div>
        </div>

        <div className="hero-preview" aria-hidden="true">
          <div className="hero-prompt">What do you want to create today?</div>
          <div className="hero-dashboard">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="h-36 rounded bg-slate-100" />
              <div className="col-span-2 h-36 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-[2] min-h-[420px] bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">Second section</div>
      </section>
    </>
  );
}
```

```css
/* globals.css */
.hero {
  --hero-height: 993px;
  --content-width: 808px;
  --grid-size: 100px;

  --cloud-x: 0px;
  --cloud-travel: 320;
  --cloud-range: 900;
  --cloud-steps: 48;

  min-height: var(--hero-height);
}

.hero-sky {
  position: absolute;
  inset: 0 0 auto;
  z-index: 0;
  height: 1180px;
  overflow: hidden;
  pointer-events: none;
  background:
    linear-gradient(
      180deg,
      #f9f9f9 0%,
      #edf4fa 24%,
      #c7dcef 62%,
      #b5d0e8 78%,
      #ffffff 100%
    );
}

.hero-clouds {
  position: absolute;
  left: -45vw;
  bottom: 40px;
  width: 170vw;
  height: 300px;
  transform: translate3d(var(--cloud-x), 0, 0);
  will-change: transform;
  filter: blur(1.5px);
  background:
    radial-gradient(ellipse at 8% 100%, #fff 0 22%, transparent 23%),
    radial-gradient(ellipse at 25% 94%, #fff 0 28%, transparent 29%),
    radial-gradient(ellipse at 46% 104%, #fff 0 31%, transparent 32%),
    radial-gradient(ellipse at 68% 92%, #fff 0 27%, transparent 28%),
    radial-gradient(ellipse at 88% 103%, #fff 0 30%, transparent 31%);
}

.hero-fade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      #f9f9f9 7%,
      transparent 52%,
      #f9f9f9 76%
    );
}

.hero-grid {
  position: absolute;
  inset: 65px 0 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.65;
  background-image:
    linear-gradient(to right, #ededed 1px, transparent 1px),
    linear-gradient(to bottom, #ededed 1px, transparent 1px);
  background-size: var(--grid-size) var(--grid-size);
}

.hero-copy {
  position: absolute;
  z-index: 3;
  top: 153px;
  left: 50%;
  width: min(56%, var(--content-width));
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-inline: 30px;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.hero-actions > a {
  width: 142px;
  min-height: 48px;
}

.hero-preview {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: 62px;
  width: min(84%, 1200px);
  height: 350px;
  transform: translateX(-50%);
}

.hero-prompt {
  position: absolute;
  z-index: 2;
  top: -50px;
  left: 50%;
  width: min(573px, 75%);
  transform: translateX(-50%);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  padding: 24px;
  box-shadow: 0 18px 50px rgb(31 56 80 / 12%);
}

.hero-dashboard {
  height: 100%;
  overflow: hidden;
  border: 1px solid #ededed;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  padding: 30px;
  box-shadow: 0 32px 80px rgb(31 56 80 / 12%);
}

@media (max-width: 809px) {
  .hero {
    min-height: auto;
    padding: 120px 24px 0;
  }

  .hero-copy {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    transform: none;
    padding: 0 20px 0 0;
  }

  .hero-actions {
    flex-direction: column;
    gap: 6px;
  }

  .hero-actions > a {
    width: 100%;
  }

  .hero-preview {
    display: none;
  }

  .hero-grid {
    --grid-size: 96px;
  }
}
```
