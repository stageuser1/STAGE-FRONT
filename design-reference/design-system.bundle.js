/* @ds-bundle: {"format":4,"namespace":"STAGEDesignSystem_0f9c53","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Eyebrow","sourcePath":"components/core/Eyebrow.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"SectionHeader","sourcePath":"components/core/SectionHeader.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"DataRow","sourcePath":"components/data/DataRow.jsx"},{"name":"SourceLink","sourcePath":"components/data/SourceLink.jsx"},{"name":"StatFigure","sourcePath":"components/data/StatFigure.jsx"},{"name":"VerifiedBadge","sourcePath":"components/data/VerifiedBadge.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"37ba2c517f22","components/core/Button.jsx":"32c2b4e4c33a","components/core/Card.jsx":"1e2707ca9d72","components/core/Eyebrow.jsx":"a8b20d37121a","components/core/Icon.jsx":"212066988a82","components/core/IconButton.jsx":"7838ca5439e0","components/core/SectionHeader.jsx":"62b4e22ac22c","components/core/Tag.jsx":"7ea94656ec61","components/data/DataRow.jsx":"6886d4b02158","components/data/SourceLink.jsx":"58b336ee55ff","components/data/StatFigure.jsx":"a1907b20a6de","components/data/VerifiedBadge.jsx":"99df893420c0","components/feedback/Dialog.jsx":"7d564808a28b","components/feedback/EmptyState.jsx":"2864b34e3a1c","components/feedback/Toast.jsx":"e11416492586","components/feedback/Tooltip.jsx":"2a1cde0a9f71","components/forms/Checkbox.jsx":"ae56ef48777c","components/forms/Input.jsx":"cc446b553e64","components/forms/Radio.jsx":"ce0865d91f5b","components/forms/Select.jsx":"4f4bd5596ea2","components/forms/Switch.jsx":"2ca977c137f8","components/navigation/Tabs.jsx":"c0799914bf19","ui_kits/ielts_lab/BankScreen.jsx":"9eb6d2050f62","ui_kits/ielts_lab/EvidenceReview.jsx":"01b122660cd8","ui_kits/ielts_lab/HistoryScreen.jsx":"353c2462edc6","ui_kits/ielts_lab/LabFooter.jsx":"f4c771c589fc","ui_kits/ielts_lab/LabShell.jsx":"08eaf9e29f71","ui_kits/ielts_lab/ListeningPractice.jsx":"a3c0624d26d8","ui_kits/ielts_lab/ListeningSets.jsx":"e272084e2a18","ui_kits/ielts_lab/OverviewScreen.jsx":"48765db78ce0","ui_kits/ielts_lab/PracticeScreen.jsx":"50a0e4dfb651","ui_kits/ielts_lab/QuestionTypes.jsx":"3bc51da4c07b","ui_kits/ielts_lab/QueueScreen.jsx":"5c06690ca090","ui_kits/ielts_lab/ResultScreen.jsx":"b09487fb76d7","ui_kits/ielts_lab/SpeakingScreen.jsx":"09164a64ca65","ui_kits/ielts_lab/WritingScreen.jsx":"72c6ad03f8b4","ui_kits/ielts_lab/WritingTasks.jsx":"4407fc682d20","ui_kits/ielts_lab/lab-data.js":"ad89adc5a7cf","ui_kits/ielts_lab/listening-data.js":"1a54126a8b70","ui_kits/ielts_lab/practice-data.js":"8222fa2064e6","ui_kits/ielts_lab/speaking-data.js":"90b1b6fb697a","ui_kits/ielts_lab/writing-data.js":"608d42596274","ui_kits/marketing/ConversionSection.jsx":"74ceb11e8be9","ui_kits/marketing/Hero.jsx":"f242f5758086","ui_kits/marketing/LabSection.jsx":"40bf468ccea8","ui_kits/marketing/PersonasSection.jsx":"bb9d16bfa157","ui_kits/marketing/SchoolCards.jsx":"959910555ad4","ui_kits/marketing/SchoolsData.js":"00c44d969e13","ui_kits/marketing/SchoolsFilters.jsx":"f4637dfac275","ui_kits/marketing/Shots.jsx":"ac7468727ccd","ui_kits/marketing/SiteFooter.jsx":"9dbc41f2fa0a","ui_kits/marketing/SiteHeader.jsx":"2f75c2f5b782","ui_kits/marketing/StatBar.jsx":"5665e4b3fa48","ui_kits/marketing/VerifySection.jsx":"3e0a5b3fb12a","ui_kits/schools/AppChrome.jsx":"be682c9a62fb","ui_kits/schools/CompareScreen.jsx":"33b87c311d04","ui_kits/schools/DetailScreen.jsx":"9f5a226d328d","ui_kits/schools/SavedScreen.jsx":"db47c1c8c275","ui_kits/schools/SearchScreen.jsx":"09b50663e552","ui_kits/schools/data.js":"1cbbecdcb6fd"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.STAGEDesignSystem_0f9c53 = window.STAGEDesignSystem_0f9c53 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** White surface + 1px hairline + 16px radius. Shadow only when floating. */
function Card({
  interactive,
  padding = 24,
  elevation = "none",
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const lift = {
    none: "var(--shadow-none)",
    xs: "var(--shadow-xs)",
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)"
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: "var(--surface-card)",
      borderRadius: "var(--radius-lg)",
      border: `1px solid ${interactive && hover ? "var(--border-default)" : "var(--border-hairline)"}`,
      boxShadow: interactive && hover ? "var(--shadow-sm)" : lift[elevation],
      padding,
      cursor: interactive ? "pointer" : undefined,
      transition: "border-color var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** The small label that opens every section. Chinese uses ［ ］, English UPPERCASE. */
function Eyebrow({
  tone = "subtle",
  bracket = true,
  children,
  style,
  ...rest
}) {
  const colors = {
    subtle: "var(--text-subtle)",
    accent: "var(--gold-700)",
    brand: "var(--blue-700)",
    inverse: "rgba(255,255,255,.55)"
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "block",
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-medium)",
      letterSpacing: "var(--ls-eyebrow)",
      color: colors[tone],
      fontFamily: "var(--font-text)",
      lineHeight: 1.4,
      ...style
    }
  }, rest), bracket ? "［ " : null, children, bracket ? " ］" : null);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const pascal = n => n.split(/[-_ ]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("");
function resolve(name) {
  const L = typeof window !== "undefined" ? window.lucide : null;
  if (!L) return null;
  const key = pascal(name);
  const node = L[key] || L.icons && (L.icons[key] || L.icons[name]);
  if (!node) return null;
  return Array.isArray(node) && node[0] === "svg" ? node[2] : node;
}

/** Lucide wrapper. Stroke-only, 1.75px, currentColor. */
function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  style,
  ...rest
}) {
  const [, force] = React.useReducer(n => n + 1, 0);
  const children = resolve(name);
  React.useEffect(() => {
    if (children) return;
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      if (resolve(name) || n > 40) {
        clearInterval(t);
        force();
      }
    }, 80);
    return () => clearInterval(t);
  }, [name, children]);
  const base = {
    width: size,
    height: size,
    display: "block",
    flex: "none",
    ...style
  };
  if (!children) return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: base
  });
  return /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    style: base
  }, rest), children.map(([tag, attrs], i) => React.createElement(tag, {
    key: i,
    ...attrs
  })));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const badgeTones = {
  neutral: {
    background: "var(--surface-sunken)",
    color: "var(--text-muted)",
    border: "var(--border-hairline)"
  },
  brand: {
    background: "var(--surface-accent-soft)",
    color: "var(--blue-800)",
    border: "var(--border-accent)"
  },
  verified: {
    background: "var(--verified-bg)",
    color: "var(--verified-fg)",
    border: "var(--verified-border)"
  },
  accent: {
    background: "var(--gold-50)",
    color: "var(--gold-700)",
    border: "var(--gold-200)"
  },
  warning: {
    background: "var(--amber-50)",
    color: "var(--amber-600)",
    border: "var(--amber-50)"
  },
  danger: {
    background: "var(--red-50)",
    color: "var(--red-600)",
    border: "var(--red-50)"
  },
  inverse: {
    background: "rgba(255,255,255,.10)",
    color: "rgba(255,255,255,.86)",
    border: "var(--border-inverse)"
  }
};

/** Small pill stating a fact. Never a score, grade or prediction. */
function Badge({
  tone = "neutral",
  icon,
  mono,
  children,
  style,
  ...rest
}) {
  const t = badgeTones[tone] || badgeTones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "4px 10px",
      borderRadius: "var(--radius-pill)",
      background: t.background,
      color: t.color,
      border: `1px solid ${t.border}`,
      fontSize: "var(--fs-xs)",
      lineHeight: 1.4,
      fontWeight: "var(--fw-medium)",
      fontFamily: mono ? "var(--font-mono)" : "var(--font-text)",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 13,
    strokeWidth: 2.25
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const btnSizes = {
  sm: {
    fontSize: "var(--fs-xs)",
    padding: "0 12px",
    height: 32,
    gap: 6,
    icon: 14
  },
  md: {
    fontSize: "var(--fs-sm)",
    padding: "0 18px",
    height: 44,
    gap: 8,
    icon: 16
  },
  lg: {
    fontSize: "var(--fs-body)",
    padding: "0 26px",
    height: 52,
    gap: 10,
    icon: 18
  }
};
const btnVariants = {
  primary: {
    background: "var(--action-primary)",
    color: "var(--text-inverse)",
    border: "1px solid var(--action-primary)"
  },
  secondary: {
    background: "var(--surface-card)",
    color: "var(--text-strong)",
    border: "1px solid var(--border-default)"
  },
  ghost: {
    background: "transparent",
    color: "var(--text-strong)",
    border: "1px solid transparent"
  },
  inverse: {
    background: "var(--n-0)",
    color: "var(--blue-950)",
    border: "1px solid var(--n-0)"
  }
};
const btnHover = {
  primary: {
    background: "var(--action-primary-hover)",
    borderColor: "var(--action-primary-hover)"
  },
  secondary: {
    background: "var(--action-quiet-hover)",
    borderColor: "var(--border-strong)"
  },
  ghost: {
    background: "var(--action-quiet-hover)"
  },
  inverse: {
    background: "var(--n-100)",
    borderColor: "var(--n-100)"
  }
};

/** Primary action. Hover darkens; press nudges 1px down. Never scales or glows. */
function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  fullWidth,
  disabled,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const s = btnSizes[size] || btnSizes.md;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      fontSize: s.fontSize,
      fontFamily: "var(--font-text)",
      fontWeight: "var(--fw-medium)",
      lineHeight: 1,
      letterSpacing: 0,
      whiteSpace: "nowrap",
      borderRadius: "var(--radius-sm)",
      cursor: disabled ? "not-allowed" : "pointer",
      width: fullWidth ? "100%" : undefined,
      opacity: disabled ? 0.45 : 1,
      transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)",
      transform: press && !disabled ? "translateY(1px)" : "none",
      ...btnVariants[variant],
      ...(hover && !disabled ? btnHover[variant] : null),
      ...(press && !disabled && variant === "primary" ? {
        background: "var(--action-primary-press)",
        borderColor: "var(--action-primary-press)"
      } : null),
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }) : null, children, iconRight ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const iconBtnSizes = {
  sm: 32,
  md: 40,
  lg: 44
};

/** Square quiet button holding a single Lucide glyph. Always give it a label. */
function IconButton({
  icon,
  label,
  size = "md",
  variant = "ghost",
  active,
  disabled,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const d = iconBtnSizes[size] || 40;
  const bordered = variant === "outline";
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: d,
      height: d,
      display: "inline-grid",
      placeItems: "center",
      flex: "none",
      borderRadius: "var(--radius-sm)",
      cursor: disabled ? "not-allowed" : "pointer",
      border: bordered ? "1px solid var(--border-default)" : "1px solid transparent",
      background: active ? "var(--surface-accent-soft)" : hover && !disabled ? "var(--action-quiet-hover)" : "transparent",
      color: active ? "var(--blue-700)" : "var(--text-muted)",
      opacity: disabled ? 0.45 : 1,
      transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === "sm" ? 16 : 20
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionHeader.jsx
try { (() => {
/** Enforces the four-part section skeleton: eyebrow → title → subtitle → content. */
function SectionHeader({
  eyebrow,
  eyebrowTone = "subtle",
  title,
  subtitle,
  align = "center",
  inverse,
  size = "lg",
  style,
  children
}) {
  const sizes = {
    lg: {
      fontSize: "var(--fs-d2)",
      letterSpacing: "var(--ls-display)",
      lineHeight: "var(--lh-display)"
    },
    md: {
      fontSize: "var(--fs-h1)",
      letterSpacing: "var(--ls-heading)",
      lineHeight: 1.16
    },
    sm: {
      fontSize: "var(--fs-h2)",
      letterSpacing: "var(--ls-heading)",
      lineHeight: 1.2
    }
  };
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "grid",
      gap: 14,
      textAlign: align,
      justifyItems: align === "center" ? "center" : "start",
      ...style
    }
  }, eyebrow ? /*#__PURE__*/React.createElement(__ds_scope.Eyebrow, {
    tone: inverse ? "inverse" : eyebrowTone
  }, eyebrow) : null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--fw-bold)",
      color: inverse ? "var(--text-inverse)" : "var(--text-strong)",
      ...sizes[size]
    }
  }, title), subtitle ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: "var(--measure-lead)",
      fontSize: "var(--fs-lead)",
      lineHeight: 1.6,
      color: inverse ? "rgba(255,255,255,.68)" : "var(--text-muted)"
    }
  }, subtitle) : null, children);
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Selectable filter chip. Selected = blue fill, white text. */
function Tag({
  selected,
  onRemove,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const clickable = !!rest.onClick;
  return /*#__PURE__*/React.createElement("span", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    role: clickable ? "button" : undefined,
    tabIndex: clickable ? 0 : undefined,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 34,
      padding: "0 14px",
      borderRadius: "var(--radius-pill)",
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-medium)",
      whiteSpace: "nowrap",
      cursor: clickable ? "pointer" : "default",
      userSelect: "none",
      background: selected ? "var(--action-primary)" : hover && clickable ? "var(--action-quiet-hover)" : "var(--surface-card)",
      color: selected ? "var(--text-inverse)" : "var(--text-body)",
      border: `1px solid ${selected ? "var(--action-primary)" : hover && clickable ? "var(--border-default)" : "var(--border-hairline)"}`,
      transition: "all var(--dur-fast) var(--ease-standard)",
      ...style
    }
  }, rest), children, onRemove ? /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    style: {
      display: "grid",
      opacity: 0.7,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 13,
    strokeWidth: 2
  })) : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/data/SourceLink.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Official-source citation. Bracketed, external-link glyph, mono domain. */
function SourceLink({
  href = "#",
  label = "官方来源",
  domain,
  size = "md",
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const sm = size === "sm";
  return /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    target: "_blank",
    rel: "noreferrer noopener",
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: sm ? "var(--fs-xs)" : "var(--fs-sm)",
      fontWeight: "var(--fw-medium)",
      color: hover ? "var(--text-link-hover)" : "var(--text-link)",
      transition: "color var(--dur-fast) var(--ease-standard)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.5
    }
  }, "["), label, domain ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: sm ? 11 : 12,
      color: "var(--text-subtle)"
    }
  }, domain) : null, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "external-link",
    size: sm ? 12 : 14
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.5
    }
  }, "]"));
}
Object.assign(__ds_scope, { SourceLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/SourceLink.jsx", error: String((e && e.message) || e) }); }

// components/data/StatFigure.jsx
try { (() => {
/** Large real number + label. Never a score, band or prediction. */
function StatFigure({
  value,
  label,
  note,
  align = "left",
  inverse,
  size = "lg",
  style
}) {
  const fs = {
    lg: "var(--fs-d1)",
    md: "var(--fs-h1)",
    sm: "var(--fs-h2)"
  }[size];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 6,
      textAlign: align,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--fw-bold)",
      fontSize: fs,
      letterSpacing: "var(--ls-display)",
      lineHeight: 1,
      color: inverse ? "var(--text-inverse)" : "var(--text-strong)",
      fontVariantNumeric: "tabular-nums"
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-sm)",
      color: inverse ? "rgba(255,255,255,.66)" : "var(--text-muted)"
    }
  }, label), note ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xs)",
      color: inverse ? "rgba(255,255,255,.42)" : "var(--text-subtle)"
    }
  }, note) : null);
}
Object.assign(__ds_scope, { StatFigure });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatFigure.jsx", error: String((e && e.message) || e) }); }

// components/data/VerifiedBadge.jsx
try { (() => {
/**
 * The trust primitive. Green check + verification date.
 * Reserved for "this value was checked against the official source on this date".
 */
function VerifiedBadge({
  date,
  label = "已核实",
  size = "md",
  stale,
  style
}) {
  const sm = size === "sm";
  const tone = stale ? {
    bg: "var(--amber-50)",
    fg: "var(--amber-600)",
    bd: "var(--amber-50)"
  } : {
    bg: "var(--verified-bg)",
    fg: "var(--verified-fg)",
    bd: "var(--verified-border)"
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: sm ? "3px 8px" : "5px 11px",
      borderRadius: "var(--radius-pill)",
      background: tone.bg,
      color: tone.fg,
      border: `1px solid ${tone.bd}`,
      fontSize: sm ? "var(--fs-2xs)" : "var(--fs-xs)",
      fontWeight: "var(--fw-medium)",
      lineHeight: 1.4,
      whiteSpace: "nowrap",
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: stale ? "clock" : "check",
    size: sm ? 11 : 13,
    strokeWidth: stale ? 2 : 3
  }), stale ? "待复核" : label, date ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: sm ? 10 : 12
    }
  }, date) : null);
}
Object.assign(__ds_scope, { VerifiedBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/VerifiedBadge.jsx", error: String((e && e.message) || e) }); }

// components/data/DataRow.jsx
try { (() => {
/**
 * The atom of the Schools & Programs database:
 * field / value / source / verification date. Missing values render 官方未公布.
 */
function DataRow({
  field,
  value,
  note,
  sourceHref,
  sourceDomain,
  verifiedOn,
  stale,
  last,
  style
}) {
  const missing = value === null || value === undefined || value === "";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(120px,168px) 1fr",
      gap: "4px 24px",
      padding: "18px 0",
      borderBottom: last ? "none" : "1px solid var(--border-hairline)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-subtle)",
      lineHeight: 1.6
    }
  }, field), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body)",
      lineHeight: 1.65,
      color: missing ? "var(--text-subtle)" : "var(--text-body)",
      fontStyle: missing ? "normal" : "normal"
    }
  }, missing ? "官方未公布" : value), note ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)",
      lineHeight: 1.7
    }
  }, note) : null, (sourceHref || verifiedOn) && !missing ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      paddingTop: 2
    }
  }, verifiedOn ? /*#__PURE__*/React.createElement(__ds_scope.VerifiedBadge, {
    date: verifiedOn,
    size: "sm",
    stale: stale
  }) : null, sourceHref ? /*#__PURE__*/React.createElement(__ds_scope.SourceLink, {
    href: sourceHref,
    domain: sourceDomain,
    size: "sm"
  }) : null) : null));
}
Object.assign(__ds_scope, { DataRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataRow.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
/** Centred modal. Scrim is midnight at 38%, no blur. */
function Dialog({
  open,
  title,
  description,
  onClose,
  footer,
  width = 520,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 60,
      background: "rgba(4,18,46,.38)",
      display: "grid",
      placeItems: "center",
      padding: "var(--sp-6)",
      animation: "stageFade var(--dur-base) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: width,
      background: "var(--surface-card)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-xl)",
      border: "1px solid var(--border-hairline)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      padding: "24px 24px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 6,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: "var(--fs-h3)",
      fontWeight: "var(--fw-bold)",
      letterSpacing: "var(--ls-heading)",
      color: "var(--text-strong)"
    }
  }, title), description ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--fs-sm)",
      lineHeight: 1.7,
      color: "var(--text-muted)"
    }
  }, description) : null), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "\u5173\u95ED",
    onClick: onClose
  })), children ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 24px 0"
    }
  }, children) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      padding: 24
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
/** Honest empty state: what's missing, and the one action that fills it. */
function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12,
      justifyItems: "center",
      textAlign: "center",
      padding: "56px 24px",
      border: "1px dashed var(--border-default)",
      borderRadius: "var(--radius-lg)",
      background: "var(--surface-page)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--n-400)",
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-h4)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-strong)",
      letterSpacing: "var(--ls-heading)"
    }
  }, title), description ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: "34ch",
      fontSize: "var(--fs-sm)",
      lineHeight: 1.7,
      color: "var(--text-muted)"
    }
  }, description) : null, action ? /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 6
    }
  }, action) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const toastTones = {
  neutral: {
    icon: "info",
    color: "var(--text-muted)"
  },
  success: {
    icon: "check",
    color: "var(--green-600)"
  },
  warning: {
    icon: "triangle-alert",
    color: "var(--amber-600)"
  },
  danger: {
    icon: "circle-alert",
    color: "var(--red-600)"
  }
};

/** Bottom-centre transient confirmation. States what happened, nothing more. */
function Toast({
  tone = "neutral",
  message,
  action,
  onAction,
  style
}) {
  const t = toastTones[tone] || toastTones.neutral;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-lg)",
      fontSize: "var(--fs-sm)",
      color: "var(--text-body)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.color,
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 17,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, message), action ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      border: "none",
      background: "transparent",
      cursor: "pointer",
      padding: 0,
      color: "var(--text-link)",
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-medium)",
      fontFamily: "var(--font-text)"
    }
  }, action) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
/** Hover/focus explanation. Midnight capsule, 12px text, no arrow. */
function Tooltip({
  label,
  placement = "top",
  children,
  style
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: "calc(100% + 8px)",
      left: "50%",
      transform: "translateX(-50%)"
    },
    bottom: {
      top: "calc(100% + 8px)",
      left: "50%",
      transform: "translateX(-50%)"
    },
    right: {
      left: "calc(100% + 8px)",
      top: "50%",
      transform: "translateY(-50%)"
    }
  }[placement];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    onFocus: () => setShow(true),
    onBlur: () => setShow(false)
  }, children, show ? /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: "absolute",
      zIndex: 40,
      ...pos,
      padding: "7px 10px",
      background: "var(--surface-inverse)",
      color: "var(--text-inverse)",
      borderRadius: "var(--radius-xs)",
      fontSize: "var(--fs-xs)",
      lineHeight: 1.5,
      whiteSpace: "nowrap",
      boxShadow: "var(--shadow-md)",
      pointerEvents: "none"
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/** Checkbox. 20px box, 8px→4px radius, blue fill when checked. */
function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: description ? "flex-start" : "center",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      flex: "none",
      borderRadius: "var(--radius-xs)",
      display: "grid",
      placeItems: "center",
      marginTop: description ? 2 : 0,
      background: checked ? "var(--action-primary)" : "var(--surface-card)",
      border: `1px solid ${checked ? "var(--action-primary)" : "var(--border-default)"}`,
      color: "var(--text-inverse)",
      transition: "all var(--dur-fast) var(--ease-standard)"
    }
  }, checked ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13,
    strokeWidth: 3
  }) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-body)",
      lineHeight: 1.5
    }
  }, label), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)",
      lineHeight: 1.6
    }
  }, description) : null));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Text input. Focus = blue border + 3px soft ring. No coloured fill. */
function Input({
  label,
  hint,
  error,
  icon,
  suffix,
  size = "md",
  style,
  wrapperStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === "lg" ? 52 : size === "sm" ? 36 : 44;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "grid",
      gap: 7,
      ...wrapperStyle
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-body)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: h,
      padding: "0 14px",
      background: "var(--surface-card)",
      borderRadius: "var(--radius-sm)",
      border: `1px solid ${error ? "var(--red-600)" : focus ? "var(--blue-500)" : "var(--border-default)"}`,
      boxShadow: focus && !error ? "var(--ring-focus)" : "none",
      transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)"
    }
  }, icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-subtle)",
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  })) : null, /*#__PURE__*/React.createElement("input", _extends({
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-text)",
      fontSize: "var(--fs-sm)",
      color: "var(--text-strong)",
      lineHeight: 1.5,
      ...style
    }
  }, rest)), suffix ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, suffix) : null), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--red-600)"
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
/** Radio group. Vertical by default. */
function Radio({
  name,
  options = [],
  value,
  onChange,
  direction = "column",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: "flex",
      flexDirection: direction,
      gap: direction === "row" ? 20 : 12,
      ...style
    }
  }, options.map(o => {
    const v = typeof o === "string" ? o : o.value;
    const l = typeof o === "string" ? o : o.label;
    const on = value === v;
    return /*#__PURE__*/React.createElement("label", {
      key: v,
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: name,
      checked: on,
      onChange: () => onChange && onChange(v),
      style: {
        position: "absolute",
        opacity: 0,
        width: 0,
        height: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 20,
        height: 20,
        flex: "none",
        borderRadius: "var(--radius-pill)",
        display: "grid",
        placeItems: "center",
        background: "var(--surface-card)",
        border: `1px solid ${on ? "var(--action-primary)" : "var(--border-default)"}`,
        transition: "border-color var(--dur-fast) var(--ease-standard)"
      }
    }, on ? /*#__PURE__*/React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: "var(--radius-pill)",
        background: "var(--action-primary)"
      }
    }) : null), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--fs-sm)",
        color: "var(--text-body)"
      }
    }, l));
  }));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Native select with STAGE chrome. */
function Select({
  label,
  hint,
  options = [],
  size = "md",
  style,
  wrapperStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === "lg" ? 52 : size === "sm" ? 36 : 44;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "grid",
      gap: 7,
      ...wrapperStyle
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-body)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      height: h,
      background: "var(--surface-card)",
      borderRadius: "var(--radius-sm)",
      border: `1px solid ${focus ? "var(--blue-500)" : "var(--border-default)"}`,
      boxShadow: focus ? "var(--ring-focus)" : "none",
      transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: "none",
      WebkitAppearance: "none",
      flex: 1,
      height: "100%",
      padding: "0 38px 0 14px",
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-text)",
      fontSize: "var(--fs-sm)",
      color: "var(--text-strong)",
      cursor: "pointer",
      ...style
    }
  }, rest), options.map(o => {
    const v = typeof o === "string" ? o : o.value;
    const l = typeof o === "string" ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 12,
      color: "var(--text-subtle)",
      pointerEvents: "none",
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16
  }))), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** Toggle for an immediate view preference. Not for form submission. */
function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: description ? "flex-start" : "center",
      justifyContent: "space-between",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      gap: 2
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-body)",
      fontWeight: "var(--fw-medium)"
    }
  }, label) : null, description ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)",
      lineHeight: 1.6
    }
  }, description) : null), /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 44,
      height: 26,
      flex: "none",
      borderRadius: "var(--radius-pill)",
      padding: 3,
      background: checked ? "var(--action-primary)" : "var(--n-300)",
      transition: "background var(--dur-base) var(--ease-standard)",
      marginTop: description ? 2 : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      width: 20,
      height: 20,
      borderRadius: "var(--radius-pill)",
      background: "var(--n-0)",
      boxShadow: "var(--shadow-xs)",
      transform: checked ? "translateX(18px)" : "translateX(0)",
      transition: "transform var(--dur-base) var(--ease-standard)"
    }
  })));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/** Tabs. underline = page sections; pill = filter switches. */
function Tabs({
  items = [],
  value,
  onChange,
  variant = "underline",
  inverse,
  style
}) {
  const active = value ?? (typeof items[0] === "string" ? items[0] : items[0] && items[0].value);
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: "flex",
      gap: variant === "pill" ? 6 : 28,
      alignItems: "center",
      borderBottom: variant === "underline" ? `1px solid ${inverse ? "var(--border-inverse)" : "var(--border-hairline)"}` : "none",
      background: variant === "pill" ? "var(--surface-sunken)" : "transparent",
      padding: variant === "pill" ? 4 : 0,
      borderRadius: variant === "pill" ? "var(--radius-sm)" : 0,
      overflowX: "auto",
      ...style
    }
  }, items.map(it => {
    const v = typeof it === "string" ? it : it.value;
    const l = typeof it === "string" ? it : it.label;
    const count = typeof it === "string" ? null : it.count;
    const on = v === active;
    if (variant === "pill") {
      return /*#__PURE__*/React.createElement("button", {
        key: v,
        role: "tab",
        type: "button",
        onClick: () => onChange && onChange(v),
        style: {
          border: "none",
          cursor: "pointer",
          padding: "8px 16px",
          borderRadius: "var(--radius-xs)",
          background: on ? "var(--surface-card)" : "transparent",
          boxShadow: on ? "var(--shadow-xs)" : "none",
          color: on ? "var(--text-strong)" : "var(--text-muted)",
          fontSize: "var(--fs-sm)",
          fontWeight: "var(--fw-medium)",
          whiteSpace: "nowrap",
          transition: "all var(--dur-fast) var(--ease-standard)"
        }
      }, l);
    }
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      type: "button",
      onClick: () => onChange && onChange(v),
      style: {
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: "0 0 14px",
        marginBottom: -1,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        borderBottom: `2px solid ${on ? inverse ? "var(--n-0)" : "var(--action-primary)" : "transparent"}`,
        color: on ? inverse ? "var(--text-inverse)" : "var(--text-strong)" : inverse ? "rgba(255,255,255,.6)" : "var(--text-muted)",
        fontSize: "var(--fs-body)",
        fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
        letterSpacing: "var(--ls-heading)",
        whiteSpace: "nowrap",
        transition: "color var(--dur-fast) var(--ease-standard)"
      }
    }, l, count != null ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-xs)",
        color: "var(--text-subtle)"
      }
    }, count) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/BankScreen.jsx
try { (() => {
const {
  Input,
  Tag,
  Icon,
  Card,
  Badge,
  Button,
  IconButton
} = window.STAGEDesignSystem_0f9c53;
const bankStyles = {
  page: {
    padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px",
    display: "grid",
    gap: 18,
    maxWidth: 1160,
    alignContent: "start"
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h2)",
    letterSpacing: "var(--ls-heading)",
    lineHeight: 1.15,
    color: "var(--blue-950)"
  },
  facets: {
    display: "grid",
    gap: 12
  },
  facetRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap"
  },
  facetLabel: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    width: 44,
    flex: "none"
  },
  list: {
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden"
  },
  row: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1.7fr) auto auto 150px 110px auto auto auto",
    gap: 14,
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid var(--border-hairline)",
    cursor: "pointer",
    background: "var(--surface-page)",
    transition: "background var(--dur-fast) var(--ease-standard)"
  },
  title: {
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-medium)",
    color: "var(--text-strong)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  zh: {
    fontSize: "var(--fs-2xs)",
    color: "var(--text-subtle)",
    marginTop: 2
  },
  mono: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)"
  },
  dot: c => ({
    width: 8,
    height: 8,
    borderRadius: "var(--radius-pill)",
    background: c,
    display: "inline-block",
    flex: "none"
  }),
  groups: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
    gap: 12
  },
  secH: {
    fontSize: "var(--fs-h4)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    color: "var(--text-strong)"
  }
};

/* 状态点三色：已练习=核实绿 · 待重测=品牌蓝 · 未练习=中性（不用警示色） */
const statusDot = {
  "已练习": "var(--green-500)",
  "待重测": "var(--blue-500)",
  "未练习": "var(--n-300)"
};
const freqs = ["高频", "次高频", "非高频"];
function Facet({
  label,
  options,
  value,
  onChange,
  counts
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: bankStyles.facetRow
  }, /*#__PURE__*/React.createElement("span", {
    style: bankStyles.facetLabel
  }, label), /*#__PURE__*/React.createElement(Tag, {
    selected: value === null,
    onClick: () => onChange(null)
  }, "\u5168\u90E8"), options.map(o => /*#__PURE__*/React.createElement(Tag, {
    key: o,
    selected: value === o,
    onClick: () => onChange(value === o ? null : o)
  }, o, counts ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      opacity: 0.75,
      marginLeft: 2
    }
  }, counts[o] || 0) : null)));
}
function BankRow({
  it,
  onOpen,
  onPractice
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...bankStyles.row,
      background: hover ? "var(--surface-sunken)" : "var(--surface-page)"
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onClick: () => onOpen && onOpen(it)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...bankStyles.title,
      display: "block"
    }
  }, it.title), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bankStyles.zh,
      display: "block"
    }
  }, it.zh)), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, it.part), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, it.type), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bankStyles.mono,
      color: it.mine ? "var(--text-body)" : "var(--text-subtle)"
    }
  }, "\u6211\u7684 ", it.mine || "—"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bankStyles.mono,
      color: "var(--text-subtle)"
    }
  }, "\u5E73\u5747 ", it.avg), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: "var(--fs-2xs)",
      color: "var(--text-subtle)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: bankStyles.dot(statusDot[it.status])
  }), it.status), /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onPractice && onPractice(it);
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary"
  }, "\u5F00\u59CB\u7EC3\u4E60")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--n-400)",
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16
  })));
}
function BankScreen({
  skill,
  onOpenReview,
  onPractice,
  onSets,
  onTypes
}) {
  const bank = window.LAB_BANK[skill];
  const [q, setQ] = React.useState("");
  const [freq, setFreq] = React.useState(null);
  const [part, setPart] = React.useState(null);
  const [type, setType] = React.useState(null);
  const [status, setStatus] = React.useState(null);
  const freqCounts = {};
  bank.items.forEach(it => {
    freqCounts[it.freq] = (freqCounts[it.freq] || 0) + 1;
  });
  const isWriting = skill === "Writing";
  const filter = it => (!freq || it.freq === freq) && (!part || it.part === part) && (!type || it.type === type) && (!status || it.status === status) && (!q || (it.title + it.zh).toLowerCase().includes(q.toLowerCase()));
  const rows = bank.items.filter(filter);
  const task2 = isWriting ? rows.filter(it => it.part === "Task 2") : rows;
  return /*#__PURE__*/React.createElement("div", {
    style: bankStyles.page
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      ...bankStyles.h1,
      flex: 1
    }
  }, skill, " \u9898\u5E93"), skill === "Listening" ? /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "layers",
    onClick: onSets
  }, "\u5957\u9898\u5339\u914D") : null), /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "\u641C\u7D22\u9898\u76EE",
    value: q,
    onChange: e => setQ(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: bankStyles.facets
  }, /*#__PURE__*/React.createElement(Facet, {
    label: "\u9891\u6B21",
    options: freqs,
    value: freq,
    onChange: setFreq,
    counts: freqCounts
  }), !isWriting ? /*#__PURE__*/React.createElement(Facet, {
    label: "Part",
    options: bank.parts,
    value: part,
    onChange: setPart
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Facet, {
    label: "\u9898\u578B",
    options: bank.types,
    value: type,
    onChange: setType
  }), /*#__PURE__*/React.createElement("span", {
    title: "\u9898\u578B\u8BF4\u660E",
    onClick: onTypes,
    style: {
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "circle-help",
    label: "\u9898\u578B\u8BF4\u660E",
    size: "sm",
    onClick: onTypes
  }))), /*#__PURE__*/React.createElement(Facet, {
    label: "\u72B6\u6001",
    options: ["未练习", "已练习", "待重测"],
    value: status,
    onChange: setStatus
  })), isWriting ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: bankStyles.secH
  }, "\u5C0F\u4F5C\u6587 Task 1 \xB7 \u6309\u56FE\u578B\u6D4F\u89C8"), /*#__PURE__*/React.createElement("div", {
    style: bankStyles.groups
  }, bank.task1Groups.map(g => /*#__PURE__*/React.createElement(Card, {
    key: g.name,
    interactive: true,
    padding: 18,
    style: {
      display: "grid",
      gap: 10,
      justifyItems: "start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: "var(--radius-sm)",
      background: "var(--surface-accent-soft)",
      border: "1px solid var(--border-accent)",
      display: "grid",
      placeItems: "center",
      color: "var(--blue-700)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: g.icon,
    size: 21
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-strong)"
    }
  }, g.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)",
      whiteSpace: "nowrap"
    }
  }, g.count, " \u9898")))), /*#__PURE__*/React.createElement("span", {
    style: bankStyles.secH
  }, "\u5927\u4F5C\u6587 Task 2")) : null, /*#__PURE__*/React.createElement("div", {
    style: bankStyles.list
  }, task2.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "28px 18px",
      fontSize: "var(--fs-sm)",
      color: "var(--text-subtle)",
      textAlign: "center"
    }
  }, "\u6CA1\u6709\u5339\u914D\u7684\u9898\u76EE\u2014\u2014\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\u518D\u8BD5\u3002") : task2.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: it.id,
    style: {
      borderBottom: i === task2.length - 1 ? "none" : undefined
    }
  }, /*#__PURE__*/React.createElement(BankRow, {
    it: it,
    onOpen: onOpenReview,
    onPractice: onPractice
  })))));
}
Object.assign(window, {
  BankScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/BankScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/EvidenceReview.jsx
try { (() => {
const {
  Button,
  Icon,
  Badge,
  Tag
} = window.STAGEDesignSystem_0f9c53;
const evStyles = {
  page: {
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    height: "100vh",
    minWidth: 0
  },
  head: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px clamp(20px,3vw,32px)",
    borderBottom: "1px solid var(--border-hairline)",
    flexWrap: "wrap"
  },
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-medium)",
    color: "var(--text-muted)",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    fontFamily: "var(--font-text)",
    padding: 0
  },
  title: {
    fontSize: "var(--fs-body)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--text-strong)"
  },
  cols: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)",
    minHeight: 0
  },
  left: {
    overflowY: "auto",
    padding: "22px clamp(20px,3vw,32px)",
    borderRight: "1px solid var(--border-hairline)"
  },
  right: {
    overflowY: "auto",
    padding: "22px clamp(20px,3vw,32px)",
    display: "grid",
    gap: 14,
    alignContent: "start"
  },
  line: hl => ({
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: 12,
    padding: "8px 10px",
    borderRadius: "var(--radius-sm)",
    background: hl ? "var(--gold-50)" : "transparent",
    transition: "background var(--dur-base) var(--ease-standard)",
    alignItems: "baseline"
  }),
  t: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-subtle)",
    minWidth: 40
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    marginLeft: 8,
    padding: "1px 8px",
    borderRadius: "var(--radius-pill)",
    background: "var(--gold-200)",
    color: "var(--blue-950)",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    verticalAlign: "middle"
  },
  text: hl => ({
    fontSize: "var(--fs-sm)",
    lineHeight: 1.8,
    color: "var(--text-body)",
    background: hl ? "var(--gold-200)" : "transparent",
    borderRadius: 3
  }),
  qCard: wrong => ({
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-md)",
    padding: 16,
    display: "grid",
    gap: 10
  }),
  qHead: {
    display: "flex",
    gap: 10,
    alignItems: "center"
  },
  ans: {
    display: "grid",
    gap: 4,
    fontSize: "var(--fs-sm)"
  },
  cue: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: "var(--fs-xs)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--blue-700)",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    fontFamily: "var(--font-text)",
    padding: 0,
    justifySelf: "start"
  },
  causes: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    paddingTop: 4,
    borderTop: "1px dashed var(--border-hairline)"
  },
  foot: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "14px clamp(20px,3vw,32px)",
    borderTop: "1px solid var(--border-hairline)",
    background: "var(--surface-page)"
  }
};
function EvidenceReview({
  mode,
  onBack,
  onQueued
}) {
  const data = window.LAB_REVIEW[mode];
  const hasTime = mode === "listening";
  const [hl, setHl] = React.useState(null);
  const [tags, setTags] = React.useState({});
  const leftRef = React.useRef(null);
  const lineRefs = React.useRef({});
  const showCue = idx => {
    setHl(idx);
    const el = lineRefs.current[idx];
    if (el && leftRef.current) leftRef.current.scrollTo({
      top: el.offsetTop - 80,
      behavior: "smooth"
    });
  };
  const toggleTag = (q, c) => setTags(p => {
    const cur = p[q] || [];
    return {
      ...p,
      [q]: cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c]
    };
  });
  return /*#__PURE__*/React.createElement("div", {
    style: evStyles.page
  }, /*#__PURE__*/React.createElement("div", {
    style: evStyles.head
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: evStyles.back,
    onClick: onBack
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 15
  }), "\u8FD4\u56DE\u9898\u5E93"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--n-300)"
    }
  }, "|"), /*#__PURE__*/React.createElement("span", {
    style: evStyles.title
  }, data.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, data.zh, " \xB7 ", data.skill, " ", data.part), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)",
      display: "inline-flex",
      gap: 5,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 12,
    strokeWidth: 2.5
  }), "\u5DF2\u81EA\u52A8\u4FDD\u5B58")), /*#__PURE__*/React.createElement("div", {
    style: evStyles.cols
  }, /*#__PURE__*/React.createElement("div", {
    ref: leftRef,
    style: evStyles.left
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      letterSpacing: "var(--ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--text-subtle)",
      fontWeight: "var(--fw-semibold)",
      display: "block",
      paddingBottom: 12
    }
  }, hasTime ? "原文 Transcript" : "阅读原文"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 2
    }
  }, data.transcript.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    ref: el => {
      lineRefs.current[i] = el;
    },
    style: evStyles.line(hl === i)
  }, hasTime ? /*#__PURE__*/React.createElement("span", {
    style: evStyles.t
  }, l.t) : /*#__PURE__*/React.createElement("span", {
    style: evStyles.t
  }, String(i + 1).padStart(2, "0")), /*#__PURE__*/React.createElement("span", {
    style: evStyles.text(false)
  }, /*#__PURE__*/React.createElement("span", {
    style: evStyles.text(hl === i)
  }, l.text), hl === i && hasTime ? /*#__PURE__*/React.createElement("span", {
    style: evStyles.chip
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 10
  }), l.t) : null))))), /*#__PURE__*/React.createElement("div", {
    style: evStyles.right
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      letterSpacing: "var(--ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--text-subtle)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "\u9898\u76EE\u4E0E\u6211\u7684\u4F5C\u7B54"), data.questions.map(qu => /*#__PURE__*/React.createElement("div", {
    key: qu.q,
    style: evStyles.qCard(qu.wrong)
  }, /*#__PURE__*/React.createElement("div", {
    style: evStyles.qHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-strong)"
    }
  }, qu.q), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-body)",
      flex: 1
    }
  }, qu.stem), /*#__PURE__*/React.createElement(Badge, {
    tone: qu.wrong ? "neutral" : "verified"
  }, qu.wrong ? "答错" : "答对")), /*#__PURE__*/React.createElement("div", {
    style: evStyles.ans
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: qu.wrong ? "var(--red-600)" : "var(--text-body)"
    }
  }, "\u6211\u7684\u4F5C\u7B54\uFF1A", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)"
    }
  }, qu.my)), qu.wrong ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--green-700)"
    }
  }, "\u6B63\u786E\u7B54\u6848\uFF1A", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)"
    }
  }, qu.correct)) : null), qu.wrong ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: evStyles.cue,
    onClick: () => showCue(qu.cue)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "link",
    size: 13
  }), "\u67E5\u770B\u8BC1\u636E", hasTime ? ` · ${data.transcript[qu.cue].t}` : " · 原文定位"), /*#__PURE__*/React.createElement("div", {
    style: evStyles.causes
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      color: "var(--text-subtle)",
      alignSelf: "center"
    }
  }, "\u9519\u56E0\u6807\u6CE8\uFF1A"), window.LAB_CAUSES.map(c => /*#__PURE__*/React.createElement(Tag, {
    key: c,
    selected: (tags[qu.q] || []).includes(c),
    onClick: () => toggleTag(qu.q, c),
    style: {
      height: 28,
      fontSize: "var(--fs-2xs)",
      padding: "0 10px"
    }
  }, c)))) : null)))), /*#__PURE__*/React.createElement("div", {
    style: evStyles.foot
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: onQueued
  }, "\u52A0\u5165\u590D\u76D8\u961F\u5217"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: onBack
  }, "\u5B8C\u6210\u590D\u76D8"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, "\u6807\u6CE8\u7684\u9519\u56E0\u4F1A\u8BA1\u5165\u5F31\u70B9\u6863\u6848")));
}
Object.assign(window, {
  EvidenceReview
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/EvidenceReview.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/HistoryScreen.jsx
try { (() => {
const {
  Icon,
  Tabs,
  Card
} = window.STAGEDesignSystem_0f9c53;
const hiStyles = {
  page: {
    padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px",
    display: "grid",
    gap: 18,
    maxWidth: 1160,
    alignContent: "start"
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h2)",
    letterSpacing: "var(--ls-heading)",
    lineHeight: 1.15,
    color: "var(--blue-950)"
  },
  sum: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(128px,1fr))",
    gap: 1,
    background: "var(--border-hairline)",
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden"
  },
  cell: {
    padding: "20px 22px",
    background: "var(--surface-page)",
    display: "grid",
    gap: 5
  },
  v: {
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "clamp(1.75rem,2.4vw,2.5rem)",
    letterSpacing: "var(--ls-display)",
    lineHeight: 1,
    color: "var(--blue-950)",
    fontVariantNumeric: "tabular-nums"
  },
  chartHead: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap"
  },
  chartTitle: {
    fontSize: "var(--fs-h4)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    color: "var(--text-strong)",
    flex: 1
  },
  day: {
    display: "grid",
    gap: 0
  },
  dayLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    padding: "16px 0 10px"
  },
  event: {
    display: "flex",
    gap: 14,
    padding: "12px 0",
    borderBottom: "1px solid var(--border-hairline)",
    alignItems: "flex-start"
  },
  evIcon: kind => ({
    width: 32,
    height: 32,
    flex: "none",
    borderRadius: "var(--radius-pill)",
    display: "grid",
    placeItems: "center",
    background: kind === "重测" || kind === "独立表达" ? "var(--surface-accent-soft)" : kind === "复盘" ? "var(--gold-50)" : "var(--surface-sunken)",
    color: kind === "重测" || kind === "独立表达" ? "var(--blue-700)" : kind === "复盘" ? "var(--gold-700)" : "var(--text-muted)",
    border: "1px solid var(--border-hairline)"
  }),
  evKind: {
    fontSize: "var(--fs-2xs)",
    letterSpacing: "var(--ls-eyebrow)",
    color: "var(--text-subtle)",
    fontWeight: "var(--fw-semibold)"
  },
  evTitle: {
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-medium)",
    color: "var(--text-strong)",
    marginTop: 2
  },
  evMeta: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-muted)",
    marginTop: 2
  }
};
function AccuracyChart({
  series,
  labels
}) {
  const w = 640,
    h = 200,
    padL = 42,
    padB = 26,
    padT = 12,
    padR = 12;
  const min = 0,
    max = 100;
  const x = i => padL + i * (w - padL - padR) / (labels.length - 1);
  const y = v => padT + (1 - (v - min) / (max - min)) * (h - padT - padB);
  const pts = series.map((v, i) => x(i) + "," + y(v)).join(" ");
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 " + w + " " + h,
    preserveAspectRatio: "xMidYMid meet",
    style: {
      width: "100%",
      maxWidth: w,
      height: "auto",
      display: "block"
    }
  }, [0, 25, 50, 75, 100].map(g => /*#__PURE__*/React.createElement("g", {
    key: g
  }, /*#__PURE__*/React.createElement("line", {
    x1: padL,
    x2: w - padR,
    y1: y(g),
    y2: y(g),
    stroke: "var(--n-100)",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("text", {
    x: padL - 8,
    y: y(g) + 4,
    textAnchor: "end",
    fontSize: "11",
    fill: "var(--n-500)",
    fontFamily: "IBM Plex Mono,monospace"
  }, g, "%"))), labels.map((l, i) => /*#__PURE__*/React.createElement("text", {
    key: l,
    x: x(i),
    y: h - 8,
    textAnchor: i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle",
    fontSize: "11",
    fill: "var(--n-500)",
    fontFamily: "IBM Plex Mono,monospace"
  }, l)), /*#__PURE__*/React.createElement("polyline", {
    points: pts,
    fill: "none",
    stroke: "var(--blue-600)",
    strokeWidth: "2",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }), series.map((v, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: x(i),
    cy: y(v),
    r: "3",
    fill: "var(--blue-600)"
  })));
}
function HistoryScreen() {
  const d = window.LAB_HISTORY;
  const skills = Object.keys(d.series);
  const [skill, setSkill] = React.useState("全部");
  return /*#__PURE__*/React.createElement("div", {
    style: hiStyles.page
  }, /*#__PURE__*/React.createElement("h1", {
    style: hiStyles.h1
  }, "\u5B66\u4E60\u8BB0\u5F55"), /*#__PURE__*/React.createElement("div", {
    style: hiStyles.sum
  }, d.summary.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: m.label,
    style: hiStyles.cell
  }, /*#__PURE__*/React.createElement("span", {
    style: hiStyles.v
  }, m.value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-muted)"
    }
  }, m.label, " \xB7 ", m.note)))), /*#__PURE__*/React.createElement(Card, {
    padding: 22,
    style: {
      display: "grid",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: hiStyles.chartHead
  }, /*#__PURE__*/React.createElement("span", {
    style: hiStyles.chartTitle
  }, "\u6B63\u786E\u7387\u968F\u65F6\u95F4"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    variant: "pill",
    items: skills,
    value: skill,
    onChange: setSkill,
    style: {
      overflowX: "visible"
    }
  }))), /*#__PURE__*/React.createElement(AccuracyChart, {
    series: d.series[skill],
    labels: d.seriesLabels
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      color: "var(--text-subtle)"
    }
  }, "\u7EB5\u8F74\u4E3A\u6B63\u786E\u7387\u767E\u5206\u6BD4 \u2014 \u4E0D\u6362\u7B97\u4E3A\u4EFB\u4F55\u5206\u6570\u523B\u5EA6\u3002")), /*#__PURE__*/React.createElement("div", null, d.days.map(day => /*#__PURE__*/React.createElement("div", {
    key: day.date,
    style: hiStyles.day
  }, /*#__PURE__*/React.createElement("span", {
    style: hiStyles.dayLabel
  }, day.date), day.events.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: hiStyles.event
  }, /*#__PURE__*/React.createElement("span", {
    style: hiStyles.evIcon(e.kind)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: e.icon,
    size: 15
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      ...hiStyles.evKind,
      display: "block"
    }
  }, e.kind), /*#__PURE__*/React.createElement("span", {
    style: {
      ...hiStyles.evTitle,
      display: "block"
    }
  }, e.title), /*#__PURE__*/React.createElement("span", {
    style: {
      ...hiStyles.evMeta,
      display: "block"
    }
  }, e.meta))))))));
}
Object.assign(window, {
  HistoryScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/HistoryScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/LabFooter.jsx
try { (() => {
const lfSt = {
  root: {
    borderTop: "1px solid var(--border-hairline)",
    padding: "22px clamp(20px,3.4vw,44px) 28px",
    display: "grid",
    gap: 14,
    maxWidth: 1160
  },
  disc: {
    fontSize: "var(--fs-2xs)",
    lineHeight: 1.85,
    color: "var(--text-subtle)",
    maxWidth: "88ch",
    margin: 0
  }
};

/* 逐字免责声明。法务口径待核实替换。 */
const IELTS_DISCLAIMER = "IELTS® 是英国文化教育协会（British Council）、IDP IELTS Australia 与剑桥大学英语考评部（Cambridge Assessment English）的注册商标。STAGE 与上述机构不存在任何关联、认可或合作关系。";
function LabFooter() {
  return /*#__PURE__*/React.createElement("footer", {
    style: lfSt.root
  }, /*#__PURE__*/React.createElement("p", {
    style: lfSt.disc
  }, IELTS_DISCLAIMER));
}
Object.assign(window, {
  LabFooter,
  IELTS_DISCLAIMER
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/LabFooter.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/LabShell.jsx
try { (() => {
const {
  Icon
} = window.STAGEDesignSystem_0f9c53;
const shellStyles = {
  root: {
    display: "grid",
    gridTemplateColumns: "236px 1fr",
    minHeight: "100vh",
    background: "var(--surface-page)"
  },
  side: {
    borderRight: "1px solid var(--border-hairline)",
    background: "var(--surface-page)",
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    position: "sticky",
    top: 0,
    height: "100vh",
    padding: "18px 12px 14px"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "4px 10px 18px"
  },
  brandBack: {
    color: "var(--n-400)",
    display: "grid",
    flex: "none",
    marginLeft: -4,
    marginRight: -2
  },
  word: {
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: 13,
    letterSpacing: "0.24em",
    color: "var(--blue-950)"
  },
  labTag: {
    fontSize: "var(--fs-2xs)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: ".1em",
    color: "var(--blue-700)",
    background: "var(--surface-accent-soft)",
    border: "1px solid var(--border-accent)",
    borderRadius: "var(--radius-xs)",
    padding: "2px 6px",
    whiteSpace: "nowrap"
  },
  nav: {
    display: "grid",
    gap: 2,
    alignContent: "start"
  },
  item: on => ({
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    border: "none",
    width: "100%",
    textAlign: "left",
    fontFamily: "var(--font-text)",
    fontSize: "var(--fs-sm)",
    fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
    background: on ? "var(--surface-accent-soft)" : "transparent",
    color: on ? "var(--blue-800)" : "var(--text-muted)",
    transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)"
  }),
  group: {
    fontSize: "var(--fs-2xs)",
    letterSpacing: "var(--ls-eyebrow)",
    textTransform: "uppercase",
    color: "var(--n-400)",
    fontWeight: "var(--fw-semibold)",
    padding: "16px 12px 6px"
  },
  backWrap: {
    borderTop: "1px solid var(--border-hairline)",
    paddingTop: 12,
    marginTop: 12
  },
  back: hover => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid " + (hover ? "var(--border-default)" : "var(--border-hairline)"),
    background: hover ? "var(--action-quiet-hover)" : "var(--surface-page)",
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-semibold)",
    color: hover ? "var(--text-strong)" : "var(--text-body)",
    transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)"
  }),
  main: {
    minWidth: 0,
    display: "grid",
    alignContent: "start"
  }
};
const labNav = [{
  id: "overview",
  label: "学习总览",
  icon: "layout-dashboard"
}, {
  id: "reading",
  label: "Reading",
  icon: "book-open"
}, {
  id: "listening",
  label: "Listening",
  icon: "headphones"
}, {
  id: "writing",
  label: "Writing",
  icon: "pen-line"
}, {
  id: "speaking",
  label: "Speaking",
  icon: "messages-square"
}, {
  id: "queue",
  label: "复盘队列",
  icon: "rotate-ccw"
}, {
  id: "history",
  label: "学习记录",
  icon: "history"
}];
function LabShell({
  route,
  onRoute,
  children
}) {
  const [backHover, setBackHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: shellStyles.root
  }, /*#__PURE__*/React.createElement("aside", {
    style: shellStyles.side
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("a", {
    href: "../marketing/index.html",
    title: "\u8FD4\u56DE STAGE \u5B98\u7F51",
    style: shellStyles.brand
  }, /*#__PURE__*/React.createElement("span", {
    style: shellStyles.brandBack
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 17,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/stage-mark.png",
    alt: "STAGE",
    style: {
      height: 20
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: shellStyles.word
  }, "STAGE"), /*#__PURE__*/React.createElement("span", {
    style: shellStyles.labTag
  }, "IELTS Lab")), /*#__PURE__*/React.createElement("nav", {
    style: shellStyles.nav
  }, labNav.map(n => {
    const on = n.id === route;
    return /*#__PURE__*/React.createElement("button", {
      key: n.id,
      type: "button",
      style: shellStyles.item(on),
      onClick: () => onRoute(n.id)
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "grid",
        color: on ? "var(--blue-700)" : "var(--n-400)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: n.icon,
      size: 17,
      strokeWidth: on ? 2 : 1.75
    })), n.label);
  }))), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("div", {
    style: shellStyles.backWrap
  }, /*#__PURE__*/React.createElement("a", {
    href: "../marketing/index.html",
    style: shellStyles.back(backHover),
    onMouseEnter: () => setBackHover(true),
    onMouseLeave: () => setBackHover(false)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 17,
    strokeWidth: 2
  }), "\u8FD4\u56DE STAGE"))), /*#__PURE__*/React.createElement("main", {
    style: shellStyles.main
  }, children));
}
Object.assign(window, {
  LabShell
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/LabShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/ListeningPractice.jsx
try { (() => {
const {
  Button,
  Icon,
  IconButton,
  Badge,
  Dialog,
  Select
} = window.STAGEDesignSystem_0f9c53;
const lpSt = {
  page: {
    display: "grid",
    gridTemplateRows: "auto auto 1fr auto",
    height: "100vh",
    minWidth: 0
  },
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    padding: "12px clamp(16px,2.4vw,28px)",
    borderBottom: "1px solid var(--border-hairline)",
    flexWrap: "wrap"
  },
  title: {
    fontSize: "var(--fs-body)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--text-strong)",
    lineHeight: 1.35
  },
  meta: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    marginTop: 3
  },
  setNote: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "9px clamp(16px,2.4vw,28px)",
    background: "var(--surface-accent-soft)",
    borderBottom: "1px solid var(--border-accent)",
    fontSize: "var(--fs-xs)",
    color: "var(--blue-800)"
  },
  player: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    padding: "16px clamp(16px,2.4vw,28px)",
    borderBottom: "1px solid var(--border-hairline)",
    flexWrap: "wrap"
  },
  play: {
    width: 52,
    height: 52,
    borderRadius: "var(--radius-pill)",
    border: "none",
    cursor: "pointer",
    background: "var(--action-primary)",
    color: "var(--n-0)",
    display: "grid",
    placeItems: "center",
    flex: "none"
  },
  track: {
    flex: 1,
    minWidth: 200,
    display: "grid",
    gap: 7
  },
  rail: {
    height: 6,
    borderRadius: "var(--radius-pill)",
    background: "var(--n-100)",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden"
  },
  railFill: {
    height: "100%",
    background: "var(--blue-600)",
    borderRadius: "var(--radius-pill)"
  },
  time: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    color: "var(--text-muted)",
    display: "flex",
    justifyContent: "space-between"
  },
  body: {
    overflowY: "auto",
    padding: "22px clamp(18px,3vw,40px) 40px"
  },
  wrap: {
    maxWidth: 760,
    margin: "0 auto",
    display: "grid",
    gap: 18
  },
  formCard: {
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden"
  },
  formHead: {
    padding: "14px 18px",
    borderBottom: "1px solid var(--border-hairline)",
    background: "var(--surface-sunken)",
    display: "grid",
    gap: 4
  },
  formTitle: {
    fontSize: "var(--fs-body)",
    fontWeight: "var(--fw-bold)",
    color: "var(--text-strong)",
    letterSpacing: "var(--ls-heading)",
    textAlign: "center"
  },
  formNote: {
    fontSize: "var(--fs-xs)",
    fontStyle: "italic",
    color: "var(--text-muted)",
    textAlign: "center"
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    gap: 16,
    alignItems: "center",
    padding: "12px 18px",
    borderBottom: "1px solid var(--border-hairline)"
  },
  formLabel: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-muted)"
  },
  inline: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: "var(--fs-sm)",
    color: "var(--text-body)",
    flexWrap: "wrap"
  },
  blank: on => ({
    width: 128,
    border: "none",
    borderBottom: "1.5px solid " + (on ? "var(--action-primary)" : "var(--border-strong)"),
    padding: "3px 4px",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-sm)",
    color: "var(--text-strong)",
    outline: "none",
    background: "transparent"
  }),
  qn: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-2xs)",
    color: "var(--n-0)",
    background: "var(--n-400)",
    borderRadius: "var(--radius-xs)",
    padding: "1px 6px",
    flex: "none"
  },
  qCard: cur => ({
    border: "1px solid " + (cur ? "var(--border-accent)" : "var(--border-hairline)"),
    borderRadius: "var(--radius-md)",
    padding: 16,
    display: "grid",
    gap: 11,
    scrollMarginTop: 12
  }),
  qHead: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start"
  },
  dot: a => ({
    width: 11,
    height: 11,
    borderRadius: "var(--radius-pill)",
    flex: "none",
    marginTop: 5,
    background: a ? "var(--blue-600)" : "transparent",
    border: a ? "none" : "1px solid var(--n-400)"
  }),
  stem: {
    fontSize: "var(--fs-sm)",
    lineHeight: 1.65,
    color: "var(--text-body)",
    flex: 1
  },
  opt: on => ({
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "9px 12px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontSize: "var(--fs-sm)",
    border: "1px solid " + (on ? "var(--action-primary)" : "var(--border-hairline)"),
    background: on ? "var(--surface-accent-soft)" : "var(--surface-page)",
    color: on ? "var(--blue-800)" : "var(--text-body)"
  }),
  mapBox: {
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    gap: 8
  },
  mapCell: on => ({
    display: "grid",
    placeItems: "center",
    height: 44,
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-sm)",
    border: "1px solid " + (on ? "var(--action-primary)" : "var(--border-default)"),
    background: on ? "var(--surface-accent-soft)" : "var(--surface-page)",
    color: on ? "var(--blue-800)" : "var(--text-muted)"
  }),
  foot: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px clamp(16px,2.4vw,28px)",
    borderTop: "1px solid var(--border-hairline)",
    flexWrap: "wrap"
  },
  nums: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    minWidth: 160
  },
  num: s => ({
    width: 32,
    height: 32,
    borderRadius: "var(--radius-xs)",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    display: "grid",
    placeItems: "center",
    background: s.answered ? "var(--blue-100)" : "var(--surface-page)",
    color: s.answered ? "var(--blue-800)" : "var(--text-muted)",
    border: s.current ? "2px solid var(--action-primary)" : "1px solid var(--border-default)",
    fontWeight: s.current ? "var(--fw-semibold)" : "var(--fw-regular)"
  }),
  timer: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-h4)",
    color: "var(--text-muted)",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: ".04em"
  },
  exp: {
    display: "grid",
    gap: 8,
    padding: "13px 14px",
    marginTop: 10,
    background: "var(--surface-sunken)",
    borderRadius: "var(--radius-sm)"
  },
  expK: {
    fontSize: "var(--fs-2xs)",
    letterSpacing: "var(--ls-eyebrow)",
    textTransform: "uppercase",
    color: "var(--text-subtle)",
    fontWeight: "var(--fw-semibold)"
  },
  expV: {
    fontSize: "var(--fs-xs)",
    lineHeight: 1.8,
    color: "var(--text-body)"
  }
};
function Explain({
  q
}) {
  if (!q) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: lpSt.exp
  }, /*#__PURE__*/React.createElement("span", {
    style: lpSt.expK
  }, "\u9898\u76EE\u7FFB\u8BD1"), /*#__PURE__*/React.createElement("span", {
    style: lpSt.expV
  }, q.zh), /*#__PURE__*/React.createElement("span", {
    style: lpSt.expK
  }, "\u6B63\u786E\u7B54\u6848"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...lpSt.expV,
      fontFamily: "var(--font-mono)",
      color: "var(--green-700)",
      fontWeight: "var(--fw-medium)"
    }
  }, Array.isArray(q.answer) ? q.answer.join(" · ") : q.answer), /*#__PURE__*/React.createElement("span", {
    style: lpSt.expK
  }, "\u89E3\u6790"), /*#__PURE__*/React.createElement("span", {
    style: lpSt.expV
  }, q.explain), q.cue ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--blue-700)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 13
  }), "\u97F3\u9891\u5B9A\u4F4D ", q.cue) : null);
}
const pad2 = n => String(n).padStart(2, "0");
const clock = s => pad2(Math.floor(s / 3600)) + ":" + pad2(Math.floor(s / 60) % 60) + ":" + pad2(s % 60);
const mmss = s => Math.floor(s / 60) + ":" + pad2(Math.round(s) % 60);
function ListeningPractice({
  id,
  setMode,
  onBank,
  onSubmit
}) {
  const p = window.LISTENING[id];
  const [answers, setAnswers] = React.useState({});
  const [cur, setCur] = React.useState(1);
  const [secs, setSecs] = React.useState(0);
  const [pos, setPos] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [rate, setRate] = React.useState("1.0x");
  const [confirm, setConfirm] = React.useState(false);
  const [review, setReview] = React.useState(false);
  const qRefs = React.useRef({});
  const bodyRef = React.useRef(null);
  React.useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  React.useEffect(() => {
    if (!playing) return;
    const mult = parseFloat(rate);
    const t = setInterval(() => setPos(v => Math.min(v + mult, p.duration)), 1000);
    return () => clearInterval(t);
  }, [playing, rate, p.duration]);
  const answered = n => {
    const v = answers[n];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && String(v).trim() !== "";
  };
  const doneCount = p.questions.filter(q => answered(q.n)).length;
  const unanswered = p.questions.length - doneCount;
  /* 回顾模式仅在整套题全部作答后可用；它不解锁讲解，红线仍是「已作答」。 */
  const reviewAllowed = unanswered === 0;
  React.useEffect(() => {
    if (!reviewAllowed && review) setReview(false);
  }, [reviewAllowed, review]);
  const set = (n, v) => setAnswers(a => ({
    ...a,
    [n]: v
  }));
  /* 多选：数组语义，最多选 q.multi 项 */
  const toggleMulti = (q, o) => setAnswers(a => {
    const cur = Array.isArray(a[q.n]) ? a[q.n] : [];
    if (cur.includes(o)) return {
      ...a,
      [q.n]: cur.filter(x => x !== o)
    };
    if (cur.length >= q.multi) return a;
    return {
      ...a,
      [q.n]: [...cur, o]
    };
  });
  const jump = n => {
    setCur(n);
    const el = qRefs.current[n];
    if (el && bodyRef.current) bodyRef.current.scrollTo({
      top: el.offsetTop - 12,
      behavior: "smooth"
    });
  };
  const formQs = p.form ? p.form.rows.map(r => r.n) : [];
  const restQs = p.questions.filter(q => !formQs.includes(q.n));
  return /*#__PURE__*/React.createElement("div", {
    style: lpSt.page
  }, /*#__PURE__*/React.createElement("div", {
    style: lpSt.bar
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 220,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...lpSt.title,
      display: "block"
    }
  }, p.code, ". ", p.title), /*#__PURE__*/React.createElement("span", {
    style: {
      ...lpSt.meta,
      display: "block"
    }
  }, "Part ", p.part, " \xB7 ", p.questions.length, "\u9898 \xB7 ", p.freq)), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    onClick: onBank
  }, "\u8FD4\u56DE\u9898\u5E93")), setMode ? /*#__PURE__*/React.createElement("div", {
    style: lpSt.setNote
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "layers",
    size: 14
  }), "\u5957\u9898\u4F5C\u7B54\u4E2D\uFF0C\u97F3\u9891\u4F1A\u8FDE\u7EED\u64AD\u653E\u3002") : /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", {
    style: lpSt.player
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: lpSt.play,
    onClick: () => setPlaying(!playing),
    "aria-label": playing ? "暂停" : "播放"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: playing ? "pause" : "play",
    size: 22,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("span", {
    style: lpSt.track
  }, /*#__PURE__*/React.createElement("span", {
    style: lpSt.rail,
    onClick: e => {
      const r = e.currentTarget.getBoundingClientRect();
      setPos(Math.round((e.clientX - r.left) / r.width * p.duration));
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...lpSt.railFill,
      width: pos / p.duration * 100 + "%"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: lpSt.time
  }, /*#__PURE__*/React.createElement("span", null, mmss(pos)), /*#__PURE__*/React.createElement("span", null, mmss(p.duration)))), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 108,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(Select, {
    value: rate,
    onChange: e => setRate(e.target.value),
    size: "sm",
    options: ["0.75x", "1.0x", "1.25x", "1.5x"]
  }))), /*#__PURE__*/React.createElement("div", {
    ref: bodyRef,
    style: lpSt.body
  }, /*#__PURE__*/React.createElement("div", {
    style: lpSt.wrap
  }, p.form ? /*#__PURE__*/React.createElement("div", {
    style: lpSt.formCard
  }, /*#__PURE__*/React.createElement("div", {
    style: lpSt.formHead
  }, /*#__PURE__*/React.createElement("span", {
    style: lpSt.formTitle
  }, p.form.heading), /*#__PURE__*/React.createElement("span", {
    style: lpSt.formNote
  }, p.form.note)), p.form.rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.n,
    ref: el => {
      qRefs.current[r.n] = el;
    },
    style: {
      ...lpSt.formRow,
      borderBottom: i === p.form.rows.length - 1 ? "none" : lpSt.formRow.borderBottom,
      background: cur === r.n ? "var(--blue-25)" : "transparent"
    },
    onClick: () => setCur(r.n)
  }, /*#__PURE__*/React.createElement("span", {
    style: lpSt.formLabel
  }, r.label), /*#__PURE__*/React.createElement("span", {
    style: lpSt.inline
  }, /*#__PURE__*/React.createElement("span", {
    style: lpSt.dot(answered(r.n))
  }), /*#__PURE__*/React.createElement("span", {
    style: lpSt.qn
  }, r.n), r.value.split("____").map((part, k, arr) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: k
  }, /*#__PURE__*/React.createElement("span", null, part), k < arr.length - 1 ? /*#__PURE__*/React.createElement("input", {
    style: lpSt.blank(cur === r.n),
    value: answers[r.n] || "",
    onChange: e => set(r.n, e.target.value)
  }) : null))), answered(r.n) ? /*#__PURE__*/React.createElement("span", {
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement(Explain, {
    q: p.questions.find(q => q.n === r.n)
  })) : null))) : null, restQs.map(q => /*#__PURE__*/React.createElement("div", {
    key: q.n,
    ref: el => {
      qRefs.current[q.n] = el;
    },
    style: lpSt.qCard(cur === q.n),
    onClick: () => setCur(q.n)
  }, /*#__PURE__*/React.createElement("div", {
    style: lpSt.qHead
  }, /*#__PURE__*/React.createElement("span", {
    style: lpSt.dot(answered(q.n))
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...lpSt.qn,
      background: "var(--n-400)"
    }
  }, q.n), /*#__PURE__*/React.createElement("span", {
    style: lpSt.stem
  }, q.stem), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, q.type)), q.type === "地图标注" ? /*#__PURE__*/React.createElement("div", {
    style: lpSt.mapBox
  }, q.options.map(o => /*#__PURE__*/React.createElement("div", {
    key: o,
    style: lpSt.mapCell(answers[q.n] === o),
    onClick: () => set(q.n, o)
  }, o))) : q.multi ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      color: "var(--text-subtle)"
    }
  }, "\u9009\u62E9 ", q.multi, " \u9879 \xB7 \u5DF2\u9009 ", (answers[q.n] || []).length, "/", q.multi), q.options.map(o => {
    const on = (answers[q.n] || []).includes(o);
    return /*#__PURE__*/React.createElement("div", {
      key: o,
      style: lpSt.opt(on),
      onClick: () => toggleMulti(q, o)
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 15,
        height: 15,
        borderRadius: "var(--radius-xs)",
        flex: "none",
        border: "1px solid " + (on ? "var(--action-primary)" : "var(--border-default)"),
        background: on ? "var(--action-primary)" : "transparent",
        color: "var(--n-0)",
        display: "grid",
        placeItems: "center"
      }
    }, on ? /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 11,
      strokeWidth: 3
    }) : null), o);
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 7
    }
  }, q.options.map(o => /*#__PURE__*/React.createElement("div", {
    key: o,
    style: lpSt.opt(answers[q.n] === o),
    onClick: () => set(q.n, o)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 15,
      height: 15,
      borderRadius: "var(--radius-pill)",
      flex: "none",
      border: "1px solid " + (answers[q.n] === o ? "var(--action-primary)" : "var(--border-default)"),
      display: "grid",
      placeItems: "center"
    }
  }, answers[q.n] === o ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: "var(--radius-pill)",
      background: "var(--action-primary)"
    }
  }) : null), o))), answered(q.n) ? /*#__PURE__*/React.createElement(Explain, {
    q: q
  }) : null)))), /*#__PURE__*/React.createElement("div", {
    style: lpSt.foot
  }, /*#__PURE__*/React.createElement("div", {
    style: lpSt.nums
  }, p.questions.map(q => /*#__PURE__*/React.createElement("button", {
    key: q.n,
    type: "button",
    style: lpSt.num({
      answered: answered(q.n),
      current: cur === q.n
    }),
    onClick: () => jump(q.n)
  }, q.n))), /*#__PURE__*/React.createElement("span", {
    style: {
      ...lpSt.timer,
      marginLeft: "auto"
    }
  }, clock(secs)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      marginLeft: "auto",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    onClick: () => jump(Math.max(1, cur - 1))
  }, "Previous"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    onClick: () => jump(Math.min(p.questions.length, cur + 1))
  }, "Next"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    onClick: () => set(cur, "")
  }, "Clear"), /*#__PURE__*/React.createElement(Button, {
    onClick: () => unanswered > 0 ? setConfirm(true) : onSubmit({
      answers,
      secs
    })
  }, "\u4EA4\u5377"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: review ? "primary" : "ghost",
    icon: "eye",
    disabled: !reviewAllowed,
    title: reviewAllowed ? "逐题浏览整套题" : "全部作答后可用",
    onClick: () => {
      const on = !review;
      setReview(on);
      if (on) jump(1);
    }
  }, "\u56DE\u987E\u6A21\u5F0F"))), /*#__PURE__*/React.createElement(Dialog, {
    open: confirm,
    title: "还有 " + unanswered + " 题未作答，确定交卷？",
    onClose: () => setConfirm(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setConfirm(false)
    }, "\u7EE7\u7EED\u4F5C\u7B54"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => {
        setConfirm(false);
        onSubmit({
          answers,
          secs
        });
      }
    }, "\u786E\u8BA4\u4EA4\u5377"))
  }));
}
Object.assign(window, {
  ListeningPractice
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/ListeningPractice.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/ListeningSets.jsx
try { (() => {
const {
  Button,
  Icon,
  Card,
  Badge,
  IconButton,
  Dialog
} = window.STAGEDesignSystem_0f9c53;
const lsSt = {
  page: {
    padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px",
    display: "grid",
    gap: 18,
    maxWidth: 1100,
    alignContent: "start"
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h2)",
    letterSpacing: "var(--ls-heading)",
    lineHeight: 1.15,
    color: "var(--blue-950)"
  },
  note: {
    fontSize: "var(--fs-sm)",
    lineHeight: 1.75,
    color: "var(--text-muted)",
    maxWidth: "58ch"
  },
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap"
  },
  parts: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
    gap: 12
  },
  partN: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    color: "var(--blue-700)",
    fontWeight: "var(--fw-medium)"
  },
  partT: {
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-medium)",
    color: "var(--text-strong)",
    lineHeight: 1.5
  },
  track: {
    height: 5,
    borderRadius: "var(--radius-pill)",
    background: "var(--n-100)",
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    background: "var(--blue-600)",
    borderRadius: "var(--radius-pill)"
  },
  secH: {
    display: "flex",
    alignItems: "baseline",
    gap: 12,
    paddingTop: 8
  },
  secT: {
    fontSize: "var(--fs-h4)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    color: "var(--text-strong)",
    flex: 1
  },
  list: {
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden"
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 18px",
    borderBottom: "1px solid var(--border-hairline)",
    flexWrap: "wrap"
  },
  when: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-sm)",
    color: "var(--text-body)",
    whiteSpace: "nowrap"
  },
  count: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    whiteSpace: "nowrap"
  },
  detail: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
    gap: 10,
    padding: "0 18px 16px"
  },
  dCell: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    background: "var(--surface-sunken)",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--fs-xs)",
    color: "var(--text-body)"
  },
  pager: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    justifyContent: "flex-end",
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)"
  }
};
function ListeningSets({
  onStart,
  onContinue
}) {
  const data = window.LISTENING_SETS;
  const [openId, setOpenId] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [askAll, setAskAll] = React.useState(false);
  const [history, setHistory] = React.useState(data.history);
  const perPage = 2;
  const pages = Math.max(1, Math.ceil(history.length / perPage));
  const shown = history.slice(page * perPage, page * perPage + perPage);
  React.useEffect(() => {
    if (page > pages - 1) setPage(Math.max(0, pages - 1));
  }, [pages, page]);
  return /*#__PURE__*/React.createElement("div", {
    style: lsSt.page
  }, /*#__PURE__*/React.createElement("h1", {
    style: lsSt.h1
  }, "\u5957\u9898\u7EC3\u4E60"), /*#__PURE__*/React.createElement("p", {
    style: lsSt.note
  }, "\u968F\u673A\u7EC4\u6210 P1\u2013P4 \u4E00\u5957\u9898\uFF0C\u4F18\u5148\u5B89\u6392\u6CA1\u505A\u8FC7\u7684\u9898\uFF1B\u67D0\u4E2A Part \u6CA1\u6709\u672A\u505A\u9898\u65F6\uFF0C\u4F18\u5148\u5B89\u6392\u9519\u5F97\u8F83\u591A\u7684\u9898\u3002"), /*#__PURE__*/React.createElement("div", {
    style: lsSt.actions
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: onContinue
  }, "\u7EE7\u7EED\u5F53\u524D\u5957\u9898"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "shuffle",
    onClick: onStart
  }, "\u968F\u673A\u751F\u6210\u5957\u9898")), /*#__PURE__*/React.createElement("div", {
    style: lsSt.parts
  }, data.current.parts.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.part,
    padding: 18,
    style: {
      display: "grid",
      gap: 10,
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: lsSt.partN
  }, "Part ", p.part), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, p.freq)), /*#__PURE__*/React.createElement("span", {
    style: lsSt.partT
  }, p.title), /*#__PURE__*/React.createElement("span", {
    style: lsSt.track
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...lsSt.fill,
      width: Math.max(p.done / p.total * 100, 0) + "%"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, p.done, "/", p.total)))), /*#__PURE__*/React.createElement("div", {
    style: lsSt.secH
  }, /*#__PURE__*/React.createElement("span", {
    style: lsSt.secT
  }, "\u4F1A\u8BDD\u5386\u53F2\u8BB0\u5F55"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setAskAll(true),
    style: {
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontFamily: "var(--font-text)",
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-muted)"
    }
  }, "\u5220\u9664\u5168\u90E8\u8BB0\u5F55")), /*#__PURE__*/React.createElement("div", {
    style: lsSt.list
  }, shown.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: h.id,
    style: {
      borderBottom: i === shown.length - 1 ? "none" : "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...lsSt.row,
      borderBottom: openId === h.id ? "1px solid var(--border-hairline)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: lsSt.when
  }, h.when), /*#__PURE__*/React.createElement(Badge, {
    tone: h.state === "已完成" ? "verified" : "brand"
  }, h.state), /*#__PURE__*/React.createElement("span", {
    style: lsSt.count
  }, h.count, " \u6761\u8BB0\u5F55"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    onClick: onContinue
  }, "\u7EE7\u7EED\u8FD9\u6B21"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    onClick: () => setHistory(history.filter(x => x.id !== h.id))
  }, "\u5220\u9664\u8FD9\u6B21"), /*#__PURE__*/React.createElement(IconButton, {
    icon: openId === h.id ? "chevron-up" : "chevron-down",
    label: "\u5C55\u5F00",
    size: "sm",
    onClick: () => setOpenId(openId === h.id ? null : h.id)
  }))), openId === h.id ? /*#__PURE__*/React.createElement("div", {
    style: lsSt.detail
  }, h.parts.map(p => /*#__PURE__*/React.createElement("span", {
    key: p.part,
    style: lsSt.dCell
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      color: "var(--text-subtle)"
    }
  }, "P", p.part), p.done === p.total ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)"
    }
  }, p.done, "/", p.total) : p.pending ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--blue-700)"
    }
  }, "\u5F85\u7EE7\u7EED") : p.done > 0 ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)"
    }
  }, p.done, "/", p.total) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-subtle)"
    }
  }, "\u672A\u5B8C\u6210")))) : null)), history.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "28px 18px",
      fontSize: "var(--fs-sm)",
      color: "var(--text-subtle)",
      textAlign: "center"
    }
  }, "\u8FD8\u6CA1\u6709\u5957\u9898\u7EC3\u4E60\u8BB0\u5F55\u3002") : null), pages > 1 ? /*#__PURE__*/React.createElement("div", {
    style: lsSt.pager
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    disabled: page === 0,
    onClick: () => setPage(page - 1)
  }, "\u4E0A\u4E00\u6761"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)"
    }
  }, page + 1, " / ", pages), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    disabled: page >= pages - 1,
    onClick: () => setPage(page + 1)
  }, "\u4E0B\u4E00\u6761")) : null, /*#__PURE__*/React.createElement(Dialog, {
    open: askAll,
    title: "\u5220\u9664\u5168\u90E8\u5957\u9898\u8BB0\u5F55\uFF1F",
    description: "\u5220\u9664\u540E\u65E0\u6CD5\u6062\u590D\uFF0C\u9898\u5E93\u672C\u8EAB\u4E0D\u53D7\u5F71\u54CD\u3002",
    onClose: () => setAskAll(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setAskAll(false)
    }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => {
        setHistory([]);
        setAskAll(false);
      }
    }, "\u5220\u9664\u5168\u90E8\u8BB0\u5F55"))
  }));
}
Object.assign(window, {
  ListeningSets
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/ListeningSets.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/OverviewScreen.jsx
try { (() => {
const {
  Card,
  Button,
  Icon,
  Badge,
  IconButton
} = window.STAGEDesignSystem_0f9c53;
const ovStyles = {
  page: {
    padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px",
    display: "grid",
    gap: 18,
    maxWidth: 1160
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h2)",
    letterSpacing: "var(--ls-heading)",
    lineHeight: 1.15,
    color: "var(--blue-950)"
  },
  continueBar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 20px",
    border: "1px solid var(--border-accent)",
    background: "var(--surface-accent-soft)",
    borderRadius: "var(--radius-lg)",
    flexWrap: "wrap"
  },
  contTitle: {
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--text-strong)"
  },
  contMeta: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-muted)",
    marginTop: 2
  },
  saved: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    marginLeft: "auto",
    display: "inline-flex",
    alignItems: "center",
    gap: 5
  },
  retest: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 20px",
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    flexWrap: "wrap"
  },
  /* gap:1px on a hairline background gives every cell a rule on all sides —
     a wrapped row can never leave an orphaned, dividerless cell. */
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(128px,1fr))",
    gap: 1,
    background: "var(--border-hairline)",
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden"
  },
  metric: {
    padding: "20px 22px",
    background: "var(--surface-page)",
    display: "grid",
    gap: 5
  },
  mv: {
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "clamp(1.75rem,2.4vw,2.5rem)",
    letterSpacing: "var(--ls-display)",
    lineHeight: 1,
    color: "var(--blue-950)",
    fontVariantNumeric: "tabular-nums"
  },
  ml: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-muted)"
  },
  mods: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
    gap: 14
  },
  modName: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-h4)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    color: "var(--blue-950)"
  },
  modRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: "var(--fs-xs)",
    color: "var(--text-muted)"
  },
  modMono: {
    fontFamily: "var(--font-mono)",
    color: "var(--text-body)",
    whiteSpace: "nowrap",
    flex: "none",
    paddingLeft: 8
  },
  track: {
    height: 5,
    borderRadius: "var(--radius-pill)",
    background: "var(--n-100)",
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    background: "var(--blue-600)",
    borderRadius: "var(--radius-pill)"
  },
  onboard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "11px 16px",
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-md)",
    flexWrap: "wrap"
  },
  step: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: "var(--fs-xs)",
    color: "var(--text-body)",
    whiteSpace: "nowrap"
  },
  stepN: {
    width: 18,
    height: 18,
    borderRadius: "var(--radius-pill)",
    background: "var(--surface-accent-soft)",
    color: "var(--blue-700)",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    display: "grid",
    placeItems: "center",
    flex: "none"
  },
  stepDesc: {
    color: "var(--text-subtle)"
  },
  goalCard: {
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    padding: "18px 20px",
    display: "grid",
    gap: 14
  },
  goalHead: {
    display: "flex",
    alignItems: "baseline",
    gap: 12,
    flexWrap: "wrap"
  },
  goalTitle: {
    fontSize: "var(--fs-h4)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    color: "var(--text-strong)"
  },
  goalNote: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)"
  },
  goalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(132px,1fr))",
    gap: 12
  },
  goalItem: {
    display: "grid",
    gap: 6
  },
  goalLabel: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-muted)"
  },
  goalInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-sm)",
    padding: "9px 12px",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-body)",
    color: "var(--text-strong)",
    outline: "none",
    background: "var(--surface-page)"
  },
  modSub: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)"
  },
  facts: {
    display: "grid",
    gap: 6,
    margin: 0,
    padding: 0,
    listStyle: "none"
  },
  fact: {
    display: "flex",
    gap: 8,
    fontSize: "var(--fs-xs)",
    lineHeight: 1.6,
    color: "var(--text-body)"
  },
  secHead: {
    display: "flex",
    alignItems: "baseline",
    gap: 12
  },
  secTitle: {
    fontSize: "var(--fs-h4)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    color: "var(--text-strong)"
  },
  all: {
    marginLeft: "auto",
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-medium)",
    color: "var(--blue-700)"
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1.6fr auto auto auto auto",
    gap: 18,
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid var(--border-hairline)"
  }
};
function OverviewScreen({
  onRoute,
  onTypes
}) {
  const d = window.LAB_DATA;
  const [guide, setGuide] = React.useState(true);
  const [goals, setGoals] = React.useState(d.goals);
  return /*#__PURE__*/React.createElement("div", {
    style: ovStyles.page
  }, /*#__PURE__*/React.createElement("h1", {
    style: ovStyles.h1
  }, "\u5B66\u4E60\u603B\u89C8"), guide ? /*#__PURE__*/React.createElement("div", {
    style: ovStyles.onboard
  }, d.onboarding.map(s => /*#__PURE__*/React.createElement("span", {
    key: s.n,
    style: ovStyles.step
  }, /*#__PURE__*/React.createElement("span", {
    style: ovStyles.stepN
  }, s.n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "var(--fw-medium)"
    }
  }, s.title), /*#__PURE__*/React.createElement("span", {
    style: ovStyles.stepDesc
  }, "\u2014 ", s.desc))), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "x",
    label: "\u5173\u95ED\u5F15\u5BFC",
    size: "sm",
    onClick: () => setGuide(false)
  }))) : null, d.continueItem ? /*#__PURE__*/React.createElement("div", {
    style: ovStyles.continueBar
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      color: "var(--blue-700)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "book-open",
    size: 19
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: ovStyles.contTitle
  }, "\u7EE7\u7EED\u4E0A\u6B21\uFF1A", d.continueItem.title), /*#__PURE__*/React.createElement("span", {
    style: {
      ...ovStyles.contMeta,
      display: "block"
    }
  }, d.continueItem.zh, " \xB7 ", d.continueItem.skill, " ", d.continueItem.part, " \xB7 \u8FDB\u5EA6 ", d.continueItem.progress)), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "\u7EE7\u7EED"), /*#__PURE__*/React.createElement("span", {
    style: ovStyles.saved
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 12,
    strokeWidth: 2.5
  }), "\u5DF2\u81EA\u52A8\u4FDD\u5B58")) : null, d.retestDue > 0 ? /*#__PURE__*/React.createElement("div", {
    style: ovStyles.retest
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      color: "var(--text-subtle)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "rotate-ccw",
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: "var(--fs-sm)",
      color: "var(--text-body)"
    }
  }, "\u6709 ", d.retestDue, " \u9053\u9519\u9898\u5230\u4E86\u5EFA\u8BAE\u91CD\u6D4B\u7684\u65F6\u95F4"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    onClick: () => onRoute("queue")
  }, "\u53BB\u91CD\u6D4B")) : null, /*#__PURE__*/React.createElement("div", {
    style: ovStyles.metrics
  }, d.metrics.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: m.label,
    style: ovStyles.metric
  }, /*#__PURE__*/React.createElement("span", {
    style: ovStyles.mv
  }, m.value), /*#__PURE__*/React.createElement("span", {
    style: ovStyles.ml
  }, m.label, " \xB7 ", m.note)))), /*#__PURE__*/React.createElement("div", {
    style: ovStyles.goalCard
  }, /*#__PURE__*/React.createElement("div", {
    style: ovStyles.goalHead
  }, /*#__PURE__*/React.createElement("span", {
    style: ovStyles.goalTitle
  }, "\u6211\u7684\u76EE\u6807\u5206\u6570"), /*#__PURE__*/React.createElement("span", {
    style: ovStyles.goalNote
  }, "\u76EE\u6807\u5206\u6570\u7531\u4F60\u81EA\u5DF1\u8BBE\u5B9A\uFF0C\u4EC5\u7528\u4E8E\u4E2A\u4EBA\u89C4\u5212\u53C2\u8003\u3002")), /*#__PURE__*/React.createElement("div", {
    style: ovStyles.goalGrid
  }, ["Reading", "Listening", "Writing", "Speaking"].map(k => /*#__PURE__*/React.createElement("label", {
    key: k,
    style: ovStyles.goalItem
  }, /*#__PURE__*/React.createElement("span", {
    style: ovStyles.goalLabel
  }, k), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "4",
    max: "9",
    step: "0.5",
    style: ovStyles.goalInput,
    value: goals[k],
    onChange: e => setGoals({
      ...goals,
      [k]: e.target.value
    })
  }))))), /*#__PURE__*/React.createElement("div", {
    style: ovStyles.mods
  }, d.modules.map(m => /*#__PURE__*/React.createElement(Card, {
    key: m.skill,
    padding: 20,
    style: {
      display: "grid",
      gap: 12,
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--blue-700)",
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: m.icon,
    size: 19
  })), /*#__PURE__*/React.createElement("span", {
    style: ovStyles.modName
  }, m.skill), /*#__PURE__*/React.createElement("span", {
    style: {
      ...ovStyles.modSub,
      marginLeft: "auto"
    }
  }, m.sub)), /*#__PURE__*/React.createElement("ul", {
    style: ovStyles.facts
  }, m.facts.map(f => /*#__PURE__*/React.createElement("li", {
    key: f,
    style: ovStyles.fact
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--n-400)",
      display: "grid",
      paddingTop: 3,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "minus",
    size: 12
  })), f))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: ovStyles.modRow
  }, /*#__PURE__*/React.createElement("span", null, "\u5DF2\u7EC3\u4E60"), /*#__PURE__*/React.createElement("span", {
    style: ovStyles.modMono
  }, m.done, " / ", m.total, " ", m.unit)), /*#__PURE__*/React.createElement("div", {
    style: ovStyles.track
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...ovStyles.fill,
      width: Math.max(m.done / m.total * 100, 1.5) + "%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: ovStyles.modRow
  }, /*#__PURE__*/React.createElement("span", null, "\u6700\u8FD1\u4E00\u6B21\u6B63\u786E\u7387"), /*#__PURE__*/React.createElement("span", {
    style: ovStyles.modMono
  }, m.lastAcc))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    fullWidth: true,
    onClick: () => onRoute(m.skill.toLowerCase())
  }, m.actions[0]), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    fullWidth: true,
    onClick: () => onRoute(m.skill.toLowerCase())
  }, m.actions[1]))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...ovStyles.secHead,
      paddingBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: ovStyles.secTitle
  }, "\u6700\u8FD1\u7EC3\u4E60"), /*#__PURE__*/React.createElement("a", {
    href: "#types",
    style: {
      ...ovStyles.all,
      marginLeft: "auto",
      color: "var(--text-muted)"
    },
    onClick: e => {
      e.preventDefault();
      onTypes();
    }
  }, "\u9898\u578B\u8BF4\u660E"), /*#__PURE__*/React.createElement("a", {
    href: "#history",
    style: {
      ...ovStyles.all,
      marginLeft: 0
    },
    onClick: e => {
      e.preventDefault();
      onRoute("history");
    }
  }, "\u5168\u90E8\u8BB0\u5F55 \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden"
    }
  }, d.recent.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.title,
    style: {
      ...ovStyles.row,
      borderBottom: i === d.recent.length - 1 ? "none" : ovStyles.row.borderBottom
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-strong)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, r.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      color: "var(--text-subtle)",
      marginTop: 2
    }
  }, r.zh)), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, r.skill, " ", r.part), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xs)",
      color: "var(--text-subtle)"
    }
  }, r.date), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-body)"
    }
  }, "\u6211\u7684\u6B63\u786E\u7387 ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: "var(--fw-medium)"
    }
  }, r.mine), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-subtle)"
    }
  }, " \xB7 \u5168\u4F53\u5E73\u5747 ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)"
    }
  }, r.avg))), /*#__PURE__*/React.createElement("a", {
    href: "#review",
    style: {
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--blue-700)",
      justifySelf: "end"
    },
    onClick: e => e.preventDefault()
  }, "\u56DE\u987E"))))));
}
Object.assign(window, {
  OverviewScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/OverviewScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/PracticeScreen.jsx
try { (() => {
const {
  Button,
  Icon,
  IconButton,
  Badge,
  Dialog,
  Card
} = window.STAGEDesignSystem_0f9c53;
const prSt = {
  page: {
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    height: "100vh",
    minWidth: 0
  },
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    padding: "12px clamp(16px,2.4vw,28px)",
    borderBottom: "1px solid var(--border-hairline)",
    flexWrap: "wrap"
  },
  title: {
    fontSize: "var(--fs-body)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--text-strong)",
    lineHeight: 1.35
  },
  zh: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-muted)"
  },
  meta: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    marginTop: 3
  },
  /* 正计时：中性灰，永不变色、不倒计时、不显示剩余时间 */
  timer: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-h4)",
    color: "var(--text-muted)",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: ".04em"
  },
  saved: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)"
  },
  cols: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1.05fr) minmax(0,1fr)",
    minHeight: 0
  },
  left: {
    overflowY: "auto",
    padding: "22px clamp(18px,2.4vw,30px) 40px",
    borderRight: "1px solid var(--border-hairline)"
  },
  right: {
    overflowY: "auto",
    padding: "22px clamp(18px,2.4vw,30px) 40px",
    display: "grid",
    gap: 14,
    alignContent: "start"
  },
  pTag: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    fontWeight: "var(--fw-medium)",
    color: "var(--blue-700)"
  },
  para: {
    fontSize: "var(--fs-sm)",
    lineHeight: 1.9,
    color: "var(--text-body)"
  },
  transBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    fontFamily: "var(--font-text)",
    fontSize: "var(--fs-xs)",
    fontWeight: "var(--fw-medium)",
    color: "var(--blue-700)"
  },
  trans: {
    marginTop: 8,
    padding: "12px 14px",
    background: "var(--surface-sunken)",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--fs-xs)",
    lineHeight: 1.85,
    color: "var(--text-muted)"
  },
  qCard: cur => ({
    border: "1px solid " + (cur ? "var(--border-accent)" : "var(--border-hairline)"),
    borderRadius: "var(--radius-md)",
    padding: 16,
    display: "grid",
    gap: 11,
    scrollMarginTop: 12
  }),
  qHead: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start"
  },
  dot: answered => ({
    width: 11,
    height: 11,
    borderRadius: "var(--radius-pill)",
    flex: "none",
    marginTop: 5,
    background: answered ? "var(--blue-600)" : "transparent",
    border: answered ? "none" : "1px solid var(--n-400)"
  }),
  qn: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    fontWeight: "var(--fw-medium)",
    color: "var(--text-strong)",
    flex: "none"
  },
  stem: {
    fontSize: "var(--fs-sm)",
    lineHeight: 1.65,
    color: "var(--text-body)",
    flex: 1
  },
  opt: on => ({
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "9px 12px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontSize: "var(--fs-sm)",
    border: "1px solid " + (on ? "var(--action-primary)" : "var(--border-hairline)"),
    background: on ? "var(--surface-accent-soft)" : "var(--surface-page)",
    color: on ? "var(--blue-800)" : "var(--text-body)",
    fontWeight: on ? "var(--fw-medium)" : "var(--fw-regular)"
  }),
  input: {
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-sm)",
    padding: "9px 12px",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-sm)",
    color: "var(--text-strong)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box"
  },
  exp: {
    display: "grid",
    gap: 8,
    padding: "13px 14px",
    background: "var(--surface-sunken)",
    borderRadius: "var(--radius-sm)",
    borderTop: "1px solid var(--border-hairline)"
  },
  expK: {
    fontSize: "var(--fs-2xs)",
    letterSpacing: "var(--ls-eyebrow)",
    textTransform: "uppercase",
    color: "var(--text-subtle)",
    fontWeight: "var(--fw-semibold)"
  },
  expV: {
    fontSize: "var(--fs-xs)",
    lineHeight: 1.8,
    color: "var(--text-body)"
  },
  locate: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    fontFamily: "var(--font-text)",
    fontSize: "var(--fs-xs)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--blue-700)",
    justifySelf: "start"
  },
  foot: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px clamp(16px,2.4vw,28px)",
    borderTop: "1px solid var(--border-hairline)",
    background: "var(--surface-page)",
    flexWrap: "wrap"
  },
  nums: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    flex: 1,
    minWidth: 200
  },
  num: state => ({
    width: 32,
    height: 32,
    borderRadius: "var(--radius-xs)",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    display: "grid",
    placeItems: "center",
    background: state.answered ? "var(--blue-100)" : "var(--surface-page)",
    color: state.answered ? "var(--blue-800)" : "var(--text-muted)",
    border: state.current ? "2px solid var(--action-primary)" : "1px solid var(--border-default)",
    fontWeight: state.current ? "var(--fw-semibold)" : "var(--fw-regular)"
  }),
  progress: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-body)",
    whiteSpace: "nowrap"
  },
  pdfWrap: {
    display: "grid",
    gap: 16,
    maxWidth: 620,
    margin: "0 auto",
    padding: "8px 0 40px"
  },
  pdfSheet: {
    background: "var(--surface-page)",
    border: "1px solid var(--border-default)",
    boxShadow: "var(--shadow-md)",
    padding: "44px 46px",
    display: "grid",
    gap: 16
  }
};
const pad2 = n => String(n).padStart(2, "0");
const fmt = s => pad2(Math.floor(s / 3600)) + ":" + pad2(Math.floor(s / 60) % 60) + ":" + pad2(s % 60);
function PracticeScreen({
  id,
  onExit,
  onSubmit
}) {
  const p = window.PRACTICE[id];
  const [answers, setAnswers] = React.useState({});
  const [cur, setCur] = React.useState(1);
  const [open, setOpen] = React.useState({});
  const [secs, setSecs] = React.useState(0);
  const [confirm, setConfirm] = React.useState(false);
  const [exitAsk, setExitAsk] = React.useState(false);
  const [pdf, setPdf] = React.useState(false);
  const [review, setReview] = React.useState(false);
  const qRefs = React.useRef({});
  const paraRefs = React.useRef({});
  const leftRef = React.useRef(null);
  const rightRef = React.useRef(null);
  const [hlPara, setHlPara] = React.useState(null);
  React.useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const answered = n => answers[n] !== undefined && String(answers[n]).trim() !== "";
  const doneCount = p.questions.filter(q => answered(q.n)).length;
  const unanswered = p.questions.length - doneCount;
  /* 回顾模式只在整套题全部作答后才可用——它不是绕过「已作答才解锁讲解」的开关。 */
  const reviewAllowed = unanswered === 0;
  React.useEffect(() => {
    if (!reviewAllowed && review) setReview(false);
  }, [reviewAllowed, review]);
  const jump = n => {
    setCur(n);
    const el = qRefs.current[n];
    if (el && rightRef.current) rightRef.current.scrollTo({
      top: el.offsetTop - 12,
      behavior: "smooth"
    });
  };
  const locate = tag => {
    setHlPara(tag);
    const el = paraRefs.current[tag];
    if (el && leftRef.current) leftRef.current.scrollTo({
      top: el.offsetTop - 20,
      behavior: "smooth"
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    style: prSt.page
  }, /*#__PURE__*/React.createElement("div", {
    style: prSt.bar
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 200,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...prSt.title,
      display: "block"
    }
  }, p.title), /*#__PURE__*/React.createElement("span", {
    style: {
      ...prSt.zh,
      display: "block"
    }
  }, p.zh), /*#__PURE__*/React.createElement("span", {
    style: {
      ...prSt.meta,
      display: "block"
    }
  }, "Part ", p.part, " \xB7 ", p.questions.length, "\u9898 \xB7 ", p.freq)), /*#__PURE__*/React.createElement("span", {
    style: prSt.timer
  }, fmt(secs)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: prSt.saved
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 12,
    strokeWidth: 2.5
  }), "\u5DF2\u81EA\u52A8\u4FDD\u5B58"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    onClick: () => setExitAsk(true)
  }, "Exit"))), /*#__PURE__*/React.createElement("div", {
    style: prSt.cols
  }, /*#__PURE__*/React.createElement("div", {
    ref: leftRef,
    style: prSt.left
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      paddingBottom: 14,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      letterSpacing: "var(--ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--text-subtle)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Reading Passage ", p.part), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: pdf ? "primary" : "ghost",
    icon: "file-text",
    onClick: () => setPdf(!pdf)
  }, "\u67E5\u770B PDF")), pdf ? /*#__PURE__*/React.createElement("div", {
    style: prSt.pdfWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: prSt.pdfSheet
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--text-subtle)",
      letterSpacing: ".1em"
    }
  }, "READING PASSAGE ", p.part), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 19,
      fontWeight: "var(--fw-bold)",
      color: "var(--text-strong)",
      lineHeight: 1.35
    }
  }, p.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontStyle: "italic",
      color: "var(--text-muted)",
      lineHeight: 1.7
    }
  }, p.instruction), p.paragraphs.map(g => /*#__PURE__*/React.createElement("p", {
    key: g.tag,
    style: {
      margin: 0,
      fontSize: 13.5,
      lineHeight: 1.95,
      color: "var(--text-body)",
      textAlign: "justify"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "var(--fw-bold)",
      paddingRight: 8
    }
  }, g.tag), g.en)))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 20px",
      fontSize: "var(--fs-xs)",
      fontStyle: "italic",
      lineHeight: 1.75,
      color: "var(--text-muted)"
    }
  }, p.instruction), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 22
    }
  }, p.paragraphs.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.tag,
    ref: el => {
      paraRefs.current[g.tag] = el;
    },
    style: {
      background: hlPara === g.tag ? "var(--gold-50)" : "transparent",
      borderRadius: "var(--radius-sm)",
      padding: hlPara === g.tag ? "10px 12px" : "0",
      margin: hlPara === g.tag ? "-10px -12px" : 0,
      transition: "background var(--dur-slow) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...prSt.pTag,
      flex: "none",
      paddingTop: 3
    }
  }, "Paragraph ", g.tag)), /*#__PURE__*/React.createElement("p", {
    style: {
      ...prSt.para,
      margin: "6px 0 0"
    }
  }, g.en), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: prSt.transBtn,
    onClick: () => setOpen({
      ...open,
      ["p" + g.tag]: !open["p" + g.tag]
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    name: open["p" + g.tag] ? "chevron-down" : "chevron-right",
    size: 13
  }), "\u4E2D\u6587\u5BF9\u7167"), open["p" + g.tag] ? /*#__PURE__*/React.createElement("div", {
    style: prSt.trans
  }, g.zh) : null))))), /*#__PURE__*/React.createElement("div", {
    ref: rightRef,
    style: prSt.right
  }, p.questions.map(q => {
    const a = answers[q.n];
    const isAnswered = answered(q.n);
    /* 红线：讲解卡片以「已作答」为唯一展开条件。回顾模式不得绕过它。 */
    const canExplain = isAnswered;
    return /*#__PURE__*/React.createElement("div", {
      key: q.n,
      ref: el => {
        qRefs.current[q.n] = el;
      },
      style: prSt.qCard(cur === q.n),
      onClick: () => setCur(q.n)
    }, /*#__PURE__*/React.createElement("div", {
      style: prSt.qHead
    }, /*#__PURE__*/React.createElement("span", {
      style: prSt.dot(isAnswered)
    }), /*#__PURE__*/React.createElement("span", {
      style: prSt.qn
    }, q.n), /*#__PURE__*/React.createElement("span", {
      style: prSt.stem
    }, q.stem), /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, q.type)), q.options ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 7
      }
    }, q.options.map(o => /*#__PURE__*/React.createElement("div", {
      key: o,
      style: prSt.opt(a === o),
      onClick: () => setAnswers({
        ...answers,
        [q.n]: o
      })
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 15,
        height: 15,
        borderRadius: "var(--radius-pill)",
        flex: "none",
        border: "1px solid " + (a === o ? "var(--action-primary)" : "var(--border-default)"),
        display: "grid",
        placeItems: "center"
      }
    }, a === o ? /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: "var(--radius-pill)",
        background: "var(--action-primary)"
      }
    }) : null), o))) : /*#__PURE__*/React.createElement("input", {
      style: prSt.input,
      placeholder: "\u586B\u5199\u7B54\u6848",
      value: a || "",
      onChange: e => setAnswers({
        ...answers,
        [q.n]: e.target.value
      })
    }), canExplain ? /*#__PURE__*/React.createElement("div", {
      style: prSt.exp
    }, /*#__PURE__*/React.createElement("span", {
      style: prSt.expK
    }, "\u9898\u76EE\u7FFB\u8BD1"), /*#__PURE__*/React.createElement("span", {
      style: prSt.expV
    }, q.zh), /*#__PURE__*/React.createElement("span", {
      style: prSt.expK
    }, "\u6B63\u786E\u7B54\u6848"), /*#__PURE__*/React.createElement("span", {
      style: {
        ...prSt.expV,
        fontFamily: "var(--font-mono)",
        color: "var(--green-700)",
        fontWeight: "var(--fw-medium)"
      }
    }, q.answer), /*#__PURE__*/React.createElement("span", {
      style: prSt.expK
    }, "\u89E3\u6790"), /*#__PURE__*/React.createElement("span", {
      style: prSt.expV
    }, q.explain), /*#__PURE__*/React.createElement("button", {
      type: "button",
      style: prSt.locate,
      onClick: () => locate(q.ref)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "link",
      size: 13
    }), "\u5B9A\u4F4D\u539F\u6587 \xB7 Paragraph ", q.ref)) : null);
  }))), /*#__PURE__*/React.createElement("div", {
    style: prSt.foot
  }, /*#__PURE__*/React.createElement("div", {
    style: prSt.nums
  }, p.questions.map(q => /*#__PURE__*/React.createElement("button", {
    key: q.n,
    type: "button",
    style: prSt.num({
      answered: answered(q.n),
      current: cur === q.n
    }),
    onClick: () => jump(q.n)
  }, q.n))), /*#__PURE__*/React.createElement("span", {
    style: prSt.progress
  }, "\u5DF2\u5B8C\u6210 ", doneCount, "/", p.questions.length, " \u9898"), /*#__PURE__*/React.createElement(Button, {
    onClick: () => unanswered > 0 ? setConfirm(true) : onSubmit({
      answers,
      secs
    })
  }, "\u4EA4\u5377"), /*#__PURE__*/React.createElement(Button, {
    variant: review ? "primary" : "ghost",
    icon: "eye",
    disabled: !reviewAllowed,
    title: reviewAllowed ? "逐题浏览整套题" : "全部作答后可用",
    onClick: () => {
      const on = !review;
      setReview(on);
      if (on) jump(1);
    }
  }, "\u56DE\u987E\u6A21\u5F0F")), /*#__PURE__*/React.createElement(Dialog, {
    open: confirm,
    title: "还有 " + unanswered + " 题未作答，确定交卷？",
    onClose: () => setConfirm(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setConfirm(false)
    }, "\u7EE7\u7EED\u4F5C\u7B54"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => {
        setConfirm(false);
        onSubmit({
          answers,
          secs
        });
      }
    }, "\u786E\u8BA4\u4EA4\u5377"))
  }), /*#__PURE__*/React.createElement(Dialog, {
    open: exitAsk,
    title: "\u9000\u51FA\u672C\u6B21\u7EC3\u4E60\uFF1F",
    description: "\u5F53\u524D\u4F5C\u7B54\u5DF2\u81EA\u52A8\u4FDD\u5B58\uFF0C\u4E0B\u6B21\u53EF\u4EE5\u4ECE\u8FD9\u91CC\u7EE7\u7EED\u3002",
    onClose: () => setExitAsk(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setExitAsk(false)
    }, "\u7EE7\u7EED\u4F5C\u7B54"), /*#__PURE__*/React.createElement(Button, {
      onClick: onExit
    }, "\u786E\u8BA4\u9000\u51FA"))
  }));
}
Object.assign(window, {
  PracticeScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/PracticeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/QuestionTypes.jsx
try { (() => {
const {
  Icon,
  Badge,
  Card
} = window.STAGEDesignSystem_0f9c53;
const qtSt = {
  page: {
    padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px",
    display: "grid",
    gap: 18,
    maxWidth: 1000,
    alignContent: "start"
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h2)",
    letterSpacing: "var(--ls-heading)",
    lineHeight: 1.15,
    color: "var(--blue-950)"
  },
  sub: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-muted)",
    maxWidth: "54ch",
    lineHeight: 1.7
  },
  cols: {
    display: "grid",
    gridTemplateColumns: "168px minmax(0,1fr)",
    gap: 20,
    alignItems: "start"
  },
  side: {
    display: "grid",
    gap: 3,
    alignContent: "start"
  },
  item: on => ({
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    border: "none",
    width: "100%",
    textAlign: "left",
    fontFamily: "var(--font-text)",
    fontSize: "var(--fs-sm)",
    fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
    background: on ? "var(--surface-accent-soft)" : "transparent",
    color: on ? "var(--blue-800)" : "var(--text-muted)",
    whiteSpace: "nowrap"
  }),
  list: {
    display: "grid",
    gap: 12
  },
  head: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    flexWrap: "wrap"
  },
  zh: {
    fontSize: "var(--fs-body)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--text-strong)",
    letterSpacing: "var(--ls-heading)"
  },
  en: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    fontFamily: "var(--font-mono)"
  },
  count: {
    marginLeft: "auto",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    whiteSpace: "nowrap"
  },
  desc: {
    fontSize: "var(--fs-sm)",
    lineHeight: 1.8,
    color: "var(--text-body)",
    margin: 0
  }
};
const qtIcons = {
  Reading: "book-open",
  Listening: "headphones",
  Writing: "pen-line",
  Speaking: "messages-square"
};
function QuestionTypes({
  initial
}) {
  const data = window.QUESTION_TYPES;
  const skills = Object.keys(data);
  const [skill, setSkill] = React.useState(skills.includes(initial) ? initial : skills[0]);
  return /*#__PURE__*/React.createElement("div", {
    style: qtSt.page
  }, /*#__PURE__*/React.createElement("h1", {
    style: qtSt.h1
  }, "\u9898\u578B\u8BF4\u660E"), /*#__PURE__*/React.createElement("p", {
    style: qtSt.sub
  }, "\u6BCF\u79CD\u9898\u578B\u8981\u6C42\u4F60\u505A\u4EC0\u4E48\uFF0C\u7528\u5927\u767D\u8BDD\u8BB2\u4E00\u904D\u3002\u8FD9\u91CC\u53EA\u8BB2\u65B9\u6CD5\uFF0C\u4E0D\u653E\u4EFB\u4F55\u771F\u9898\u5185\u5BB9\u6216\u6807\u51C6\u7B54\u6848\u3002"), /*#__PURE__*/React.createElement("div", {
    style: qtSt.cols
  }, /*#__PURE__*/React.createElement("nav", {
    style: qtSt.side
  }, skills.map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    type: "button",
    style: qtSt.item(s === skill),
    onClick: () => setSkill(s)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      color: s === skill ? "var(--blue-700)" : "var(--n-400)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: qtIcons[s],
    size: 16
  })), s, /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xs)",
      opacity: .7
    }
  }, data[s].length)))), /*#__PURE__*/React.createElement("div", {
    style: qtSt.list
  }, data[skill].map(t => /*#__PURE__*/React.createElement(Card, {
    key: t.en,
    padding: 18,
    style: {
      display: "grid",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: qtSt.head
  }, /*#__PURE__*/React.createElement("span", {
    style: qtSt.zh
  }, t.zh), /*#__PURE__*/React.createElement("span", {
    style: qtSt.en
  }, t.en), /*#__PURE__*/React.createElement("span", {
    style: qtSt.count
  }, "\u9898\u5E93 ", t.count, " \u9898")), /*#__PURE__*/React.createElement("p", {
    style: qtSt.desc
  }, t.desc))))));
}
Object.assign(window, {
  QuestionTypes
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/QuestionTypes.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/QueueScreen.jsx
try { (() => {
const {
  Button,
  Icon,
  Badge,
  EmptyState
} = window.STAGEDesignSystem_0f9c53;
const quStyles = {
  page: {
    padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px",
    display: "grid",
    gap: 18,
    maxWidth: 1160,
    alignContent: "start"
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h2)",
    letterSpacing: "var(--ls-heading)",
    lineHeight: 1.15,
    color: "var(--blue-950)"
  },
  sub: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-muted)"
  },
  list: {
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    overflowX: "auto"
  },
  row: {
    display: "grid",
    gridTemplateColumns: "minmax(210px,1.6fr) auto auto auto minmax(200px,1.1fr) auto auto",
    gap: 14,
    alignItems: "center",
    padding: "15px 18px",
    borderBottom: "1px solid var(--border-hairline)",
    minWidth: 900
  },
  title: {
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-medium)",
    color: "var(--text-strong)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  zh: {
    fontSize: "var(--fs-2xs)",
    color: "var(--text-subtle)",
    marginTop: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  mono: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    whiteSpace: "nowrap"
  },
  causes: {
    display: "flex",
    gap: 5,
    flexWrap: "wrap"
  },
  cause: {
    padding: "2px 9px",
    borderRadius: "var(--radius-pill)",
    background: "var(--surface-sunken)",
    border: "1px solid var(--border-hairline)",
    fontSize: "var(--fs-2xs)",
    color: "var(--text-muted)",
    whiteSpace: "nowrap"
  },
  due: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-body)",
    whiteSpace: "nowrap"
  },
  compare: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    color: "var(--text-body)",
    whiteSpace: "nowrap"
  }
};
function QueueScreen() {
  const [items, setItems] = React.useState(window.LAB_QUEUE.map(q => ({
    ...q
  })));
  const doRetest = id => setItems(p => p.map(it => it.id === id ? {
    ...it,
    retested: it.retest,
    due: "已完成"
  } : it));
  const pending = items.filter(it => !it.retested);
  const done = items.filter(it => it.retested);
  const Row = ({
    it,
    last
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      ...quStyles.row,
      borderBottom: last ? "none" : quStyles.row.borderBottom
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...quStyles.title,
      display: "block"
    }
  }, it.title), /*#__PURE__*/React.createElement("span", {
    style: {
      ...quStyles.zh,
      display: "block"
    }
  }, it.zh)), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, it.skill), /*#__PURE__*/React.createElement("span", {
    style: {
      ...quStyles.mono,
      color: "var(--text-subtle)"
    }
  }, it.date), /*#__PURE__*/React.createElement("span", {
    style: quStyles.mono
  }, "\u539F ", it.mine), /*#__PURE__*/React.createElement("span", {
    style: quStyles.causes
  }, it.causes.map(c => /*#__PURE__*/React.createElement("span", {
    key: c,
    style: quStyles.cause
  }, c))), it.retested ? /*#__PURE__*/React.createElement("span", {
    style: quStyles.compare
  }, "\u4E0A\u6B21 ", it.mine, " ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 12
  }), " \u672C\u6B21 ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "var(--fw-semibold)",
      color: "var(--green-700)"
    }
  }, it.retested)) : /*#__PURE__*/React.createElement("span", {
    style: quStyles.due
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 12,
    style: {
      display: "inline-block",
      verticalAlign: -1,
      marginRight: 5,
      color: "var(--text-subtle)"
    }
  }), "\u5EFA\u8BAE\u91CD\u6D4B ", it.due), it.retested ? /*#__PURE__*/React.createElement(Badge, {
    tone: "verified"
  }, "\u5DF2\u5B8C\u6210") : /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    onClick: () => doRetest(it.id)
  }, "\u91CD\u6D4B"));
  return /*#__PURE__*/React.createElement("div", {
    style: quStyles.page
  }, /*#__PURE__*/React.createElement("h1", {
    style: quStyles.h1
  }, "\u590D\u76D8\u961F\u5217"), /*#__PURE__*/React.createElement("span", {
    style: quStyles.sub
  }, "\u6309\u5EFA\u8BAE\u91CD\u6D4B\u65F6\u95F4\u6392\u5E8F\u3002\u91CD\u6D4B\u53EA\u6BD4\u8F83\u4F60\u81EA\u5DF1\u7684\u4E24\u6B21\u6B63\u786E\u7387\uFF0C\u4E0D\u8BC4\u7EA7\u3001\u4E0D\u6253\u5206\u3002"), pending.length === 0 && done.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "rotate-ccw",
    title: "\u961F\u5217\u662F\u7A7A\u7684",
    description: "\u961F\u5217\u662F\u7A7A\u7684\u2014\u2014\u53BB\u7EC3\u4E60\u91CC\u72AF\u70B9\u9519\uFF0C\u518D\u56DE\u6765\u6D88\u706D\u5B83\u4EEC\u3002"
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, pending.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "rotate-ccw",
    title: "\u961F\u5217\u662F\u7A7A\u7684",
    description: "\u961F\u5217\u662F\u7A7A\u7684\u2014\u2014\u53BB\u7EC3\u4E60\u91CC\u72AF\u70B9\u9519\uFF0C\u518D\u56DE\u6765\u6D88\u706D\u5B83\u4EEC\u3002"
  }) : /*#__PURE__*/React.createElement("div", {
    style: quStyles.list
  }, pending.map((it, i) => /*#__PURE__*/React.createElement(Row, {
    key: it.id,
    it: it,
    last: i === pending.length - 1
  }))), done.length ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-h4)",
      fontWeight: "var(--fw-semibold)",
      letterSpacing: "var(--ls-heading)",
      color: "var(--text-strong)",
      paddingTop: 6
    }
  }, "\u5DF2\u5B8C\u6210\u91CD\u6D4B"), /*#__PURE__*/React.createElement("div", {
    style: quStyles.list
  }, done.map((it, i) => /*#__PURE__*/React.createElement(Row, {
    key: it.id,
    it: it,
    last: i === done.length - 1
  })))) : null));
}
Object.assign(window, {
  QueueScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/QueueScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/ResultScreen.jsx
try { (() => {
const {
  Button,
  Icon,
  Card,
  Badge
} = window.STAGEDesignSystem_0f9c53;
const rsSt = {
  page: {
    padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px",
    display: "grid",
    gap: 18,
    maxWidth: 900,
    alignContent: "start"
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h2)",
    letterSpacing: "var(--ls-heading)",
    lineHeight: 1.15,
    color: "var(--blue-950)"
  },
  sub: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-muted)"
  },
  top: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(128px,1fr))",
    gap: 1,
    background: "var(--border-hairline)",
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden"
  },
  cell: {
    padding: "20px 22px",
    background: "var(--surface-page)",
    display: "grid",
    gap: 5
  },
  v: {
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "clamp(1.75rem,2.4vw,2.5rem)",
    letterSpacing: "var(--ls-display)",
    lineHeight: 1,
    color: "var(--blue-950)",
    fontVariantNumeric: "tabular-nums"
  },
  l: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-muted)"
  },
  list: {
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden"
  },
  row: {
    display: "grid",
    gridTemplateColumns: "34px auto minmax(0,1fr) minmax(190px,auto)",
    gap: 14,
    alignItems: "center",
    padding: "13px 18px",
    borderBottom: "1px solid var(--border-hairline)"
  },
  n: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)"
  },
  stem: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-body)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  ans: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    display: "flex",
    gap: 8,
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap"
  },
  foot: {
    display: "flex",
    gap: 12,
    paddingTop: 8,
    flexWrap: "wrap"
  }
};
function ResultScreen({
  id,
  bank,
  result,
  onBank,
  onReview
}) {
  const p = (bank === "LISTENING" ? window.LISTENING : window.PRACTICE)[id];
  const {
    answers,
    secs
  } = result;
  const norm = v => (Array.isArray(v) ? v.slice().sort().join(" · ") : String(v || "").trim()).toLowerCase();
  const rows = p.questions.map(q => ({
    ...q,
    mine: Array.isArray(answers[q.n]) ? answers[q.n].join(" · ") : answers[q.n],
    ok: norm(answers[q.n]) === norm(q.answer)
  }));
  const correct = rows.filter(r => r.ok).length;
  const wrong = rows.length - correct;
  const acc = Math.round(correct / rows.length * 100);
  const mm = Math.floor(secs / 60),
    ss = secs % 60;
  return /*#__PURE__*/React.createElement("div", {
    style: rsSt.page
  }, /*#__PURE__*/React.createElement("h1", {
    style: rsSt.h1
  }, "\u7EC3\u4E60\u7ED3\u679C"), /*#__PURE__*/React.createElement("span", {
    style: rsSt.sub
  }, p.title, " \xB7 ", p.zh), /*#__PURE__*/React.createElement("div", {
    style: rsSt.top
  }, /*#__PURE__*/React.createElement("div", {
    style: rsSt.cell
  }, /*#__PURE__*/React.createElement("span", {
    style: rsSt.v
  }, acc, "%"), /*#__PURE__*/React.createElement("span", {
    style: rsSt.l
  }, "\u672C\u6B21\u6B63\u786E\u7387 \xB7 ", correct, "/", rows.length, " \u9898")), /*#__PURE__*/React.createElement("div", {
    style: rsSt.cell
  }, /*#__PURE__*/React.createElement("span", {
    style: rsSt.v
  }, mm, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "0.5em",
      fontWeight: "var(--fw-medium)"
    }
  }, " \u5206 "), ss, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "0.5em",
      fontWeight: "var(--fw-medium)"
    }
  }, " \u79D2")), /*#__PURE__*/React.createElement("span", {
    style: rsSt.l
  }, "\u7528\u65F6 ", mm, " \u5206 ", ss, " \u79D2")), /*#__PURE__*/React.createElement("div", {
    style: rsSt.cell
  }, /*#__PURE__*/React.createElement("span", {
    style: rsSt.v
  }, wrong), /*#__PURE__*/React.createElement("span", {
    style: rsSt.l
  }, "\u9519\u9898 \xB7 \u53EF\u52A0\u5165\u590D\u76D8\u961F\u5217"))), /*#__PURE__*/React.createElement("div", {
    style: rsSt.list
  }, rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.n,
    style: {
      ...rsSt.row,
      borderBottom: i === rows.length - 1 ? "none" : rsSt.row.borderBottom
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: rsSt.n
  }, r.n), /*#__PURE__*/React.createElement("span", {
    style: {
      color: r.ok ? "var(--green-600)" : "var(--red-600)",
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: r.ok ? "check" : "x",
    size: 16,
    strokeWidth: 2.5
  })), /*#__PURE__*/React.createElement("span", {
    style: rsSt.stem
  }, r.stem), /*#__PURE__*/React.createElement("span", {
    style: rsSt.ans
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: r.ok ? "var(--text-body)" : "var(--red-600)"
    }
  }, "\u6211\u7684 ", r.mine ? r.mine : "未作答"), r.ok ? null : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 12,
    style: {
      color: "var(--n-400)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--green-700)"
    }
  }, Array.isArray(r.answer) ? r.answer.join(" · ") : r.answer)))))), /*#__PURE__*/React.createElement("div", {
    style: rsSt.foot
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: onBank
  }, "\u8FD4\u56DE\u9898\u5E93"), /*#__PURE__*/React.createElement(Button, {
    size: wrong ? "lg" : "md",
    onClick: onReview,
    iconRight: "arrow-right"
  }, "\u67E5\u770B\u590D\u76D8")));
}
Object.assign(window, {
  ResultScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/ResultScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/SpeakingScreen.jsx
try { (() => {
const {
  Button,
  Icon,
  Badge,
  Tag,
  Card,
  IconButton,
  Checkbox,
  Tabs
} = window.STAGEDesignSystem_0f9c53;
const spSt = {
  page: {
    padding: "clamp(20px,2.6vw,32px) clamp(20px,3.4vw,44px) 56px",
    display: "grid",
    gap: 18,
    maxWidth: 1160,
    alignContent: "start"
  },
  headRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap"
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h2)",
    letterSpacing: "var(--ls-heading)",
    lineHeight: 1.15,
    color: "var(--blue-950)",
    flex: 1
  },
  io: {
    display: "inline-flex",
    gap: 2,
    alignItems: "center"
  },
  steps: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    borderBottom: "1px solid var(--border-hairline)",
    overflowX: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none"
  },
  step: (on, done, clickable) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "0 clamp(7px,1vw,16px) 13px",
    marginBottom: -1,
    border: "none",
    background: "transparent",
    fontFamily: "var(--font-text)",
    whiteSpace: "nowrap",
    borderBottom: "2px solid " + (on ? "var(--action-primary)" : "transparent"),
    color: on ? "var(--text-strong)" : done ? "var(--blue-700)" : "var(--text-subtle)",
    fontSize: "var(--fs-xs)",
    fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
    cursor: clickable ? "pointer" : "default"
  }),
  stepN: (on, done) => ({
    width: 18,
    height: 18,
    borderRadius: "var(--radius-pill)",
    display: "grid",
    placeItems: "center",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    flex: "none",
    background: done ? "var(--green-500)" : on ? "var(--action-primary)" : "var(--n-100)",
    color: done || on ? "#fff" : "var(--text-subtle)"
  }),
  arrow: {
    color: "var(--n-300)",
    padding: "0 0 13px",
    flex: "none",
    display: "grid"
  },
  dimGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
    gap: 12
  },
  dimHead: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  dimEn: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    fontWeight: "var(--fw-medium)",
    color: "var(--blue-700)"
  },
  dimZh: {
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--text-strong)"
  },
  ta: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 64,
    resize: "vertical",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 12px",
    fontFamily: "var(--font-text)",
    fontSize: "var(--fs-sm)",
    lineHeight: 1.6,
    color: "var(--text-strong)",
    outline: "none",
    background: "var(--surface-page)"
  },
  cols: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)",
    gap: 16,
    alignItems: "start"
  },
  frag: used => ({
    display: "flex",
    gap: 8,
    alignItems: "baseline",
    padding: "9px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid " + (used ? "var(--border-hairline)" : "var(--border-default)"),
    background: used ? "var(--surface-sunken)" : "var(--surface-page)",
    cursor: used ? "default" : "pointer",
    opacity: used ? 0.55 : 1,
    fontSize: "var(--fs-sm)",
    lineHeight: 1.5
  }),
  draftItem: {
    display: "flex",
    gap: 8,
    alignItems: "baseline",
    padding: "8px 10px",
    borderRadius: "var(--radius-sm)",
    background: "var(--surface-accent-soft)",
    border: "1px solid var(--border-accent)",
    fontSize: "var(--fs-sm)",
    lineHeight: 1.5
  },
  connItem: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "var(--radius-pill)",
    background: "var(--gold-50)",
    border: "1px solid var(--gold-200)",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    color: "var(--gold-700)",
    justifySelf: "start"
  },
  foot: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    paddingTop: 6
  },
  skel: {
    fontSize: "var(--fs-h4)",
    lineHeight: 2,
    color: "var(--text-strong)",
    fontWeight: "var(--fw-regular)"
  }
};
const spSteps = ["题目", "个人想法", "答案构建", "记忆巩固", "独立表达"];
const keyWordCount = 2;
function SpeakingScreen({
  onDone
}) {
  const dims = window.SP_DIMS;
  const [step, setStep] = React.useState(0);
  const [part, setPart] = React.useState("Part 2");
  const [topic, setTopic] = React.useState(null);
  const [ideas, setIdeas] = React.useState(window.SP_SEED.ideas);
  const [draft, setDraft] = React.useState([]); // {kind:'frag',dim,text} | {kind:'conn',text}
  const [hideLevel, setHideLevel] = React.useState("淡化");
  const [hints, setHints] = React.useState(true);
  const [checks, setChecks] = React.useState({});
  const fileRef = React.useRef(null);
  const filled = dims.filter(([en]) => (ideas[en] || "").trim());
  const usedFrag = en => draft.some(d => d.kind === "frag" && d.dim === en);
  const maxStep = topic ? draft.length ? 4 : 2 : 0;
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({
      topic,
      ideas,
      draft
    }, null, 2)], {
      type: "application/json"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ielts-lab-speaking.json";
    a.click();
  };
  const importJson = e => {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then(t => {
      try {
        const j = JSON.parse(t);
        if (j.ideas) setIdeas(j.ideas);
        if (j.draft) setDraft(j.draft);
        if (j.topic) setTopic(j.topic);
      } catch (err) {}
    });
  };
  const topicObj = topic ? Object.values(window.SP_TOPICS).flat().find(t => t.id === topic) : null;
  const Skeleton = () => /*#__PURE__*/React.createElement("p", {
    style: spSt.skel
  }, draft.map((d, i) => {
    if (d.kind === "conn") return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        color: "var(--gold-700)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-body)",
        padding: "0 6px"
      }
    }, d.text);
    const words = d.text.split(" ");
    const head = words.slice(0, keyWordCount).join(" ");
    const rest = words.slice(keyWordCount).join(" ");
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        paddingRight: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: "var(--fw-semibold)"
      }
    }, head), " ", hideLevel === "淡化" ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--n-300)"
      }
    }, rest) : hideLevel === "隐藏" ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: "transparent",
        borderBottom: "1px dashed var(--n-300)"
      }
    }, rest) : null);
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: spSt.page
  }, /*#__PURE__*/React.createElement("div", {
    style: spSt.headRow
  }, /*#__PURE__*/React.createElement("h1", {
    style: spSt.h1
  }, "Speaking"), /*#__PURE__*/React.createElement("span", {
    style: spSt.io
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "download",
    label: "\u5BFC\u51FA\u6570\u636E\uFF08JSON\uFF09",
    size: "sm",
    onClick: exportJson
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "upload",
    label: "\u5BFC\u5165\u6570\u636E\uFF08JSON\uFF09",
    size: "sm",
    onClick: () => fileRef.current && fileRef.current.click()
  }), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: ".json",
    onChange: importJson,
    style: {
      display: "none"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: spSt.steps
  }, spSteps.map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: s
  }, i ? /*#__PURE__*/React.createElement("span", {
    style: spSt.arrow
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14
  })) : null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: spSt.step(step === i, i < step, i <= maxStep),
    onClick: () => i <= maxStep && setStep(i)
  }, /*#__PURE__*/React.createElement("span", {
    style: spSt.stepN(step === i, i < step)
  }, i < step ? "✓" : i + 1), s)))), step === 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 260
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    variant: "pill",
    items: Object.keys(window.SP_TOPICS),
    value: part,
    onChange: setPart
  })), /*#__PURE__*/React.createElement("div", {
    style: spSt.dimGrid
  }, window.SP_TOPICS[part].map(t => /*#__PURE__*/React.createElement(Card, {
    key: t.id,
    interactive: true,
    padding: 18,
    onClick: () => {
      setTopic(t.id);
      setStep(1);
    },
    style: {
      display: "grid",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-strong)",
      lineHeight: 1.5
    }
  }, t.en), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, t.zh), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--blue-700)",
      marginTop: 4
    }
  }, "\u9009\u62E9\u6B64\u9898 \u2192"))))) : null, step >= 1 && topicObj ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "baseline",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "brand"
  }, Object.keys(window.SP_TOPICS).find(p => window.SP_TOPICS[p].some(t => t.id === topic))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-strong)"
    }
  }, topicObj.en), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, topicObj.zh), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)",
      display: "inline-flex",
      gap: 5,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 12,
    strokeWidth: 2.5
  }), "\u5DF2\u81EA\u52A8\u4FDD\u5B58")) : null, step === 1 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: spSt.dimGrid
  }, dims.map(([en, zh]) => {
    const done = (ideas[en] || "").trim();
    return /*#__PURE__*/React.createElement(Card, {
      key: en,
      padding: 16,
      style: {
        display: "grid",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: spSt.dimHead
    }, /*#__PURE__*/React.createElement("span", {
      style: spSt.dimEn
    }, en), /*#__PURE__*/React.createElement("span", {
      style: spSt.dimZh
    }, zh), done ? /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "auto",
        color: "var(--green-600)",
        display: "grid"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 15,
      strokeWidth: 2.5
    })) : null), /*#__PURE__*/React.createElement("textarea", {
      style: spSt.ta,
      placeholder: "\u5199\u4E0B\u4F60\u81EA\u5DF1\u7684\u60F3\u6CD5\u7247\u6BB5\u2026",
      value: ideas[en] || "",
      onChange: e => setIdeas({
        ...ideas,
        [en]: e.target.value
      })
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: spSt.foot
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: () => setStep(2),
    disabled: filled.length === 0
  }, "\u8FDB\u5165\u7B54\u6848\u6784\u5EFA"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, "\u5DF2\u586B ", filled.length, " / 9 \u4E2A\u7EF4\u5EA6"))) : null, step === 2 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: spSt.cols
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10,
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      letterSpacing: "var(--ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--text-subtle)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "\u6211\u7684\u60F3\u6CD5\u7247\u6BB5 \xB7 \u70B9\u51FB\u52A0\u5165\u53F3\u680F"), filled.map(([en, zh]) => /*#__PURE__*/React.createElement("div", {
    key: en,
    style: spSt.frag(usedFrag(en)),
    draggable: !usedFrag(en),
    onDragStart: e => e.dataTransfer.setData("text/plain", en),
    onClick: () => !usedFrag(en) && setDraft([...draft, {
      kind: "frag",
      dim: en,
      text: ideas[en]
    }])
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...spSt.dimEn,
      flex: "none"
    }
  }, en), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-body)"
    }
  }, ideas[en]), !usedFrag(en) ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      color: "var(--blue-700)",
      display: "grid",
      alignSelf: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 14
  })) : null)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      letterSpacing: "var(--ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--text-subtle)",
      fontWeight: "var(--fw-semibold)",
      marginTop: 8
    }
  }, "\u8FDE\u63A5\u8BCD"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, window.SP_CONNECTORS.map(c => /*#__PURE__*/React.createElement(Tag, {
    key: c,
    onClick: () => setDraft([...draft, {
      kind: "conn",
      text: c
    }]),
    style: {
      height: 28,
      fontSize: "var(--fs-2xs)",
      padding: "0 10px",
      fontFamily: "var(--font-mono)"
    }
  }, c)))), /*#__PURE__*/React.createElement(Card, {
    padding: 16,
    style: {
      display: "grid",
      gap: 8,
      alignContent: "start",
      minHeight: 280
    },
    onDragOver: e => e.preventDefault(),
    onDrop: e => {
      e.preventDefault();
      const en = e.dataTransfer.getData("text/plain");
      if (en && ideas[en] && !usedFrag(en)) setDraft([...draft, {
        kind: "frag",
        dim: en,
        text: ideas[en]
      }]);
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      letterSpacing: "var(--ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--text-subtle)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "\u7B54\u6848\u8349\u7A3F \xB7 \u53EA\u80FD\u7531\u5DE6\u680F\u7247\u6BB5\u7EC4\u7EC7\u800C\u6210"), draft.length === 0 ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-subtle)",
      padding: "24px 0",
      textAlign: "center"
    }
  }, "\u4ECE\u5DE6\u680F\u70B9\u9009\u6216\u62D6\u5165\u7247\u6BB5\u4E0E\u8FDE\u63A5\u8BCD\uFF0C\u6309\u4F60\u8981\u8BF4\u7684\u987A\u5E8F\u62FC\u88C5\u3002") : draft.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: d.kind === "conn" ? spSt.connItem : spSt.draftItem
  }, d.kind === "frag" ? /*#__PURE__*/React.createElement("span", {
    style: {
      ...spSt.dimEn,
      flex: "none"
    }
  }, d.dim) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, d.text), /*#__PURE__*/React.createElement("span", {
    style: {
      cursor: "pointer",
      color: "var(--text-subtle)",
      display: "grid",
      alignSelf: "center"
    },
    onClick: () => setDraft(draft.filter((_, j) => j !== i))
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 13
  })))))), /*#__PURE__*/React.createElement("div", {
    style: spSt.foot
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: () => setStep(3),
    disabled: draft.filter(d => d.kind === "frag").length === 0
  }, "\u8FDB\u5165\u8BB0\u5FC6\u5DE9\u56FA"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, "\u6CA1\u6709 AI \u751F\u6210\u2014\u2014\u7B54\u6848\u53EA\u6765\u81EA\u4F60\u81EA\u5DF1\u7684\u7247\u6BB5\u3002"))) : null, step === 3 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, "\u9690\u85CF\u7A0B\u5EA6\uFF1A"), ["全文", "淡化", "隐藏", "仅连接词"].map(l => /*#__PURE__*/React.createElement(Tag, {
    key: l,
    selected: hideLevel === l,
    onClick: () => setHideLevel(l),
    style: {
      height: 30,
      whiteSpace: "nowrap"
    }
  }, l))), /*#__PURE__*/React.createElement(Card, {
    padding: 26
  }, hideLevel === "仅连接词" ? /*#__PURE__*/React.createElement("p", {
    style: spSt.skel
  }, draft.map((d, i) => d.kind === "conn" ? /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      color: "var(--gold-700)",
      fontFamily: "var(--font-mono)",
      padding: "0 6px"
    }
  }, d.text) : /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      color: "transparent",
      borderBottom: "1px dashed var(--n-300)",
      marginRight: 8
    }
  }, d.text))) : hideLevel === "全文" ? /*#__PURE__*/React.createElement("p", {
    style: spSt.skel
  }, draft.map((d, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      paddingRight: 8,
      color: d.kind === "conn" ? "var(--gold-700)" : "var(--text-strong)",
      fontFamily: d.kind === "conn" ? "var(--font-mono)" : "inherit"
    }
  }, d.text))) : /*#__PURE__*/React.createElement(Skeleton, null)), /*#__PURE__*/React.createElement("div", {
    style: spSt.foot
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: () => setStep(4)
  }, "\u8FDB\u5165\u72EC\u7ACB\u8868\u8FBE"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, "\u8FDE\u63A5\u8BCD\u4E0E\u4F60\u7684\u6838\u5FC3\u8BCD\u4FDD\u7559\uFF0C\u5176\u4F59\u9010\u7EA7\u9690\u53BB\u3002"))) : null, step === 4 ? /*#__PURE__*/React.createElement(React.Fragment, null, hints ? /*#__PURE__*/React.createElement(Card, {
    padding: 16,
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-body)",
      flex: 1
    }
  }, draft.filter(d => d.kind === "frag").map(d => d.text.split(" ").slice(0, keyWordCount).join(" ")).join(" · ")), /*#__PURE__*/React.createElement(IconButton, {
    icon: "x",
    label: "\u5173\u95ED\u63D0\u793A",
    size: "sm",
    onClick: () => setHints(false)
  })) : null, /*#__PURE__*/React.createElement(Card, {
    padding: 20,
    style: {
      display: "grid",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-strong)"
    }
  }, "\u81EA\u67E5\u6E05\u5355 \xB7 \u6211\u7684\u8868\u8FBE\u8986\u76D6\u4E86\u54EA\u4E9B\u7EF4\u5EA6"), filled.map(([en, zh]) => /*#__PURE__*/React.createElement(Checkbox, {
    key: en,
    label: en + " " + zh,
    checked: !!checks[en],
    onChange: v => setChecks({
      ...checks,
      [en]: v
    })
  }))), /*#__PURE__*/React.createElement("div", {
    style: spSt.foot
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: () => onDone(topicObj)
  }, "\u5B8C\u6210\u72EC\u7ACB\u8868\u8FBE"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, "\u65E0\u5F55\u97F3\u3001\u65E0\u8BA1\u5206\u2014\u2014\u5B8C\u6210\u540E\u8BB0\u5F55\u4E00\u6B21\u300C\u72EC\u7ACB\u8868\u8FBE\u300D\u4E8B\u4EF6\u3002"))) : null);
}
Object.assign(window, {
  SpeakingScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/SpeakingScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/WritingScreen.jsx
try { (() => {
const {
  Button,
  Icon,
  IconButton,
  Badge,
  Card
} = window.STAGEDesignSystem_0f9c53;
const wsSt = {
  page: {
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    height: "100vh",
    minWidth: 0
  },
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px clamp(16px,2.4vw,28px)",
    borderBottom: "1px solid var(--border-hairline)",
    flexWrap: "wrap"
  },
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
    fontFamily: "var(--font-text)",
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-medium)",
    color: "var(--text-muted)"
  },
  title: {
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--text-strong)",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1
  },
  prog: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    color: "var(--text-muted)",
    whiteSpace: "nowrap"
  },
  timer: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-h4)",
    color: "var(--text-muted)",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: ".04em"
  },
  cols: hidden => ({
    display: "grid",
    gridTemplateColumns: hidden ? "1fr" : "minmax(0,1fr) minmax(0,1.05fr)",
    minHeight: 0
  }),
  left: {
    overflowY: "auto",
    padding: "20px clamp(18px,2.4vw,30px) 36px",
    borderRight: "1px solid var(--border-hairline)",
    display: "grid",
    gap: 16,
    alignContent: "start"
  },
  right: {
    overflowY: "auto",
    padding: "20px clamp(18px,2.4vw,30px) 36px",
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    gap: 12,
    minHeight: 0
  },
  eyebrow: {
    fontSize: "var(--fs-2xs)",
    letterSpacing: "var(--ls-eyebrow)",
    textTransform: "uppercase",
    color: "var(--text-subtle)",
    fontWeight: "var(--fw-semibold)"
  },
  prompt: {
    fontSize: "var(--fs-sm)",
    lineHeight: 1.85,
    color: "var(--text-body)",
    whiteSpace: "pre-line"
  },
  req: {
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--text-strong)"
  },
  ta: {
    width: "100%",
    height: "100%",
    minHeight: 240,
    boxSizing: "border-box",
    resize: "none",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-md)",
    padding: "16px 18px",
    fontFamily: "var(--font-text)",
    fontSize: "var(--fs-sm)",
    lineHeight: 1.9,
    color: "var(--text-strong)",
    outline: "none"
  },
  count: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    fontSize: "var(--fs-xs)",
    color: "var(--text-muted)",
    flexWrap: "wrap"
  },
  saved: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    marginLeft: "auto"
  },
  foot: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px clamp(16px,2.4vw,28px)",
    borderTop: "1px solid var(--border-hairline)",
    flexWrap: "wrap"
  },
  tab: on => ({
    padding: "8px 18px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    border: "1px solid " + (on ? "var(--action-primary)" : "var(--border-default)"),
    background: on ? "var(--surface-accent-soft)" : "var(--surface-page)",
    color: on ? "var(--blue-800)" : "var(--text-muted)",
    fontFamily: "var(--font-text)",
    fontSize: "var(--fs-sm)",
    fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
    whiteSpace: "nowrap",
    flex: "none"
  }),
  model: {
    display: "grid",
    gap: 10,
    padding: "16px 18px",
    background: "var(--surface-sunken)",
    borderRadius: "var(--radius-md)",
    marginTop: 4
  },
  modelText: {
    fontSize: "var(--fs-xs)",
    lineHeight: 1.9,
    color: "var(--text-body)",
    whiteSpace: "pre-line"
  }
};
const pad2 = n => String(n).padStart(2, "0");
const clock = s => pad2(Math.floor(s / 3600)) + ":" + pad2(Math.floor(s / 60) % 60) + ":" + pad2(s % 60);
const countWords = t => t.trim() ? t.trim().split(/\s+/).length : 0;
function ChartFigure({
  task
}) {
  if (!task.series) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        placeItems: "center",
        height: 168,
        border: "1px dashed var(--border-default)",
        borderRadius: "var(--radius-md)",
        color: "var(--text-subtle)",
        fontSize: "var(--fs-xs)",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "file-text",
      size: 20
    }), "\u672C\u9898\u4E3A\u6587\u5B57\u9898\u5E72\uFF0C\u65E0\u56FE\u8868");
  }
  /* viewBox 与实际渲染宽度接近 1:1，轴标签才不会被缩到 5px */
  const w = 252,
    h = 150,
    padL = 30,
    padB = 20,
    padT = 8,
    padR = 6;
  const x = i => padL + i * (w - padL - padR) / (task.xLabels.length - 1);
  const y = v => padT + (1 - v / 60) * (h - padT - padB);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-md)",
      padding: 14,
      display: "grid",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 " + w + " " + h,
    preserveAspectRatio: "xMidYMid meet",
    style: {
      width: "100%",
      maxWidth: w,
      height: "auto",
      display: "block",
      margin: "0 auto"
    }
  }, [0, 20, 40, 60].map(g => /*#__PURE__*/React.createElement("g", {
    key: g
  }, /*#__PURE__*/React.createElement("line", {
    x1: padL,
    x2: w - padR,
    y1: y(g),
    y2: y(g),
    stroke: "var(--n-100)",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("text", {
    x: padL - 6,
    y: y(g) + 4,
    textAnchor: "end",
    fontSize: "10",
    fill: "var(--n-500)",
    fontFamily: "IBM Plex Mono,monospace"
  }, g, "%"))), task.xLabels.map((l, i) => /*#__PURE__*/React.createElement("text", {
    key: l,
    x: x(i),
    y: h - 6,
    textAnchor: i === 0 ? "start" : i === task.xLabels.length - 1 ? "end" : "middle",
    fontSize: "10",
    fill: "var(--n-500)",
    fontFamily: "IBM Plex Mono,monospace"
  }, l)), task.series.map(s => /*#__PURE__*/React.createElement("g", {
    key: s.name
  }, /*#__PURE__*/React.createElement("polyline", {
    points: s.points.map((v, i) => x(i) + "," + y(v)).join(" "),
    fill: "none",
    stroke: s.color,
    strokeWidth: "2",
    strokeLinejoin: "round"
  }), s.points.map((v, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: x(i),
    cy: y(v),
    r: "2.5",
    fill: s.color
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
      fontSize: "var(--fs-2xs)",
      color: "var(--text-muted)"
    }
  }, task.series.map(s => /*#__PURE__*/React.createElement("span", {
    key: s.name,
    style: {
      display: "inline-flex",
      gap: 6,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 3,
      background: s.color,
      borderRadius: 2
    }
  }), s.name))));
}
function WritingScreen({
  taskId,
  onBack,
  onFinish
}) {
  const meta = window.WRITING_TASKS.find(t => t.id === taskId) || window.WRITING_TASKS[0];
  const session = window.WRITING_SESSION[taskId] || window.WRITING_SESSION.wt1;
  const [tab, setTab] = React.useState(0);
  const [drafts, setDrafts] = React.useState({
    0: "",
    1: ""
  });
  const [secs, setSecs] = React.useState(0);
  const [hidden, setHidden] = React.useState(false);
  /* 「先尝试、后解锁」：finished 为 true 前，范文在界面上完全不存在 */
  const [finished, setFinished] = React.useState(false);
  React.useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const task = session.tasks[tab];
  const words = countWords(drafts[tab] || "");
  const doneTasks = session.tasks.filter((_, i) => countWords(drafts[i] || "") > 0).length;
  const canFinish = doneTasks > 0;
  return /*#__PURE__*/React.createElement("div", {
    style: wsSt.page
  }, /*#__PURE__*/React.createElement("div", {
    style: wsSt.bar
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: wsSt.back,
    onClick: onBack
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 16,
    strokeWidth: 2
  }), "\u8FD4\u56DE\u4EFB\u52A1\u5217\u8868"), /*#__PURE__*/React.createElement("span", {
    style: wsSt.title
  }, meta.title), /*#__PURE__*/React.createElement("span", {
    style: wsSt.prog
  }, doneTasks, "/", session.tasks.length, " tasks"), /*#__PURE__*/React.createElement("span", {
    style: wsSt.timer
  }, clock(secs))), /*#__PURE__*/React.createElement("div", {
    style: wsSt.cols(hidden)
  }, hidden ? null : /*#__PURE__*/React.createElement("div", {
    style: wsSt.left
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: wsSt.eyebrow
  }, task.key, " \xB7 ", task.chartType), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    icon: "panel-left-close",
    onClick: () => setHidden(true)
  }, "Hide Task"))), /*#__PURE__*/React.createElement(ChartFigure, {
    task: task
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      ...wsSt.prompt,
      margin: 0
    }
  }, task.prompt), /*#__PURE__*/React.createElement("span", {
    style: wsSt.req
  }, task.requirement), finished ? /*#__PURE__*/React.createElement("div", {
    style: wsSt.model
  }, /*#__PURE__*/React.createElement("span", {
    style: wsSt.eyebrow
  }, "\u53C2\u8003\u8303\u6587 Model answer"), /*#__PURE__*/React.createElement("span", {
    style: wsSt.modelText
  }, task.model), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      color: "var(--text-subtle)"
    }
  }, "\u8303\u6587\u7528\u4E8E\u5BF9\u7167\u7ED3\u6784\u4E0E\u63AA\u8F9E\uFF0C\u4E0D\u4EE3\u8868\u552F\u4E00\u5199\u6CD5\uFF0C\u4E5F\u4E0D\u6784\u6210\u4EFB\u4F55\u8BC4\u5206\u3002")) : null), /*#__PURE__*/React.createElement("div", {
    style: wsSt.right
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: wsSt.eyebrow
  }, "\u5199\u4F5C\u533A \xB7 ", task.key), hidden ? /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    icon: "panel-left-open",
    onClick: () => setHidden(false)
  }, "Show Task") : null, /*#__PURE__*/React.createElement("span", {
    style: wsSt.saved
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 12,
    strokeWidth: 2.5
  }), "\u8349\u7A3F\u5DF2\u81EA\u52A8\u4FDD\u5B58")), /*#__PURE__*/React.createElement("textarea", {
    style: wsSt.ta,
    placeholder: "\u5728\u8FD9\u91CC\u8F93\u5165\u4F60\u7684\u7B54\u6848\u2026",
    value: drafts[tab],
    onChange: e => setDrafts({
      ...drafts,
      [tab]: e.target.value
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: wsSt.count
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)"
    }
  }, words, " / ", task.minWords, " words"), /*#__PURE__*/React.createElement("span", null, words >= task.minWords ? "已达到字数要求" : "还差 " + (task.minWords - words) + " 词达到字数要求")))), /*#__PURE__*/React.createElement("div", {
    style: wsSt.foot
  }, session.tasks.map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: t.key,
    type: "button",
    style: wsSt.tab(tab === i),
    onClick: () => setTab(i)
  }, t.key, countWords(drafts[i] || "") > 0 ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xs)",
      paddingLeft: 7,
      opacity: .7
    }
  }, countWords(drafts[i] || ""), "w") : null)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, finished ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, "\u53C2\u8003\u8303\u6587\u5DF2\u89E3\u9501") : null, /*#__PURE__*/React.createElement(Button, {
    disabled: !canFinish,
    title: canFinish ? undefined : "先写下你自己的答案",
    onClick: () => {
      setFinished(true);
      onFinish && onFinish({
        taskId,
        drafts,
        secs
      });
    }
  }, "\u5B8C\u6210\u672C\u6B21\u7EC3\u4E60"))));
}
Object.assign(window, {
  WritingScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/WritingScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/WritingTasks.jsx
try { (() => {
const {
  Button,
  Icon,
  Card,
  Badge,
  Tabs
} = window.STAGEDesignSystem_0f9c53;
const wtSt = {
  page: {
    padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px",
    display: "grid",
    gap: 18,
    maxWidth: 1100,
    alignContent: "start"
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h2)",
    letterSpacing: "var(--ls-heading)",
    lineHeight: 1.15,
    color: "var(--blue-950)"
  },
  sub: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-muted)",
    maxWidth: "56ch",
    lineHeight: 1.7
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(288px,1fr))",
    gap: 14
  },
  title: {
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--text-strong)",
    lineHeight: 1.55
  },
  zh: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)"
  },
  meta: {
    display: "flex",
    gap: 14,
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    flexWrap: "wrap"
  },
  /* 难度用中性蓝阶，不用红色 */
  diff: d => {
    const map = {
      "入门": ["var(--blue-50)", "var(--blue-700)", "var(--blue-100)"],
      "进阶": ["var(--n-100)", "var(--text-muted)", "var(--border-hairline)"],
      "挑战": ["var(--blue-800)", "var(--n-0)", "var(--blue-800)"]
    }[d];
    return {
      padding: "3px 10px",
      borderRadius: "var(--radius-pill)",
      background: map[0],
      color: map[1],
      border: "1px solid " + map[2],
      fontSize: "var(--fs-2xs)",
      fontWeight: "var(--fw-medium)",
      whiteSpace: "nowrap"
    };
  },
  strat: {
    display: "flex",
    gap: 9,
    padding: "11px 12px",
    background: "var(--gold-50)",
    border: "1px solid var(--gold-200)",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--fs-xs)",
    lineHeight: 1.7,
    color: "var(--text-body)"
  },
  pager: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    paddingTop: 6
  },
  pageBtn: on => ({
    minWidth: 32,
    height: 32,
    borderRadius: "var(--radius-xs)",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    border: "1px solid " + (on ? "var(--action-primary)" : "var(--border-default)"),
    background: on ? "var(--surface-accent-soft)" : "var(--surface-page)",
    color: on ? "var(--blue-800)" : "var(--text-muted)",
    padding: "0 8px"
  }),
  total: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    fontFamily: "var(--font-mono)",
    marginLeft: 8
  }
};
function WritingTasks({
  onStart
}) {
  const all = window.WRITING_TASKS;
  const [group, setGroup] = React.useState("全部");
  const [page, setPage] = React.useState(0);
  const perPage = 4;
  const rows = group === "全部" ? all : all.filter(t => t.group === group);
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const shown = rows.slice(page * perPage, page * perPage + perPage);
  React.useEffect(() => {
    setPage(0);
  }, [group]);
  return /*#__PURE__*/React.createElement("div", {
    style: wtSt.page
  }, /*#__PURE__*/React.createElement("h1", {
    style: wtSt.h1
  }, "IELTS Writing Practice"), /*#__PURE__*/React.createElement("p", {
    style: wtSt.sub
  }, "\u6309\u4EFB\u52A1\u7C7B\u578B\u7EC3\u4E60\u5C0F\u4F5C\u6587\u4E0E\u5927\u4F5C\u6587\u3002\u6BCF\u6B21\u7EC3\u4E60\u5305\u542B Task 1 \u4E0E Task 2\uFF0C\u53EF\u5728\u4E24\u8005\u4E4B\u95F4\u81EA\u7531\u5207\u6362\uFF0C\u5185\u5BB9\u4E92\u4E0D\u6E05\u7A7A\u3002"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 260
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    variant: "pill",
    items: ["全部", "Task 1", "Task 2"],
    value: group,
    onChange: setGroup
  })), /*#__PURE__*/React.createElement("div", {
    style: wtSt.grid
  }, shown.map(t => /*#__PURE__*/React.createElement(Card, {
    key: t.id,
    padding: 18,
    style: {
      display: "grid",
      gap: 12,
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "brand"
  }, t.group), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, t.chart), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: wtSt.diff(t.diff)
  }, t.diff))), /*#__PURE__*/React.createElement("span", {
    style: wtSt.title
  }, t.title), /*#__PURE__*/React.createElement("span", {
    style: wtSt.zh
  }, t.zh), /*#__PURE__*/React.createElement("span", {
    style: wtSt.meta
  }, /*#__PURE__*/React.createElement("span", null, "\u9884\u8BA1 ", t.minutes, " \u5206\u949F"), /*#__PURE__*/React.createElement("span", null, t.tasks, " tasks")), /*#__PURE__*/React.createElement("div", {
    style: wtSt.strat
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      paddingTop: 2,
      color: "var(--gold-700)",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lightbulb",
    size: 14
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "var(--fw-semibold)"
    }
  }, "\u7B56\u7565\u63D0\u793A \xB7 "), t.strategy)), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    onClick: () => onStart(t)
  }, "\u5F00\u59CB\u7EC3\u4E60")))), /*#__PURE__*/React.createElement("div", {
    style: wtSt.pager
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    disabled: page === 0,
    onClick: () => setPage(page - 1)
  }, "Previous"), Array.from({
    length: pages
  }).map((_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    type: "button",
    style: wtSt.pageBtn(i === page),
    onClick: () => setPage(i)
  }, i + 1)), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    disabled: page >= pages - 1,
    onClick: () => setPage(page + 1)
  }, "Next"), /*#__PURE__*/React.createElement("span", {
    style: wtSt.total
  }, "\u5171 ", rows.length, " \u9879")));
}
Object.assign(window, {
  WritingTasks
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/WritingTasks.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/lab-data.js
try { (() => {
/* IELTS Lab 示例数据。全部为原生指标：正确率 / 题量 / 覆盖度 / 时长 / 天数 — 永不投射为分数。 */
window.LAB_DATA = {
  continueItem: {
    title: "The Fascinating World of Mycorrhizal Networks",
    zh: "菌根网络的奇妙世界",
    skill: "Reading",
    part: "Passage 2",
    progress: "8 / 13 题"
  },
  retestDue: 6,
  metrics: [{
    label: "已练习题目",
    value: "412",
    note: "题"
  }, {
    label: "平均正确率",
    value: "68%",
    note: "近 30 天"
  }, {
    label: "学习时长",
    value: "42h",
    note: "累计"
  }, {
    label: "连续学习",
    value: "9",
    note: "天"
  }],
  modules: [{
    skill: "Reading",
    icon: "book-open",
    sub: "4 大题型",
    total: 223,
    unit: "篇",
    done: 2,
    lastAcc: "62%",
    facts: ["题库总量 223 篇", "频次分层筛选", "讲解按答题解锁"],
    actions: ["浏览题库", "随机练习"]
  }, {
    skill: "Listening",
    icon: "headphones",
    sub: "P1–P4",
    total: 186,
    unit: "段",
    done: 5,
    lastAcc: "74%",
    facts: ["题库总量 186 段", "原文证据复盘", "套题模式可选"],
    actions: ["浏览题库", "随机练习"]
  }, {
    skill: "Writing",
    icon: "pen-line",
    sub: "Task 1 & Task 2",
    total: 148,
    unit: "题",
    done: 3,
    lastAcc: "70%",
    facts: ["小作文按图型分类", "草稿自动保存", "范文按完成解锁"],
    actions: ["浏览题库", "随机练习"]
  }, {
    skill: "Speaking",
    icon: "messages-square",
    sub: "五步流程",
    total: 96,
    unit: "话题",
    done: 4,
    lastAcc: "80%",
    facts: ["九维度素材库", "个人故事构建", "可导出 / 导入"],
    actions: ["进入素材库", "继续构建"]
  }],
  /* 目标分数：用户自行填写的个人意愿记录，不是系统预测或计算结果。 */
  goals: {
    Reading: 7.0,
    Listening: 7.5,
    Writing: 6.5,
    Speaking: 6.5
  },
  onboarding: [{
    n: 1,
    title: "选科目",
    desc: "从 Reading、Listening、Writing、Speaking 中选择"
  }, {
    n: 2,
    title: "去练习",
    desc: "在真实节奏下完成一次练习"
  }, {
    n: 3,
    title: "复盘巩固",
    desc: "查看证据复盘，标记弱点，安排重测"
  }],
  recent: [{
    title: "Urban Farming in High-Density Cities",
    zh: "高密度城市中的都市农业",
    skill: "Reading",
    part: "Passage 1",
    date: "2026-07-27",
    mine: "77%",
    avg: "63%"
  }, {
    title: "Museum Membership Enquiry",
    zh: "博物馆会员咨询",
    skill: "Listening",
    part: "Section 1",
    date: "2026-07-26",
    mine: "90%",
    avg: "81%"
  }, {
    title: "The History of Glassmaking",
    zh: "玻璃制造的历史",
    skill: "Reading",
    part: "Passage 3",
    date: "2026-07-25",
    mine: "54%",
    avg: "49%"
  }, {
    title: "Describe a Skill You Learned Recently",
    zh: "描述你最近学会的一项技能",
    skill: "Speaking",
    part: "Part 2",
    date: "2026-07-24",
    mine: "80%",
    avg: "72%"
  }, {
    title: "Line Graph: Household Recycling Rates",
    zh: "折线图：家庭回收率",
    skill: "Writing",
    part: "Task 1",
    date: "2026-07-22",
    mine: "70%",
    avg: "66%"
  }]
};

/* ---------------- 批次二 ---------------- */
window.LAB_BANK = {
  Reading: {
    unit: "篇",
    parts: ["P1", "P2", "P3"],
    types: ["判断 T/F/NG", "匹配", "单选", "填空", "多选"],
    items: [{
      id: "r1",
      title: "The Fascinating World of Mycorrhizal Networks",
      zh: "菌根网络的奇妙世界",
      part: "P2",
      type: "判断 T/F/NG",
      freq: "高频",
      status: "已练习",
      mine: "62%",
      avg: "58%"
    }, {
      id: "r2",
      title: "Urban Farming in High-Density Cities",
      zh: "高密度城市中的都市农业",
      part: "P1",
      type: "填空",
      freq: "高频",
      status: "已练习",
      mine: "77%",
      avg: "63%"
    }, {
      id: "r3",
      title: "The History of Glassmaking",
      zh: "玻璃制造的历史",
      part: "P3",
      type: "匹配",
      freq: "次高频",
      status: "待重测",
      mine: "54%",
      avg: "49%"
    }, {
      id: "r4",
      title: "Whale Migration Patterns",
      zh: "鲸类迁徙模式",
      part: "P2",
      type: "单选",
      freq: "高频",
      status: "未练习",
      mine: null,
      avg: "61%"
    }, {
      id: "r5",
      title: "The Invention of the Postage Stamp",
      zh: "邮票的发明",
      part: "P1",
      type: "判断 T/F/NG",
      freq: "非高频",
      status: "未练习",
      mine: null,
      avg: "72%"
    }, {
      id: "r6",
      title: "Bioluminescence in Deep-Sea Creatures",
      zh: "深海生物的生物发光",
      part: "P3",
      type: "多选",
      freq: "次高频",
      status: "未练习",
      mine: null,
      avg: "47%"
    }, {
      id: "r7",
      title: "The Economics of Public Libraries",
      zh: "公共图书馆的经济学",
      part: "P2",
      type: "匹配",
      freq: "高频",
      status: "已练习",
      mine: "69%",
      avg: "60%"
    }, {
      id: "r8",
      title: "Ancient Roman Concrete",
      zh: "古罗马混凝土",
      part: "P3",
      type: "填空",
      freq: "非高频",
      status: "未练习",
      mine: null,
      avg: "55%"
    }]
  },
  Listening: {
    unit: "段",
    parts: ["P1", "P2", "P3", "P4"],
    types: ["填空", "单选", "多选", "匹配", "地图标注"],
    items: [{
      id: "l1",
      title: "Museum Membership Enquiry",
      zh: "博物馆会员咨询",
      part: "P1",
      type: "填空",
      freq: "高频",
      status: "已练习",
      mine: "90%",
      avg: "81%"
    }, {
      id: "l2",
      title: "Chamber Music History Lecture",
      zh: "室内乐历史讲座",
      part: "P4",
      type: "填空",
      freq: "高频",
      status: "待重测",
      mine: "60%",
      avg: "57%"
    }, {
      id: "l3",
      title: "Campus Orientation Tour",
      zh: "校园迎新导览",
      part: "P2",
      type: "地图标注",
      freq: "次高频",
      status: "未练习",
      mine: null,
      avg: "66%"
    }, {
      id: "l4",
      title: "Group Project on Renewable Energy",
      zh: "可再生能源小组课题",
      part: "P3",
      type: "单选",
      freq: "高频",
      status: "已练习",
      mine: "74%",
      avg: "62%"
    }, {
      id: "l5",
      title: "Booking a Holiday Cottage",
      zh: "预订度假小屋",
      part: "P1",
      type: "填空",
      freq: "高频",
      status: "未练习",
      mine: null,
      avg: "78%"
    }, {
      id: "l6",
      title: "Urban Beekeeping Talk",
      zh: "城市养蜂讲座",
      part: "P2",
      type: "多选",
      freq: "非高频",
      status: "未练习",
      mine: null,
      avg: "59%"
    }, {
      id: "l7",
      title: "Dissertation Supervision Meeting",
      zh: "论文指导会谈",
      part: "P3",
      type: "匹配",
      freq: "次高频",
      status: "未练习",
      mine: null,
      avg: "53%"
    }]
  },
  Writing: {
    unit: "题",
    task1Groups: [{
      name: "数据图",
      icon: "chart-line",
      count: 42
    }, {
      name: "流程图",
      icon: "workflow",
      count: 18
    }, {
      name: "地图",
      icon: "map",
      count: 14
    }, {
      name: "示意图",
      icon: "shapes",
      count: 9
    }],
    types: ["观点类", "讨论类", "利弊类", "双问类"],
    items: [{
      id: "w1",
      title: "Line Graph: Household Recycling Rates",
      zh: "折线图：家庭回收率",
      part: "Task 1",
      type: "数据图",
      freq: "高频",
      status: "已练习",
      mine: "70%",
      avg: "66%"
    }, {
      id: "w2",
      title: "Some people think music education should be compulsory…",
      zh: "音乐教育是否应为必修",
      part: "Task 2",
      type: "观点类",
      freq: "高频",
      status: "已练习",
      mine: "65%",
      avg: "58%"
    }, {
      id: "w3",
      title: "Advantages and disadvantages of studying abroad at 18",
      zh: "18 岁出国留学的利与弊",
      part: "Task 2",
      type: "利弊类",
      freq: "高频",
      status: "未练习",
      mine: null,
      avg: "61%"
    }, {
      id: "w4",
      title: "Discuss both views on funding the arts",
      zh: "讨论艺术资助的两种观点",
      part: "Task 2",
      type: "讨论类",
      freq: "次高频",
      status: "待重测",
      mine: "58%",
      avg: "54%"
    }, {
      id: "w5",
      title: "Should governments prioritise vocational training?",
      zh: "政府是否应优先职业培训",
      part: "Task 2",
      type: "双问类",
      freq: "非高频",
      status: "未练习",
      mine: null,
      avg: "52%"
    }]
  }
};
window.LAB_CAUSES = ["同义替换未识别", "定位句未找到", "题干限定词漏读", "数字与拼写记录错误", "转折信号词错过"];
window.LAB_REVIEW = {
  listening: {
    title: "Chamber Music History Lecture",
    zh: "室内乐历史讲座",
    skill: "Listening",
    part: "P4 · 填空",
    transcript: [{
      t: "02:20",
      text: "Good afternoon everyone. Today's lecture traces the development of European chamber music."
    }, {
      t: "02:28",
      text: "The lecture will begin with the origins of the string quartet,"
    }, {
      t: "02:41",
      text: "which scarcely any of the earlier chamber forms anticipated."
    }, {
      t: "02:47",
      text: "We will then move on to Haydn's contribution, often called the father of the quartet."
    }, {
      t: "02:55",
      text: "By the double anniversary year of 1809, the form had spread across the whole continent."
    }, {
      t: "03:04",
      text: "Publishers in Vienna printed no fewer than forty new quartet sets that decade."
    }, {
      t: "03:12",
      text: "The final section of today's talk looks at the quartet's decline in the concert hall."
    }],
    questions: [{
      q: "Q4",
      stem: "The string quartet developed from ____ earlier chamber forms.",
      my: "some",
      correct: "scarcely any",
      wrong: true,
      cue: 2
    }, {
      q: "Q5",
      stem: "Haydn is often called the ____ of the quartet.",
      my: "father",
      correct: "father",
      wrong: false,
      cue: 3
    }, {
      q: "Q6",
      stem: "By ____, the form had spread across the continent.",
      my: "1890",
      correct: "1809",
      wrong: true,
      cue: 4
    }, {
      q: "Q7",
      stem: "Vienna publishers printed ____ new quartet sets in that decade.",
      my: "40",
      correct: "40",
      wrong: false,
      cue: 5
    }]
  },
  reading: {
    title: "The History of Glassmaking",
    zh: "玻璃制造的历史",
    skill: "Reading",
    part: "P3 · 匹配",
    transcript: [{
      text: "Glassmaking began in Mesopotamia around 3500 BC, where artisans first produced glass beads as by-products of metalworking."
    }, {
      text: "For centuries the recipe remained a closely guarded secret, handed down within a small number of workshop families."
    }, {
      text: "It was the Roman invention of glassblowing, however, that transformed glass from a luxury into an everyday material."
    }, {
      text: "Hardly any workshops outside the empire could match the speed of the new technique."
    }, {
      text: "By the medieval period, Venetian glassmakers on the island of Murano dominated the European trade."
    }, {
      text: "Their monopoly was protected by law: craftsmen who left the island risked severe punishment."
    }],
    questions: [{
      q: "Q31",
      stem: "配对：玻璃吹制术的影响 → ",
      my: "C 使玻璃成为奢侈品",
      correct: "B 使玻璃成为日常材料",
      wrong: true,
      cue: 2
    }, {
      q: "Q32",
      stem: "配对：帝国之外的工坊 → ",
      my: "D 几乎无法匹敌新技术的速度",
      correct: "D 几乎无法匹敌新技术的速度",
      wrong: false,
      cue: 3
    }, {
      q: "Q33",
      stem: "配对：穆拉诺工匠 → ",
      my: "A 受法律保护的垄断",
      correct: "A 受法律保护的垄断",
      wrong: false,
      cue: 5
    }]
  }
};
window.LAB_QUEUE = [{
  id: "q1",
  title: "The History of Glassmaking",
  zh: "玻璃制造的历史",
  skill: "Reading",
  date: "2026-07-25",
  mine: "54%",
  causes: ["同义替换未识别", "定位句未找到"],
  due: "今天",
  retested: null,
  retest: "77%"
}, {
  id: "q2",
  title: "Chamber Music History Lecture",
  zh: "室内乐历史讲座",
  skill: "Listening",
  date: "2026-07-21",
  mine: "60%",
  causes: ["数字与拼写记录错误"],
  due: "今天",
  retested: null,
  retest: "85%"
}, {
  id: "q3",
  title: "Discuss both views on funding the arts",
  zh: "讨论艺术资助的两种观点",
  skill: "Writing",
  date: "2026-07-18",
  mine: "58%",
  causes: ["题干限定词漏读"],
  due: "3 天后",
  retested: null,
  retest: "71%"
}, {
  id: "q4",
  title: "Group Project on Renewable Energy",
  zh: "可再生能源小组课题",
  skill: "Listening",
  date: "2026-07-12",
  mine: "62%",
  causes: ["转折信号词错过"],
  due: "已完成",
  retested: "81%",
  retest: "81%"
}];
window.LAB_HISTORY = {
  summary: [{
    label: "总练习量",
    value: "412",
    note: "题"
  }, {
    label: "总时长",
    value: "42h",
    note: "累计"
  }, {
    label: "连续学习",
    value: "9",
    note: "天"
  }],
  series: {
    "全部": [52, 58, 55, 63, 61, 68, 72],
    Reading: [48, 55, 50, 60, 58, 62, 70],
    Listening: [60, 63, 62, 70, 68, 76, 78],
    Writing: [45, 52, 50, 58, 55, 62, 65],
    Speaking: [55, 60, 58, 64, 62, 70, 74]
  },
  seriesLabels: ["W24", "W25", "W26", "W27", "W28", "W29", "W30"],
  days: [{
    date: "2026-07-27",
    events: [{
      kind: "练习",
      icon: "book-open",
      title: "Urban Farming in High-Density Cities",
      meta: "Reading P1 · 正确率 77%（全体平均 63%）"
    }, {
      kind: "复盘",
      icon: "notebook-pen",
      title: "The History of Glassmaking",
      meta: "标注错因 2 项：同义替换未识别 · 定位句未找到"
    }]
  }, {
    date: "2026-07-26",
    events: [{
      kind: "练习",
      icon: "book-open",
      title: "Museum Membership Enquiry",
      meta: "Listening P1 · 正确率 90%（全体平均 81%）"
    }, {
      kind: "重测",
      icon: "rotate-ccw",
      title: "Group Project on Renewable Energy",
      meta: "Listening P3 · 上次 62% → 本次 81%"
    }]
  }, {
    date: "2026-07-25",
    events: [{
      kind: "练习",
      icon: "book-open",
      title: "The History of Glassmaking",
      meta: "Reading P3 · 正确率 54%（全体平均 49%）"
    }]
  }, {
    date: "2026-07-24",
    events: [{
      kind: "练习",
      icon: "book-open",
      title: "Describe a Skill You Learned Recently",
      meta: "Speaking Part 2 · 素材自测 80%"
    }, {
      kind: "复盘",
      icon: "notebook-pen",
      title: "Chamber Music History Lecture",
      meta: "标注错因 1 项：数字与拼写记录错误"
    }]
  }]
};

/* 题型说明：纯方法论，严禁混入真题内容或标准答案。 */
window.QUESTION_TYPES = {
  Reading: [{
    en: "True / False / Not Given",
    zh: "判断题",
    count: 68,
    desc: "给你一句陈述，判断它与原文说法一致、矛盾，还是原文根本没提。难点在于区分「矛盾」与「没提」——原文没写的推断都算 Not Given。"
  }, {
    en: "Matching Headings",
    zh: "标题匹配",
    count: 41,
    desc: "为每个段落挑一个最能概括它的小标题。要抓段落主旨，而不是段落里出现过的某个细节。"
  }, {
    en: "Multiple Choice",
    zh: "单选 / 多选",
    count: 57,
    desc: "从若干选项里选出符合原文的一项或几项。题干里的限定词（only、mainly、first）往往决定对错。"
  }, {
    en: "Sentence Completion",
    zh: "句子填空",
    count: 39,
    desc: "用原文中的词把句子补完整。注意字数上限，超一个词也算错，通常要照抄原词不做改写。"
  }, {
    en: "Matching Information",
    zh: "信息匹配",
    count: 18,
    desc: "把一条信息定位到它出现在哪一段。信息可能分散在几段里，要找的是完整表达该信息的那一段。"
  }],
  Listening: [{
    en: "Form / Note Completion",
    zh: "表单填空",
    count: 64,
    desc: "边听边把表单或笔记里的空补上。数字、拼写、单复数是主要失分点，听到 double / triple 要立刻写成两位。"
  }, {
    en: "Multiple Choice",
    zh: "多选题",
    count: 33,
    desc: "从选项中选出录音提到的若干项。录音常先说一个再否定它，最终答案往往在转折词之后。"
  }, {
    en: "Map / Plan Labelling",
    zh: "地图标注",
    count: 22,
    desc: "根据录音里的方位描述在图上定位。提前读图、记住入口与参照物，跟着 opposite / past / next to 走。"
  }, {
    en: "Matching",
    zh: "匹配题",
    count: 29,
    desc: "把人物、时间或选项与对应内容配对。选项数量通常多于题目，多出来的是干扰项。"
  }, {
    en: "Short Answer",
    zh: "简答题",
    count: 17,
    desc: "用不超过规定词数回答问题。答案基本是原文原词，不需要自己组织语言。"
  }],
  Writing: [{
    en: "Task 1 · Data Chart",
    zh: "小作文 · 数据图",
    count: 42,
    desc: "描述折线、柱状、饼图或表格里的主要趋势。先写总体特征，再分组比较，不逐个数据罗列。"
  }, {
    en: "Task 1 · Process",
    zh: "小作文 · 流程图",
    count: 18,
    desc: "描述一个过程的各个阶段。数清阶段数、统一时态与被动语态，按顺序推进不跳步。"
  }, {
    en: "Task 1 · Map",
    zh: "小作文 · 地图",
    count: 14,
    desc: "描述同一地点在不同时期的变化。按方位分区，先说消失的、再说新增的、最后说保留的。"
  }, {
    en: "Task 2 · Opinion",
    zh: "大作文 · 观点类",
    count: 31,
    desc: "对一个说法表明你的立场并论证。每个主体段按「主张 → 原因 → 具体例子 → 回扣题目」展开。"
  }, {
    en: "Task 2 · Discussion",
    zh: "大作文 · 讨论类",
    count: 26,
    desc: "讨论两种观点并给出自己的看法。两方各占一段，自己的立场必须单独交代，不能只写一边。"
  }],
  Speaking: [{
    en: "Part 1 · Interview",
    zh: "第一部分 · 日常问答",
    count: 38,
    desc: "关于你自己、家乡、爱好的简短问答。答案不必长，但要给出一点具体内容，避免只答一句话。"
  }, {
    en: "Part 2 · Long Turn",
    zh: "第二部分 · 个人陈述",
    count: 34,
    desc: "按题卡提示连续讲一到两分钟。先用九维度准备素材，讲的时候按自己搭好的顺序推进。"
  }, {
    en: "Part 3 · Discussion",
    zh: "第三部分 · 深入讨论",
    count: 24,
    desc: "就 Part 2 的话题作抽象讨论。需要给理由、举例子、做对比，而不是只表态。"
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/lab-data.js", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/listening-data.js
try { (() => {
/* Listening 做题示例数据。原生题型：表单填空 / 多选 / 地图标注 / 匹配。
   transcript 属于交卷后的证据复盘内容，做题界面不得读取。 */
window.LISTENING = {
  l1: {
    id: "l1",
    code: "L-2401",
    part: 1,
    freq: "高频",
    duration: 355,
    title: "Museum Membership Enquiry",
    zh: "博物馆会员咨询",
    /* 表单填空：还原真实试卷的表单结构，不抽象成通用问答样式 */
    form: {
      heading: "Museum Membership Application Form",
      note: "Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.",
      rows: [{
        label: "Name",
        value: "Helena ____",
        n: 1,
        answer: "Whitlock"
      }, {
        label: "Address",
        value: "____ Bridgeworth Road",
        n: 2,
        answer: "48"
      }, {
        label: "Postcode",
        value: "BS____",
        n: 3,
        answer: "7QN"
      }, {
        label: "Membership type",
        value: "____ membership",
        n: 4,
        answer: "family"
      }, {
        label: "Annual fee",
        value: "£____",
        n: 5,
        answer: "72"
      }]
    },
    questions: [{
      n: 1,
      type: "表单填空",
      stem: "Name: Helena ____",
      answer: "Whitlock",
      zh: "姓名：Helena ____",
      cue: "01:12",
      explain: "录音中拼读 W-H-I-T-L-O-C-K，逐字母记录即可。"
    }, {
      n: 2,
      type: "表单填空",
      stem: "Address: ____ Bridgeworth Road",
      answer: "48",
      zh: "地址：____ Bridgeworth Road",
      cue: "01:31",
      explain: "录音说 forty-eight，先写数字再核对。"
    }, {
      n: 3,
      type: "表单填空",
      stem: "Postcode: BS____",
      answer: "7QN",
      zh: "邮编：BS____",
      cue: "01:44",
      explain: "邮编按字母数字混合记录，注意 Q 与 U 的读音区分。"
    }, {
      n: 4,
      type: "表单填空",
      stem: "Membership type: ____ membership",
      answer: "family",
      zh: "会员类型：____ 会员",
      cue: "02:08",
      explain: "录音先提到 individual 后被否定，最终确定 family。"
    }, {
      n: 5,
      type: "表单填空",
      stem: "Annual fee: £____",
      answer: "72",
      zh: "年费：£____",
      cue: "02:26",
      explain: "录音说 seventy-two pounds，注意与 £27 的混淆。"
    }, {
      n: 6,
      type: "多选",
      stem: "Which TWO facilities are free for members?",
      options: ["A the rooftop café", "B the audio guide", "C the members' lounge", "D evening lectures", "E the car park"],
      answer: ["B the audio guide", "C the members' lounge"],
      multi: 2,
      zh: "哪两项设施对会员免费？",
      cue: "03:05",
      explain: "录音明确 audio guide 与 members' lounge 免费；café 打折但非免费。"
    }, {
      n: 7,
      type: "地图标注",
      stem: "Where is the members' entrance? (choose A–E on the map)",
      options: ["A", "B", "C", "D", "E"],
      answer: "C",
      zh: "会员入口位于地图上的哪个位置？",
      cue: "03:52",
      explain: "录音以 opposite the ticket desk, just past the staircase 定位到 C。"
    }, {
      n: 8,
      type: "匹配",
      stem: "Match the exhibition to its floor: Glassmaking →",
      options: ["Ground floor", "First floor", "Second floor"],
      answer: "Second floor",
      zh: "将展览与楼层匹配：玻璃制造 →",
      cue: "04:30",
      explain: "录音说 right at the top, on the second floor。"
    }]
  }
};

/* 套题模式：随机组成 P1–P4，优先安排没做过的题。 */
window.LISTENING_SETS = {
  current: {
    id: "set-0729",
    started: "2026-07-29 20:14",
    parts: [{
      part: 1,
      freq: "高频",
      title: "Museum Membership Enquiry",
      id: "l1",
      done: 5,
      total: 8
    }, {
      part: 2,
      freq: "次高频",
      title: "Campus Orientation Tour",
      id: "l3",
      done: 0,
      total: 10
    }, {
      part: 3,
      freq: "高频",
      title: "Group Project on Renewable Energy",
      id: "l4",
      done: 0,
      total: 10
    }, {
      part: 4,
      freq: "高频",
      title: "Chamber Music History Lecture",
      id: "l2",
      done: 0,
      total: 10
    }]
  },
  history: [{
    id: "s3",
    when: "2026-07-29 20:14",
    state: "进行中",
    count: 5,
    parts: [{
      part: 1,
      done: 5,
      total: 8
    }, {
      part: 2,
      done: 0,
      total: 10,
      pending: true
    }, {
      part: 3,
      done: 0,
      total: 10
    }, {
      part: 4,
      done: 0,
      total: 10
    }]
  }, {
    id: "s2",
    when: "2026-07-26 09:38",
    state: "已完成",
    count: 38,
    parts: [{
      part: 1,
      done: 8,
      total: 8
    }, {
      part: 2,
      done: 10,
      total: 10
    }, {
      part: 3,
      done: 10,
      total: 10
    }, {
      part: 4,
      done: 10,
      total: 10
    }]
  }, {
    id: "s1",
    when: "2026-07-21 21:02",
    state: "已完成",
    count: 36,
    parts: [{
      part: 1,
      done: 8,
      total: 8
    }, {
      part: 2,
      done: 9,
      total: 10
    }, {
      part: 3,
      done: 10,
      total: 10
    }, {
      part: 4,
      done: 9,
      total: 10
    }]
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/listening-data.js", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/practice-data.js
try { (() => {
/* Reading 做题界面示例数据。讲解内容仅在该题已作答后才允许展示（见 PracticeScreen 的解锁逻辑）。 */
window.PRACTICE = {
  r1: {
    id: "r1",
    skill: "Reading",
    part: 2,
    freq: "高频",
    title: "The Fascinating World of Mycorrhizal Networks",
    zh: "菌根网络的奇妙世界",
    instruction: "You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 2 below.",
    paragraphs: [{
      tag: "A",
      en: "Beneath almost every forest floor lies a network so dense and so old that biologists have taken to calling it the wood wide web. Fungal threads, each a fraction of the width of a human hair, wrap themselves around and inside the roots of trees, forming a partnership known as a mycorrhiza.",
      zh: "几乎每一片森林的地表之下，都存在着一张极其密集而古老的网络，生物学家称之为「树联网」。真菌菌丝的直径不足人类头发的几分之一，它们缠绕在树木根系的表面与内部，形成被称为菌根的共生关系。"
    }, {
      tag: "B",
      en: "The arrangement is one of exchange rather than charity. Trees, which can photosynthesise, supply the fungus with sugars. The fungus, whose threads reach into soil pores far too narrow for a root, returns phosphorus, nitrogen and water. Neither partner could achieve alone what the pair achieves together.",
      zh: "这种安排是交换而非施舍。能够进行光合作用的树木向真菌提供糖类；菌丝可以伸入根系无法进入的细小土壤孔隙，因而回馈磷、氮与水分。任何一方单独都无法达成双方共同实现的成果。"
    }, {
      tag: "C",
      en: "What surprised researchers was the scale of the connection. Suzanne Simard's experiments in British Columbia demonstrated that carbon could move from one tree to another through the fungal network — and that it moved preferentially towards seedlings growing in shade. Scarcely any of the earlier models of forest competition had anticipated such transfers.",
      zh: "令研究者意外的是这种连接的规模。Suzanne Simard 在不列颠哥伦比亚省的实验证明，碳可以通过真菌网络在树木之间移动，并且会优先流向生长在阴影中的幼苗。此前几乎没有任何森林竞争模型预见到这类物质转移。"
    }, {
      tag: "D",
      en: "Not every biologist accepts the more expansive interpretations. Critics point out that laboratory conditions differ sharply from a living forest, and that a fungus moving carbon may simply be managing its own supply rather than nursing a seedling. The debate has sharpened the questions rather than settled them.",
      zh: "并非所有生物学家都接受更为宽泛的解读。批评者指出，实验室条件与真实森林差异显著；真菌转移碳，也可能只是在调配自身的供给，而非照料幼苗。这场争论使问题更加尖锐，而非得到解决。"
    }, {
      tag: "E",
      en: "Practical consequences follow either way. Forestry operations that remove all mature trees destroy the network's hubs, and replanted seedlings establish more slowly as a result. Several Canadian provinces now require that a proportion of older trees be retained during harvesting.",
      zh: "无论如何，现实影响都随之而来。清除全部成熟树木的林业作业会摧毁网络的枢纽节点，重新栽种的幼苗因此更难立足。加拿大的若干省份现已要求在采伐时保留一定比例的老龄树木。"
    }],
    questions: [{
      n: 1,
      type: "T/F/NG",
      stem: "Mycorrhizal fungi are visible to the naked eye as individual threads.",
      options: ["TRUE", "FALSE", "NOT GIVEN"],
      answer: "FALSE",
      zh: "菌根真菌的单根菌丝以肉眼可见。",
      ref: "A",
      explain: "A 段说明单根菌丝的直径不足人类头发的几分之一（a fraction of the width of a human hair），因此单根菌丝并非肉眼可见。"
    }, {
      n: 2,
      type: "T/F/NG",
      stem: "The tree receives more benefit from the partnership than the fungus does.",
      options: ["TRUE", "FALSE", "NOT GIVEN"],
      answer: "NOT GIVEN",
      zh: "树木从这一共生关系中获得的益处多于真菌。",
      ref: "B",
      explain: "B 段只说明双方各自提供与获得什么，并称任何一方单独都无法达成共同成果，没有比较双方获益的多少。"
    }, {
      n: 3,
      type: "填空",
      stem: "The fungus supplies the tree with phosphorus, nitrogen and ____.",
      answer: "water",
      zh: "真菌向树木提供磷、氮和 ____。",
      ref: "B",
      explain: "B 段原文：returns phosphorus, nitrogen and water。答案照抄原词 water。"
    }, {
      n: 4,
      type: "单选",
      stem: "According to Simard's experiments, carbon moved preferentially towards",
      options: ["A the tallest trees in the plot", "B seedlings growing in shade", "C fungi with the longest threads", "D trees of a different species"],
      answer: "B seedlings growing in shade",
      zh: "根据 Simard 的实验，碳优先流向哪一类对象？",
      ref: "C",
      explain: "C 段原文：it moved preferentially towards seedlings growing in shade。其余选项原文未提及。"
    }, {
      n: 5,
      type: "T/F/NG",
      stem: "Earlier models of forest competition predicted this kind of carbon transfer.",
      options: ["TRUE", "FALSE", "NOT GIVEN"],
      answer: "FALSE",
      zh: "早期的森林竞争模型曾预见到这类碳转移。",
      ref: "C",
      explain: "C 段用 Scarcely any ... had anticipated（几乎没有任何模型预见到）表达否定。scarcely any 属于否定量词，需与题干的 predicted 判为矛盾。"
    }, {
      n: 6,
      type: "匹配",
      stem: "Which paragraph mentions a legal or regulatory requirement?",
      options: ["A", "B", "C", "D", "E"],
      answer: "E",
      zh: "哪一段提到了法律或法规层面的要求？",
      ref: "E",
      explain: "E 段：Several Canadian provinces now require that a proportion of older trees be retained（若干省份现已要求保留一定比例老龄树木）。"
    }, {
      n: 7,
      type: "T/F/NG",
      stem: "All biologists agree with the wider interpretations of the research.",
      options: ["TRUE", "FALSE", "NOT GIVEN"],
      answer: "FALSE",
      zh: "所有生物学家都认同这项研究的更宽泛解读。",
      ref: "D",
      explain: "D 段首句 Not every biologist accepts...，与题干的 All ... agree 直接矛盾。"
    }, {
      n: 8,
      type: "填空",
      stem: "Removing all mature trees destroys the network's ____.",
      answer: "hubs",
      zh: "清除全部成熟树木会摧毁网络的 ____。",
      ref: "E",
      explain: "E 段原文：destroy the network's hubs。答案照抄原词 hubs。"
    }]
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/practice-data.js", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/speaking-data.js
try { (() => {
window.SP_DIMS = [["WHAT", "是什么"], ["WHO", "谁"], ["WHEN", "何时"], ["WHERE", "何地"], ["WHY", "为何"], ["MEMORY", "记忆"], ["FEELING", "感受"], ["CHANGE_OVER_TIME", "变化"], ["COMPARISON", "对比"]];
window.SP_TOPICS = {
  "Part 1": [{
    id: "p1a",
    en: "Do you play a musical instrument?",
    zh: "你演奏乐器吗？"
  }, {
    id: "p1b",
    en: "How do you usually practise?",
    zh: "你通常怎么练习？"
  }, {
    id: "p1c",
    en: "What music did you listen to as a child?",
    zh: "你小时候听什么音乐？"
  }],
  "Part 2": [{
    id: "p2a",
    en: "Describe a skill you learned recently",
    zh: "描述你最近学会的一项技能"
  }, {
    id: "p2b",
    en: "Describe a performance you watched",
    zh: "描述你看过的一场演出"
  }, {
    id: "p2c",
    en: "Describe a place where you like to study",
    zh: "描述一个你喜欢学习的地方"
  }],
  "Part 3": [{
    id: "p3a",
    en: "Why do people learn instruments as adults?",
    zh: "为什么成年人学乐器？"
  }, {
    id: "p3b",
    en: "Is live music better than recorded music?",
    zh: "现场音乐比录制音乐更好吗？"
  }]
};
window.SP_CONNECTORS = ["because", "however", "for example", "after that", "which means", "compared with"];
/* 预填示例：演示 traceability —— 草稿只能由左栏片段与连接词组成 */
window.SP_SEED = {
  topic: "p2a",
  ideas: {
    WHAT: "learning to accompany singers on the piano",
    WHO: "my chamber music teacher pushed me to try",
    WHEN: "over the past three months",
    WHY: "solo practice felt isolating",
    FEELING: "nervous at first, then surprisingly calm",
    COMPARISON: "very different from playing alone"
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/speaking-data.js", error: String((e && e.message) || e) }); }

// ui_kits/ielts_lab/writing-data.js
try { (() => {
/* Writing 示例数据。model（参考范文）仅在用户点击「完成本次练习」后才允许读取——
   「先尝试、后解锁答案/范文」为全 Lab 统一规则。 */
window.WRITING_TASKS = [{
  id: "wt1",
  group: "Task 1",
  diff: "入门",
  minutes: 20,
  tasks: 2,
  chart: "数据图",
  title: "Line graph: household recycling rates in three cities, 2005–2020",
  zh: "折线图：三座城市 2005–2020 年的家庭回收率",
  strategy: "比较不同类别的波动模式：先锁定起点、终点与转折点，再决定分段方式。"
}, {
  id: "wt2",
  group: "Task 1",
  diff: "进阶",
  minutes: 20,
  tasks: 2,
  chart: "流程图",
  title: "Process diagram: how recycled glass is produced",
  zh: "流程图：回收玻璃的生产过程",
  strategy: "流程题先数清阶段数，再统一时态与被动语态，避免中途换主语。"
}, {
  id: "wt3",
  group: "Task 1",
  diff: "挑战",
  minutes: 20,
  tasks: 2,
  chart: "地图",
  title: "Maps: changes to a coastal town between 1990 and today",
  zh: "地图：某沿海小镇 1990 年至今的变化",
  strategy: "地图题按方位分区描述，先说消失的、再说新增的，最后说保留不变的。"
}, {
  id: "wt4",
  group: "Task 2",
  diff: "入门",
  minutes: 40,
  tasks: 2,
  chart: "观点类",
  title: "Some people think music education should be compulsory in all schools.",
  zh: "有人认为音乐教育应在所有学校成为必修课。",
  strategy: "观点类先明确立场，再用「主张 → 原因 → 具体例子 → 回扣题目」组织每个主体段。"
}, {
  id: "wt5",
  group: "Task 2",
  diff: "进阶",
  minutes: 40,
  tasks: 2,
  chart: "讨论类",
  title: "Discuss both views on public funding for the arts.",
  zh: "讨论关于艺术公共资助的两种观点。",
  strategy: "讨论类必须两方各占一段并给出自己的立场段，避免只写一边。"
}, {
  id: "wt6",
  group: "Task 2",
  diff: "挑战",
  minutes: 40,
  tasks: 2,
  chart: "双问类",
  title: "Should governments prioritise vocational training over university education?",
  zh: "政府是否应将职业培训置于大学教育之前？",
  strategy: "双问类逐问对应段落，先回答问题本身，再展开理由，不要合并作答。"
}];
window.WRITING_SESSION = {
  wt1: {
    tasks: [{
      key: "Task 1",
      minWords: 150,
      prompt: "The graph below shows the percentage of household waste recycled in three cities between 2005 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
      chartType: "数据图",
      requirement: "Write at least 150 words.",
      series: [{
        name: "Ashford",
        color: "var(--blue-600)",
        points: [18, 26, 34, 41]
      }, {
        name: "Brentwood",
        color: "var(--gold-600)",
        points: [30, 33, 31, 38]
      }, {
        name: "Calbury",
        color: "var(--n-500)",
        points: [12, 20, 33, 52]
      }],
      xLabels: ["2005", "2010", "2015", "2020"],
      model: "The line graph compares the proportion of domestic waste recycled in Ashford, Brentwood and Calbury over a fifteen-year period.\n\nOverall, all three cities recycled a greater share of their waste by 2020 than in 2005, with Calbury showing by far the steepest rise, overtaking both of the others in the final five years.\n\nIn 2005 Brentwood led at 30%, roughly two-thirds higher than Ashford and more than double Calbury's 12%. Brentwood's figure then stagnated, dipping slightly to 31% in 2015 before recovering to 38%. Ashford climbed steadily throughout, adding roughly eight percentage points in each interval to finish at 41%. Calbury, by contrast, accelerated sharply after 2010 and reached 52% by 2020."
    }, {
      key: "Task 2",
      minWords: 250,
      prompt: "Some people believe that music education should be compulsory in all schools, while others argue that limited school hours are better spent on core academic subjects.\n\nDiscuss both these views and give your own opinion.",
      chartType: "讨论类",
      requirement: "Write at least 250 words.",
      model: "Whether every pupil should study music is a question about what schools are for, not simply about timetabling.\n\nThose who defend compulsory music education point to effects that reach beyond the subject itself. Learning an instrument requires sustained, unglamorous practice, and pupils who acquire that habit at ten often carry it into other work…（示例范文节选）"
    }]
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ielts_lab/writing-data.js", error: String((e && e.message) || e) }); }

// ui_kits/marketing/ConversionSection.jsx
try { (() => {
const {
  Button,
  Eyebrow,
  Icon
} = window.STAGEDesignSystem_0f9c53;
const convStyles = {
  sec: {
    background: "var(--surface-tint)",
    borderTop: "1px solid var(--border-hairline)",
    padding: "var(--section-y) 0"
  },
  inner: {
    display: "grid",
    gap: 20,
    justifyItems: "center",
    textAlign: "center"
  },
  h2: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-d2)",
    lineHeight: "var(--lh-display)",
    letterSpacing: "var(--ls-display)",
    color: "var(--blue-950)"
  },
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
    paddingTop: 4
  },
  trust: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: "var(--fs-sm)",
    color: "var(--verified-fg)",
    fontWeight: "var(--fw-medium)"
  }
};
function ConversionSection() {
  return /*#__PURE__*/React.createElement("section", {
    id: "pricing",
    style: convStyles.sec
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    style: convStyles.inner
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u5F00\u59CB\u4F7F\u7528"), /*#__PURE__*/React.createElement("h2", {
    style: convStyles.h2
  }, "\u627E\u5230\u9002\u5408\u4F60\u7684\u5B66\u6821", /*#__PURE__*/React.createElement("br", null), "\u4E5F\u51C6\u5907\u597D\u4F60\u7684 IELTS"), /*#__PURE__*/React.createElement("div", {
    style: convStyles.actions
  }, /*#__PURE__*/React.createElement("a", {
    href: "schools.html",
    style: {
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg"
  }, "\u63A2\u7D22\u97F3\u4E50\u9662\u6821 \u2192")), /*#__PURE__*/React.createElement("a", {
    href: "../ielts_lab/index.html",
    style: {
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "secondary"
  }, "\u4F53\u9A8C IELTS Lab"))), /*#__PURE__*/React.createElement("span", {
    style: convStyles.trust
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 15,
    strokeWidth: 3
  }), "\u6BCF\u4E00\u6761\u62DB\u751F\u8981\u6C42\uFF0C\u5747\u53EF\u8FFD\u6EAF\u81F3\u5B98\u65B9\u4FE1\u606F\u6E90\u3002"))));
}
Object.assign(window, {
  ConversionSection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/ConversionSection.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Hero.jsx
try { (() => {
const {
  Button,
  Badge,
  Icon
} = window.STAGEDesignSystem_0f9c53;
const {
  SchoolDetailShot,
  LabPopCard
} = window;
const heroStyles = {
  section: {
    background: "var(--ambient-sky)",
    paddingTop: "clamp(52px,8vw,104px)",
    paddingBottom: 0,
    position: "relative",
    overflow: "hidden"
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: "linear-gradient(90deg,rgba(19,58,148,.045) 1px,transparent 1px),linear-gradient(180deg,rgba(19,58,148,.045) 1px,transparent 1px)",
    backgroundSize: "96px 96px",
    pointerEvents: "none"
  },
  head: {
    position: "relative",
    display: "grid",
    gap: 20,
    justifyItems: "center",
    textAlign: "center"
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 14px",
    background: "var(--surface-glass)",
    border: "1px solid var(--border-accent)",
    borderRadius: "var(--radius-pill)",
    fontSize: "var(--fs-xs)",
    fontWeight: "var(--fw-medium)",
    color: "var(--blue-800)",
    letterSpacing: ".04em",
    whiteSpace: "nowrap"
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-hero)",
    lineHeight: "var(--lh-tight)",
    letterSpacing: "var(--ls-mega)",
    color: "var(--blue-950)"
  },
  lead: {
    margin: 0,
    maxWidth: "40ch",
    fontSize: "var(--fs-lead)",
    lineHeight: 1.7,
    color: "var(--text-muted)"
  },
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
    paddingTop: 6
  },
  trust: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: "var(--fs-sm)",
    color: "var(--verified-fg)",
    fontWeight: "var(--fw-medium)"
  },
  stage: {
    position: "relative",
    marginTop: "clamp(40px,6vw,72px)",
    paddingBottom: "clamp(24px,4vw,48px)"
  },
  shotWrap: {
    position: "relative",
    maxWidth: 720,
    margin: "0 auto"
  },
  pop: {
    position: "absolute",
    right: -18,
    bottom: -26,
    zIndex: 2
  },
  popNarrow: {
    position: "relative",
    margin: "16px auto 0",
    zIndex: 2
  }
};
function Hero() {
  const [wide, setWide] = React.useState(typeof window !== "undefined" ? window.innerWidth >= 880 : true);
  React.useEffect(() => {
    const on = () => setWide(window.innerWidth >= 880);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return /*#__PURE__*/React.createElement("section", {
    id: "top",
    style: heroStyles.section
  }, /*#__PURE__*/React.createElement("div", {
    style: heroStyles.grid
  }), /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rise",
    style: heroStyles.head
  }, /*#__PURE__*/React.createElement("span", {
    style: heroStyles.badge
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkle",
    size: 13,
    strokeWidth: 2
  }), "\u97F3\u4E50\u7533\u8BF7 \xD7 IELTS \u51C6\u5907"), /*#__PURE__*/React.createElement("h1", {
    style: heroStyles.h1
  }, "\u627E\u5230\u9002\u5408\u4F60\u7684\u5B66\u6821", /*#__PURE__*/React.createElement("br", null), "\u51C6\u5907\u597D\u4F60\u7684 IELTS"), /*#__PURE__*/React.createElement("p", {
    style: heroStyles.lead
  }, "\u4ECE\u9662\u6821\u7B5B\u9009\u3001\u9879\u76EE\u8981\u6C42\uFF0C\u5230\u6709\u636E\u53EF\u5FAA\u7684 IELTS \u590D\u76D8\u8BAD\u7EC3\uFF0CSTAGE \u5E2E\u97F3\u4E50\u5B66\u751F\u628A\u590D\u6742\u7684\u7533\u8BF7\u51C6\u5907\uFF0C\u53D8\u6210\u4E00\u6761\u66F4\u6E05\u6670\u7684\u8DEF\u5F84\u3002"), /*#__PURE__*/React.createElement("div", {
    style: heroStyles.actions
  }, /*#__PURE__*/React.createElement("a", {
    href: "schools.html",
    style: {
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg"
  }, "\u63A2\u7D22\u97F3\u4E50\u9662\u6821 \u2192")), /*#__PURE__*/React.createElement("a", {
    href: "../ielts_lab/index.html",
    style: {
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "secondary"
  }, "\u4F53\u9A8C IELTS Lab"))), /*#__PURE__*/React.createElement("span", {
    style: heroStyles.trust
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 15,
    strokeWidth: 3
  }), "\u6BCF\u4E00\u6761\u62DB\u751F\u8981\u6C42\uFF0C\u5747\u53EF\u8FFD\u6EAF\u81F3\u5B98\u65B9\u4FE1\u606F\u6E90\u3002")), /*#__PURE__*/React.createElement("div", {
    style: heroStyles.stage
  }, /*#__PURE__*/React.createElement("div", {
    style: heroStyles.shotWrap
  }, /*#__PURE__*/React.createElement(SchoolDetailShot, null), /*#__PURE__*/React.createElement(LabPopCard, {
    style: wide ? heroStyles.pop : heroStyles.popNarrow
  })))));
}
Object.assign(window, {
  Hero
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/LabSection.jsx
try { (() => {
const {
  Eyebrow,
  Button,
  Icon
} = window.STAGEDesignSystem_0f9c53;
const {
  LabListeningShot
} = window;
const labStyles = {
  sec: {
    background: "var(--surface-tint)",
    borderTop: "1px solid var(--border-hairline)",
    borderBottom: "1px solid var(--border-hairline)",
    padding: "var(--section-y) 0"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
    gap: "clamp(40px,5vw,72px)",
    alignItems: "center"
  },
  copy: {
    display: "grid",
    gap: 20,
    alignContent: "start"
  },
  h2: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-d2)",
    lineHeight: "var(--lh-display)",
    letterSpacing: "var(--ls-display)",
    color: "var(--blue-950)"
  },
  p: {
    margin: 0,
    fontSize: "var(--fs-body)",
    lineHeight: 1.8,
    color: "var(--text-muted)",
    maxWidth: "44ch"
  },
  mods: {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    background: "var(--surface-card)"
  },
  mod: {
    padding: "18px 18px",
    display: "grid",
    gap: 6,
    borderLeft: "1px solid var(--border-hairline)",
    borderTop: "1px solid var(--border-hairline)"
  },
  mn: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-h4)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    color: "var(--text-strong)"
  },
  md: {
    fontSize: "var(--fs-xs)",
    lineHeight: 1.7,
    color: "var(--text-subtle)"
  }
};
const modules = [["Reading", "错因归类到题干与原文的对应关系"], ["Listening", "错题定位到时间戳与原文句子"], ["Writing", "逐段记录论点缺口与修改动作"], ["Speaking", "记录结构中断处与替换表达"]];
function LabSection() {
  return /*#__PURE__*/React.createElement("section", {
    id: "lab",
    style: labStyles.sec
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    style: labStyles.grid
  }, /*#__PURE__*/React.createElement(LabListeningShot, null), /*#__PURE__*/React.createElement("div", {
    style: labStyles.copy
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: "accent"
  }, "IELTS Lab"), /*#__PURE__*/React.createElement("h2", {
    style: labStyles.h2
  }, "\u6211\u4EEC\u4E0D\u505A AI \u8003\u5B98\uFF0C", /*#__PURE__*/React.createElement("br", null), "\u4E0D\u505A\u5206\u6570\u9884\u6D4B\u3002"), /*#__PURE__*/React.createElement("p", {
    style: labStyles.p
  }, "\u6211\u4EEC\u505A\u7684\u662F\u6709\u636E\u53EF\u5FAA\u7684\u590D\u76D8\u2014\u2014\u6BCF\u4E00\u9053\u9519\u9898\u90FD\u80FD\u5B9A\u4F4D\u5230\u539F\u6587\u8BC1\u636E\uFF0C\u6BCF\u4E00\u6B21\u7EC3\u4E60\u90FD\u6C89\u6DC0\u4E3A\u4F60\u7684\u5F31\u70B9\u6863\u6848\u4E0E\u63D0\u5347\u8F68\u8FF9\u3002"), /*#__PURE__*/React.createElement("div", {
    style: labStyles.mods
  }, modules.map(([n, d], i) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      ...labStyles.mod,
      borderLeft: i % 2 === 0 ? "none" : labStyles.mod.borderLeft,
      borderTop: i < 2 ? "none" : labStyles.mod.borderTop
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: labStyles.mn
  }, n), /*#__PURE__*/React.createElement("span", {
    style: labStyles.md
  }, d)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("a", {
    href: "../ielts_lab/index.html",
    style: {
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconRight: "arrow-right"
  }, "\u4F53\u9A8C IELTS Lab")))))));
}
Object.assign(window, {
  LabSection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/LabSection.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/PersonasSection.jsx
try { (() => {
const {
  SectionHeader,
  Icon
} = window.STAGEDesignSystem_0f9c53;
const personaStyles = {
  sec: {
    padding: "var(--section-y) 0"
  },
  grid: {
    marginTop: "clamp(40px,5vw,64px)",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden"
  },
  col: {
    padding: "clamp(24px,3vw,36px)",
    display: "grid",
    gap: 14,
    alignContent: "start",
    borderLeft: "1px solid var(--border-hairline)"
  },
  role: {
    fontSize: "var(--fs-2xs)",
    letterSpacing: "var(--ls-eyebrow)",
    textTransform: "uppercase",
    color: "var(--text-subtle)",
    fontWeight: "var(--fw-semibold)"
  },
  line: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-h3)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    lineHeight: 1.35,
    color: "var(--blue-950)"
  }
};
const personas = [{
  role: "学生",
  icon: "music",
  line: "查清曲目要求，别练错方向"
}, {
  role: "家长",
  icon: "receipt-text",
  line: "看懂每一笔费用和每一个截止日期"
}, {
  role: "顾问",
  icon: "share-2",
  line: "可追溯的数据，敢直接发给客户"
}];
function PersonasSection() {
  return /*#__PURE__*/React.createElement("section", {
    id: "guides",
    style: personaStyles.sec
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "\u8C01\u5728\u7528 STAGE",
    title: "\u4E09\u79CD\u4EBA\uFF0C\u4E09\u79CD\u7528\u6CD5\u3002",
    subtitle: "\u540C\u4E00\u4EFD\u53EF\u8FFD\u6EAF\u7684\u6570\u636E\uFF0C\u56DE\u7B54\u4E09\u7C7B\u5B8C\u5168\u4E0D\u540C\u7684\u95EE\u9898\u3002"
  }), /*#__PURE__*/React.createElement("div", {
    style: personaStyles.grid
  }, personas.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: p.role,
    style: {
      ...personaStyles.col,
      borderLeft: i === 0 ? "none" : personaStyles.col.borderLeft
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--blue-700)",
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: p.icon,
    size: 22
  })), /*#__PURE__*/React.createElement("span", {
    style: personaStyles.role
  }, p.role), /*#__PURE__*/React.createElement("p", {
    style: personaStyles.line
  }, p.line))))));
}
Object.assign(window, {
  PersonasSection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/PersonasSection.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/SchoolCards.jsx
try { (() => {
const {
  Card,
  Badge,
  Icon,
  IconButton,
  Button,
  Select,
  Tabs,
  VerifiedBadge
} = window.STAGEDesignSystem_0f9c53;
const scStyles = {
  head: {
    display: "flex",
    gap: 14,
    alignItems: "center",
    flexWrap: "wrap"
  },
  count: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-body)",
    fontWeight: "var(--fw-medium)"
  },
  right: {
    marginLeft: "auto",
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap"
  },
  strip: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "10px 14px",
    border: "1px solid var(--border-accent)",
    borderRadius: "var(--radius-md)",
    background: "var(--surface-accent-soft)",
    fontSize: "var(--fs-xs)",
    color: "var(--blue-800)",
    lineHeight: 1.5
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(380px,1fr))",
    gap: 16
  },
  titleRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start"
  },
  en: {
    fontSize: "var(--fs-h4)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    color: "var(--text-strong)",
    lineHeight: 1.3
  },
  zh: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    marginTop: 3
  },
  matchRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 12
  },
  chipBlue: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    borderRadius: "var(--radius-pill)",
    background: "var(--surface-accent-soft)",
    border: "1px solid var(--border-accent)",
    color: "var(--blue-800)",
    fontSize: "var(--fs-xs)",
    fontWeight: "var(--fw-medium)",
    whiteSpace: "nowrap"
  },
  chipGray: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "var(--radius-pill)",
    background: "var(--surface-sunken)",
    border: "1px solid var(--border-hairline)",
    color: "var(--text-muted)",
    fontSize: "var(--fs-xs)",
    whiteSpace: "nowrap"
  },
  keyRow: {
    display: "flex",
    gap: 18,
    flexWrap: "wrap",
    marginTop: 14
  },
  key: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: "var(--fs-xs)",
    color: "var(--text-body)"
  },
  keyIcon: {
    color: "var(--text-subtle)",
    display: "grid"
  },
  mono: {
    fontFamily: "var(--font-mono)"
  },
  ops: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid var(--border-hairline)"
  },
  view: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--blue-700)"
  },
  progRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 130px 110px 120px",
    gap: 14,
    padding: "13px 16px",
    borderBottom: "1px solid var(--border-hairline)",
    alignItems: "center",
    fontSize: "var(--fs-sm)"
  }
};
function KeyItem({
  icon,
  children,
  mono
}) {
  if (children == null) return null;
  return /*#__PURE__*/React.createElement("span", {
    style: scStyles.key
  }, /*#__PURE__*/React.createElement("span", {
    style: scStyles.keyIcon
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 14
  })), /*#__PURE__*/React.createElement("span", {
    style: mono ? scStyles.mono : null
  }, children));
}

/* 学费显示规则：tuitionValue===0 → 全奖学金制；tuition==null（且非 0）→ 整行隐藏 */
function tuitionLabel(s) {
  if (s.tuitionValue === 0) return "全奖学金制";
  return s.tuition;
}
function SchoolCard({
  s,
  matched,
  compare,
  onCompare,
  saved,
  onSave
}) {
  const rest = s.majors.length - (matched ? matched.length : 0);
  const tuition = tuitionLabel(s);
  return /*#__PURE__*/React.createElement(Card, {
    padding: 22,
    style: {
      display: "grid",
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: scStyles.titleRow
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: scStyles.en
  }, s.en), /*#__PURE__*/React.createElement("div", {
    style: scStyles.zh
  }, s.zh ? s.zh + " · " : "", s.city)), s.verified ? /*#__PURE__*/React.createElement(VerifiedBadge, {
    date: s.verified,
    size: "sm"
  }) : null), /*#__PURE__*/React.createElement("div", {
    style: scStyles.matchRow
  }, matched && matched.length ? /*#__PURE__*/React.createElement(React.Fragment, null, matched.map(m => /*#__PURE__*/React.createElement("span", {
    key: m.name,
    style: scStyles.chipBlue
  }, m.name.split(" ")[0], " ", m.degrees.join(" · "))), rest > 0 ? /*#__PURE__*/React.createElement("span", {
    style: scStyles.chipGray
  }, "\u53E6\u6709 ", rest, " \u4E2A\u4E13\u4E1A") : null) : /*#__PURE__*/React.createElement("span", {
    style: scStyles.chipGray
  }, "\u5171 ", s.majors.length, " \u4E2A\u4E13\u4E1A")), /*#__PURE__*/React.createElement("div", {
    style: scStyles.keyRow
  }, s.deadline ? /*#__PURE__*/React.createElement(KeyItem, {
    icon: "calendar",
    mono: true
  }, s.deadline) : null, tuition ? /*#__PURE__*/React.createElement(KeyItem, {
    icon: "wallet"
  }, tuition) : null, s.lang ? /*#__PURE__*/React.createElement(KeyItem, {
    icon: "languages",
    mono: true
  }, s.lang) : null), /*#__PURE__*/React.createElement("div", {
    style: scStyles.ops
  }, /*#__PURE__*/React.createElement("a", {
    href: "#school-detail",
    style: scStyles.view
  }, "\u67E5\u770B\u9662\u6821 \u2192"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: compare ? "primary" : "secondary",
    onClick: onCompare
  }, "\u52A0\u5165\u5BF9\u6BD4"), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bookmark",
    label: "\u6536\u85CF",
    active: saved,
    onClick: onSave
  }))));
}
function ProgramRows({
  rows
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...scStyles.progRow,
      background: "var(--surface-sunken)",
      fontSize: "var(--fs-2xs)",
      letterSpacing: "var(--ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--text-subtle)",
      fontWeight: "var(--fw-semibold)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u9662\u6821"), /*#__PURE__*/React.createElement("span", null, "\u9879\u76EE"), /*#__PURE__*/React.createElement("span", null, "\u7533\u8BF7\u622A\u6B62"), /*#__PURE__*/React.createElement("span", null, "\u8BED\u8A00\u8981\u6C42"), /*#__PURE__*/React.createElement("span", null)), rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.key,
    style: {
      ...scStyles.progRow,
      borderBottom: i === rows.length - 1 ? "none" : scStyles.progRow.borderBottom
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-strong)",
      fontSize: "var(--fs-sm)"
    }
  }, r.school.en), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      color: "var(--text-subtle)"
    }
  }, r.school.zh ? r.school.zh + " · " : "", r.school.city)), /*#__PURE__*/React.createElement("span", null, r.major.name.split(" ")[0], " ", /*#__PURE__*/React.createElement("span", {
    style: {
      ...scStyles.mono,
      fontSize: "var(--fs-xs)",
      color: "var(--text-muted)"
    }
  }, r.degree)), /*#__PURE__*/React.createElement("span", {
    style: {
      ...scStyles.mono,
      fontSize: "var(--fs-xs)"
    }
  }, r.school.deadline || ""), /*#__PURE__*/React.createElement("span", {
    style: {
      ...scStyles.mono,
      fontSize: "var(--fs-xs)"
    }
  }, r.school.lang || ""), /*#__PURE__*/React.createElement("a", {
    href: "#school-detail",
    style: {
      ...scStyles.view,
      fontSize: "var(--fs-xs)",
      justifySelf: "end"
    }
  }, "\u67E5\u770B\u9662\u6821 \u2192"))));
}
function GuideStrip({
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: scStyles.strip
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      color: "var(--blue-700)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user-round",
    size: 15
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "\u5EFA\u7ACB\u6863\u6848\u540E\uFF0C\u6BCF\u4E2A\u9879\u76EE\u90FD\u4F1A\u663E\u793A\u5B83\u4E0E\u4F60\u7684\u5DEE\u8DDD\u2014\u2014\u8BED\u8A00\u3001\u65F6\u95F4\u3001\u6750\u6599\u548C\u9884\u7B97\u3002"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary"
  }, "2 \u5206\u949F\u5EFA\u7ACB\u6863\u6848"), /*#__PURE__*/React.createElement(IconButton, {
    icon: "x",
    label: "\u5173\u95ED",
    size: "sm",
    onClick: onClose
  }));
}
Object.assign(window, {
  SchoolCard,
  ProgramRows,
  GuideStrip,
  tuitionLabel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/SchoolCards.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/SchoolsData.js
try { (() => {
/* 示例数据：字段结构即真实数据模型。verified=null → 不显示任何徽章；
   tuition=null / deadline=null / lang=null → 该行整行不渲染；tuitionValue=0 → 显示「全奖学金制」。 */
window.MAJOR_FAMILIES = [{
  name: "键盘",
  majors: ["钢琴 Piano", "管风琴 Organ", "羽管键琴 Harpsichord", "协作钢琴 Collaborative Piano"]
}, {
  name: "弦乐",
  majors: ["小提琴 Violin", "中提琴 Viola", "大提琴 Cello", "低音提琴 Double Bass", "竖琴 Harp", "吉他 Guitar"]
}, {
  name: "管乐与打击乐",
  majors: ["长笛 Flute", "双簧管 Oboe", "单簧管 Clarinet", "巴松 Bassoon", "萨克斯 Saxophone", "圆号 Horn", "小号 Trumpet", "长号 Trombone", "大号 Tuba", "打击乐 Percussion"]
}, {
  name: "声乐",
  majors: ["声乐 Voice", "歌剧研究 Opera Studies", "音乐剧 Musical Theatre", "声乐艺术 Vocal Arts"]
}, {
  name: "指挥与作曲",
  majors: ["乐队指挥", "合唱指挥", "管乐指挥", "作曲 Composition", "影视配乐", "爵士（各方向）"]
}, {
  name: "学术研究",
  majors: ["音乐学 Musicology", "音乐理论 Music Theory", "音乐史 Music History", "音乐教育 Music Education", "早期音乐 Early Music", "历史表演 Historical Performance", "音乐科技"]
}];
window.SCHOOL_LIST = [{
  id: "juilliard",
  en: "The Juilliard School",
  zh: "茱莉亚学院",
  city: "纽约，美国",
  country: "美国",
  verified: "2026-06",
  deadline: "2026-12-01",
  tuition: "$55,500 / 年",
  tuitionValue: 55500,
  lang: "IELTS 7.0",
  majors: [{
    name: "钢琴 Piano",
    degrees: ["MM", "DMA"]
  }, {
    name: "小提琴 Violin",
    degrees: ["BM", "MM"]
  }, {
    name: "声乐 Voice",
    degrees: ["MM"]
  }, {
    name: "作曲 Composition",
    degrees: ["MM", "DMA"]
  }, {
    name: "爵士（各方向）",
    degrees: ["BM", "MM"]
  }, {
    name: "打击乐 Percussion",
    degrees: ["BM", "MM"]
  }]
}, {
  id: "curtis",
  en: "Curtis Institute of Music",
  zh: "柯蒂斯音乐学院",
  city: "费城，美国",
  country: "美国",
  verified: "2026-06",
  deadline: "2026-12-11",
  tuition: null,
  tuitionValue: 0,
  lang: "TOEFL 84",
  majors: [{
    name: "钢琴 Piano",
    degrees: ["BM"]
  }, {
    name: "大提琴 Cello",
    degrees: ["BM", "MM"]
  }, {
    name: "乐队指挥",
    degrees: ["MM"]
  }, {
    name: "双簧管 Oboe",
    degrees: ["BM"]
  }]
}, {
  id: "rcm",
  en: "Royal College of Music",
  zh: "皇家音乐学院",
  city: "伦敦，英国",
  country: "英国",
  verified: "2026-07",
  deadline: "2026-10-01",
  tuition: "£32,600 / 年",
  tuitionValue: 41000,
  lang: "IELTS 6.0",
  majors: [{
    name: "钢琴 Piano",
    degrees: ["BMus", "MPerf"]
  }, {
    name: "小提琴 Violin",
    degrees: ["BMus", "MPerf"]
  }, {
    name: "声乐 Voice",
    degrees: ["MPerf"]
  }, {
    name: "历史表演 Historical Performance",
    degrees: ["MPerf"]
  }, {
    name: "作曲 Composition",
    degrees: ["BMus", "MComp"]
  }]
}, {
  id: "ram",
  en: "Royal Academy of Music",
  zh: "皇家音乐专科学院",
  city: "伦敦，英国",
  country: "英国",
  verified: "2026-07",
  deadline: "2027-01-15",
  tuition: "£28,400 / 年",
  tuitionValue: 35700,
  lang: "IELTS 6.5",
  majors: [{
    name: "钢琴 Piano",
    degrees: ["BMus", "MA"]
  }, {
    name: "竖琴 Harp",
    degrees: ["BMus", "MA"]
  }, {
    name: "音乐剧 Musical Theatre",
    degrees: ["MA"]
  }, {
    name: "合唱指挥",
    degrees: ["MA"]
  }]
}, {
  id: "hmtmh",
  en: "HMTM Hannover",
  zh: "汉诺威音乐戏剧媒体学院",
  city: "汉诺威，德国",
  country: "德国",
  verified: null,
  deadline: "2026-11-30",
  tuition: "€440 / 学期",
  tuitionValue: 1000,
  lang: "IELTS 6.5",
  majors: [{
    name: "钢琴 Piano",
    degrees: ["BM", "MM"]
  }, {
    name: "小提琴 Violin",
    degrees: ["BM", "MM"]
  }, {
    name: "圆号 Horn",
    degrees: ["MM"]
  }, {
    name: "音乐教育 Music Education",
    degrees: ["BM"]
  }]
}, {
  id: "cnsmdp",
  en: "Conservatoire de Paris (CNSMDP)",
  zh: "巴黎国立高等音乐舞蹈学院",
  city: "巴黎，法国",
  country: "法国",
  verified: "2026-05",
  deadline: "2026-10-15",
  tuition: "€560 / 年",
  tuitionValue: 620,
  lang: null,
  majors: [{
    name: "长笛 Flute",
    degrees: ["DNSPM", "Master"]
  }, {
    name: "作曲 Composition",
    degrees: ["Master"]
  }, {
    name: "早期音乐 Early Music",
    degrees: ["Master"]
  }]
}, {
  id: "nec",
  en: "New England Conservatory",
  zh: "新英格兰音乐学院",
  city: "波士顿，美国",
  country: "美国",
  verified: null,
  deadline: "2026-12-01",
  tuition: "$54,000 / 年",
  tuitionValue: 54000,
  lang: "IELTS 6.5",
  majors: [{
    name: "钢琴 Piano",
    degrees: ["BM", "MM"]
  }, {
    name: "爵士（各方向）",
    degrees: ["BM", "MM"]
  }, {
    name: "低音提琴 Double Bass",
    degrees: ["MM"]
  }, {
    name: "音乐理论 Music Theory",
    degrees: ["MM"]
  }]
}, {
  id: "sibelius",
  en: "Sibelius Academy",
  zh: null,
  city: "赫尔辛基，芬兰",
  country: "芬兰",
  verified: "2026-04",
  deadline: "2026-12-09",
  tuition: null,
  tuitionValue: null,
  lang: "IELTS 6.0",
  majors: [{
    name: "小提琴 Violin",
    degrees: ["BM", "MM"]
  }, {
    name: "乐队指挥",
    degrees: ["MM"]
  }, {
    name: "音乐科技",
    degrees: ["MM"]
  }]
}, {
  id: "mozarteum",
  en: "Universität Mozarteum Salzburg",
  zh: "萨尔茨堡莫扎特大学",
  city: "萨尔茨堡，奥地利",
  country: "奥地利",
  verified: null,
  deadline: "2027-02-01",
  tuition: "€780 / 学期",
  tuitionValue: 1700,
  lang: null,
  majors: [{
    name: "钢琴 Piano",
    degrees: ["BA", "MA"]
  }, {
    name: "声乐 Voice",
    degrees: ["BA", "MA"]
  }, {
    name: "管风琴 Organ",
    degrees: ["MA"]
  }]
}, {
  id: "msm",
  en: "Manhattan School of Music",
  zh: "曼哈顿音乐学院",
  city: "纽约，美国",
  country: "美国",
  verified: "2026-06",
  deadline: "2026-12-01",
  tuition: "$53,000 / 年",
  tuitionValue: 53000,
  lang: "IELTS 6.5",
  majors: [{
    name: "钢琴 Piano",
    degrees: ["BM", "MM", "DMA"]
  }, {
    name: "萨克斯 Saxophone",
    degrees: ["BM", "MM"]
  }, {
    name: "歌剧研究 Opera Studies",
    degrees: ["MM"]
  }, {
    name: "协作钢琴 Collaborative Piano",
    degrees: ["MM"]
  }]
}];
window.degreeLevel = d => {
  const c = d[0].toUpperCase();
  if (c === "B" || d === "DNSPM") return "本科";
  if (c === "D" || c === "P") return "博士";
  return "硕士";
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/SchoolsData.js", error: String((e && e.message) || e) }); }

// ui_kits/marketing/SchoolsFilters.jsx
try { (() => {
const {
  Input,
  Select,
  Tag,
  Icon,
  Checkbox
} = window.STAGEDesignSystem_0f9c53;
const sfStyles = {
  bar: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap"
  },
  dd: {
    minWidth: 150
  },
  majorsBtn: (open, n) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 44,
    padding: "0 14px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontFamily: "var(--font-text)",
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-medium)",
    whiteSpace: "nowrap",
    background: n ? "var(--surface-accent-soft)" : "var(--surface-card)",
    color: n ? "var(--blue-800)" : "var(--text-strong)",
    border: `1px solid ${open || n ? "var(--blue-500)" : "var(--border-default)"}`
  }),
  panel: {
    marginTop: 12,
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    background: "var(--surface-card)",
    boxShadow: "var(--shadow-md)",
    overflow: "hidden"
  },
  famTabs: {
    display: "flex",
    gap: 4,
    padding: "10px 14px",
    borderBottom: "1px solid var(--border-hairline)",
    overflowX: "auto",
    background: "var(--surface-sunken)"
  },
  famTab: on => ({
    border: "none",
    cursor: "pointer",
    padding: "8px 14px",
    borderRadius: "var(--radius-xs)",
    background: on ? "var(--surface-card)" : "transparent",
    boxShadow: on ? "var(--shadow-xs)" : "none",
    color: on ? "var(--text-strong)" : "var(--text-muted)",
    fontFamily: "var(--font-text)",
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-medium)",
    whiteSpace: "nowrap"
  }),
  chips: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    padding: "16px 14px"
  },
  selRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center"
  }
};
function MajorPanel({
  open,
  setOpen,
  selected,
  toggle,
  counts
}) {
  const fams = window.MAJOR_FAMILIES;
  const [fam, setFam] = React.useState(fams[0].name);
  const cur = fams.find(f => f.name === fam);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: sfStyles.panel
  }, /*#__PURE__*/React.createElement("div", {
    style: sfStyles.famTabs
  }, fams.map(f => /*#__PURE__*/React.createElement("button", {
    key: f.name,
    type: "button",
    style: sfStyles.famTab(f.name === fam),
    onClick: () => setFam(f.name)
  }, f.name))), /*#__PURE__*/React.createElement("div", {
    style: sfStyles.chips
  }, cur.majors.map(m => {
    const n = counts[m] || 0;
    const on = selected.includes(m);
    return /*#__PURE__*/React.createElement("span", {
      key: m,
      style: {
        opacity: n === 0 && !on ? 0.4 : 1
      }
    }, /*#__PURE__*/React.createElement(Tag, {
      selected: on,
      onClick: n === 0 && !on ? undefined : () => toggle(m)
    }, m, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        opacity: 0.75,
        marginLeft: 2
      }
    }, n)));
  })));
}
function SchoolsFilters({
  q,
  setQ,
  country,
  setCountry,
  degree,
  setDegree,
  deadline,
  setDeadline,
  majors,
  toggleMajor,
  majorCounts,
  verifiedOnly,
  setVerifiedOnly,
  countries
}) {
  const [openMajors, setOpenMajors] = React.useState(false);
  const [openMore, setOpenMore] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    size: "lg",
    placeholder: "\u641C\u7D22\u9662\u6821\u3001\u4E13\u4E1A\u6216\u57CE\u5E02",
    value: q,
    onChange: e => setQ(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: sfStyles.bar
  }, /*#__PURE__*/React.createElement("span", {
    style: sfStyles.dd
  }, /*#__PURE__*/React.createElement(Select, {
    value: country,
    onChange: e => setCountry(e.target.value),
    options: ["国家/地区：全部", ...countries]
  })), /*#__PURE__*/React.createElement("span", {
    style: sfStyles.dd
  }, /*#__PURE__*/React.createElement(Select, {
    value: degree,
    onChange: e => setDegree(e.target.value),
    options: ["学位：全部", "本科", "硕士", "博士"]
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: sfStyles.majorsBtn(openMajors, majors.length),
    onClick: () => {
      setOpenMajors(!openMajors);
      setOpenMore(false);
    }
  }, "\u4E13\u4E1A\u65B9\u5411", majors.length ? ` · ${majors.length}` : "", /*#__PURE__*/React.createElement(Icon, {
    name: openMajors ? "chevron-up" : "chevron-down",
    size: 15
  })), /*#__PURE__*/React.createElement("span", {
    style: sfStyles.dd
  }, /*#__PURE__*/React.createElement(Select, {
    value: deadline,
    onChange: e => setDeadline(e.target.value),
    options: ["申请截止：全部", "2026-10", "2026-11", "2026-12", "2027-01 及以后"]
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: sfStyles.majorsBtn(openMore, verifiedOnly ? 1 : 0),
    onClick: () => {
      setOpenMore(!openMore);
      setOpenMajors(false);
    }
  }, "\u66F4\u591A\u7B5B\u9009", /*#__PURE__*/React.createElement(Icon, {
    name: openMore ? "chevron-up" : "chevron-down",
    size: 15
  }))), openMore ? /*#__PURE__*/React.createElement("div", {
    style: {
      ...sfStyles.panel,
      marginTop: 0,
      padding: "16px 16px"
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "\u4EC5\u663E\u793A\u5DF2\u6838\u5B9E\u9662\u6821",
    description: "\u6838\u5B9E\u5FBD\u7AE0\u7684\u89C4\u5219\uFF1A\u53EA\u6709\u6BD4\u5BF9\u8FC7\u5B98\u65B9\u4FE1\u606F\u6E90\u7684\u9662\u6821\u624D\u5E26\u5FBD\u7AE0",
    checked: verifiedOnly,
    onChange: setVerifiedOnly
  })) : null, /*#__PURE__*/React.createElement(MajorPanel, {
    open: openMajors,
    setOpen: setOpenMajors,
    selected: majors,
    toggle: toggleMajor,
    counts: majorCounts
  }), majors.length ? /*#__PURE__*/React.createElement("div", {
    style: sfStyles.selRow
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, "\u5DF2\u9009\u4E13\u4E1A\uFF1A"), majors.map(m => /*#__PURE__*/React.createElement(Tag, {
    key: m,
    selected: true,
    onRemove: () => toggleMajor(m)
  }, m))) : null);
}
Object.assign(window, {
  SchoolsFilters
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/SchoolsFilters.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Shots.jsx
try { (() => {
const {
  Badge,
  VerifiedBadge,
  Icon,
  Tag
} = window.STAGEDesignSystem_0f9c53;
const shot = {
  frame: {
    background: "var(--blue-950)",
    borderRadius: "var(--radius-lg)",
    padding: 10,
    boxShadow: "var(--shadow-xl)",
    overflow: "hidden"
  },
  chrome: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "2px 4px 10px"
  },
  dots: {
    display: "flex",
    gap: 6
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: "var(--radius-pill)",
    background: "rgba(255,255,255,.22)"
  },
  url: {
    flex: 1,
    height: 26,
    borderRadius: "var(--radius-pill)",
    background: "rgba(255,255,255,.08)",
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "0 12px",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "rgba(255,255,255,.62)"
  },
  page: {
    background: "var(--surface-page)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden"
  },
  pad: {
    padding: "20px 22px"
  },
  h: {
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: 22,
    letterSpacing: "var(--ls-heading)",
    color: "var(--blue-950)",
    lineHeight: 1.25
  },
  sub: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    marginTop: 4
  },
  card: {
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden"
  },
  cardHead: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderBottom: "1px solid var(--border-hairline)"
  },
  cardTitle: {
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--text-strong)"
  },
  row: {
    display: "grid",
    gridTemplateColumns: "108px 1fr",
    gap: 12,
    padding: "12px 14px",
    borderBottom: "1px solid var(--border-hairline)",
    alignItems: "baseline"
  },
  k: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)"
  },
  v: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-body)"
  },
  mono: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    color: "var(--text-body)"
  },
  hl: {
    background: "var(--surface-accent-soft)"
  },
  deep: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: "var(--fs-xs)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--blue-600)",
    textDecoration: "underline",
    textUnderlineOffset: 3
  },
  source: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "11px 14px",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-subtle)"
  }
};
function BrowserFrame({
  url,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...shot.frame,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: shot.chrome
  }, /*#__PURE__*/React.createElement("div", {
    style: shot.dots
  }, /*#__PURE__*/React.createElement("span", {
    style: shot.dot
  }), /*#__PURE__*/React.createElement("span", {
    style: shot.dot
  }), /*#__PURE__*/React.createElement("span", {
    style: shot.dot
  })), /*#__PURE__*/React.createElement("div", {
    style: shot.url
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 11,
    strokeWidth: 2
  }), url)), /*#__PURE__*/React.createElement("div", {
    style: shot.page
  }, children));
}

/* 首屏主图：院校详情页 */
function SchoolDetailShot() {
  return /*#__PURE__*/React.createElement(BrowserFrame, {
    url: "stage.app/schools/juilliard"
  }, /*#__PURE__*/React.createElement("div", {
    style: shot.pad
  }, /*#__PURE__*/React.createElement("div", {
    style: shot.h
  }, "The Juilliard School"), /*#__PURE__*/React.createElement("div", {
    style: shot.sub
  }, "\u8331\u8389\u4E9A\u5B66\u9662 \xB7 \u7EBD\u7EA6\uFF0C\u7F8E\u56FD"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...shot.card,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: shot.cardHead
  }, /*#__PURE__*/React.createElement("span", {
    style: shot.cardTitle
  }, "\u7855\u58EB \xB7 \u94A2\u7434\u8868\u6F14"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(VerifiedBadge, {
    date: "2026-06",
    label: "\u6838\u5B9E\u4E8E",
    size: "sm"
  }))), /*#__PURE__*/React.createElement("div", {
    style: shot.row
  }, /*#__PURE__*/React.createElement("span", {
    style: shot.k
  }, "\u7533\u8BF7\u622A\u6B62"), /*#__PURE__*/React.createElement("span", {
    style: shot.mono
  }, "2026\u5E7412\u67081\u65E5")), /*#__PURE__*/React.createElement("div", {
    style: shot.row
  }, /*#__PURE__*/React.createElement("span", {
    style: shot.k
  }, "\u9884\u7B5B\u9009\u5F55\u50CF"), /*#__PURE__*/React.createElement("span", {
    style: shot.v
  }, "\u6307\u5B9A\u66F2\u76EE 3 \u9996")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...shot.row,
      ...shot.hl,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: shot.k
  }, "\u8BED\u8A00\u8981\u6C42"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...shot.v,
      fontFamily: "var(--font-mono)",
      fontWeight: "var(--fw-medium)",
      color: "var(--blue-800)"
    }
  }, "IELTS 7.0"), /*#__PURE__*/React.createElement("span", {
    style: shot.deep
  }, "\u53BB IELTS Lab \u51C6\u5907 \u2192")), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 232,
      bottom: 4,
      color: "var(--blue-950)",
      filter: "drop-shadow(0 1px 2px rgba(255,255,255,.9))"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mouse-pointer-2",
    size: 19,
    strokeWidth: 1.75,
    style: {
      fill: "var(--n-0)"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: shot.source
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "external-link",
    size: 11,
    strokeWidth: 2
  }), "\u6765\u6E90\uFF1Ajuilliard.edu \u5B98\u65B9\u62DB\u751F\u9875"))));
}

/* 首屏小卡：被唤起的 IELTS Lab */
function LabPopCard({
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 232,
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-lg)",
      overflow: "hidden",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "11px 13px",
      borderBottom: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--fw-semibold)",
      fontSize: 12,
      letterSpacing: ".18em",
      color: "var(--blue-950)"
    }
  }, "IELTS LAB"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 11,
      color: "var(--text-subtle)"
    }
  }, "\u6B63\u5728\u6253\u5F00\u2026")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "13px",
      display: "grid",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, "\u76EE\u6807\uFF1A"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-strong)"
    }
  }, "IELTS 7.0")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "brand"
  }, "\u542C\u529B\u590D\u76D8"), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "\u5F31\u70B9\u5206\u6790"))));
}

/* 验证区块配图：院校列表页 */
const filters = [["国家", "美国 · 英国 · 德国"], ["专业", "钢琴表演"], ["学位", "硕士 Master"], ["截止月份", "2026-12"]];
const listCards = [{
  name: "The Juilliard School",
  zh: "茱莉亚学院 · 纽约",
  date: "2026-06"
}, {
  name: "Royal College of Music",
  zh: "皇家音乐学院 · 伦敦",
  date: "2026-06"
}, {
  name: "HMTM Hannover",
  zh: "汉诺威音乐戏剧媒体学院",
  date: "2026-05"
}];
function SchoolListShot() {
  return /*#__PURE__*/React.createElement(BrowserFrame, {
    url: "stage.app/schools"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "168px 1fr"
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      borderRight: "1px solid var(--border-hairline)",
      padding: "16px 14px",
      display: "grid",
      gap: 14,
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      letterSpacing: "var(--ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--text-subtle)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "\u7B5B\u9009\u5668"), filters.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: "grid",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)"
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-body)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-xs)",
      padding: "6px 8px",
      lineHeight: 1.4
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 16px",
      display: "grid",
      gap: 10,
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--text-subtle)"
    }
  }, "3 / 120 \u6240\u9662\u6821"), listCards.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.name,
    style: {
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-md)",
      padding: "12px 14px",
      display: "grid",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-strong)"
    }
  }, c.name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: "var(--fs-2xs)",
      color: "var(--text-subtle)",
      marginTop: 2
    }
  }, c.zh)), /*#__PURE__*/React.createElement(VerifiedBadge, {
    date: c.date,
    label: "\u6838\u5B9E\u4E8E",
    size: "sm"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "\u7855\u58EB Master"), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "\u94A2\u7434\u8868\u6F14")))))));
}

/* Lab 区块配图：听力复盘界面 */
const transcript = [{
  t: "02:38",
  text: "The lecture will begin with the origins of the string quartet, ",
  hl: false
}, {
  t: "02:41",
  text: "which scarcely any of the earlier chamber forms anticipated.",
  hl: true
}, {
  t: "02:47",
  text: "We will then move on to Haydn's contribution.",
  hl: false
}];
function LabListeningShot() {
  return /*#__PURE__*/React.createElement(BrowserFrame, {
    url: "stage.app/lab/listening/review"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "13px 16px",
      borderBottom: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--fw-semibold)",
      fontSize: 12,
      letterSpacing: ".18em",
      color: "var(--blue-950)"
    }
  }, "IELTS LAB"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-muted)"
    }
  }, "Listening \xB7 Section 3 \xB7 \u590D\u76D8"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--text-subtle)"
    }
  }, "Q6 / 10")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 16px",
      display: "grid",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      letterSpacing: "var(--ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--text-subtle)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "\u539F\u6587\u5B9A\u4F4D"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 9
    }
  }, transcript.map(l => /*#__PURE__*/React.createElement("div", {
    key: l.t,
    style: {
      display: "grid",
      gridTemplateColumns: "52px 1fr",
      gap: 12,
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: l.hl ? "var(--blue-700)" : "var(--text-subtle)"
    }
  }, l.t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      lineHeight: 1.7,
      color: "var(--text-body)"
    }
  }, l.hl ? /*#__PURE__*/React.createElement("mark", {
    style: {
      background: "var(--gold-200)",
      color: "var(--blue-950)",
      padding: "1px 2px",
      borderRadius: 2
    }
  }, l.text) : l.text)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
      padding: "11px 13px",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-md)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--blue-700)",
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "link",
    size: 14
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-medium)",
      color: "var(--blue-700)"
    }
  }, "Q6 \u9519\u56E0\u8BC1\u636E \xB7 \u539F\u6587\u5B9A\u4F4D"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--text-subtle)"
    }
  }, "02:41")))));
}
Object.assign(window, {
  BrowserFrame,
  SchoolDetailShot,
  LabPopCard,
  SchoolListShot,
  LabListeningShot
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Shots.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/SiteFooter.jsx
try { (() => {
const {
  Icon
} = window.STAGEDesignSystem_0f9c53;
const footerStyles = {
  root: {
    background: "var(--surface-inverse)",
    color: "rgba(255,255,255,.72)",
    overflow: "hidden"
  },
  top: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
    gap: 40,
    padding: "var(--section-y-tight) 0 clamp(32px,4vw,56px)"
  },
  colH: {
    fontSize: "var(--fs-2xs)",
    letterSpacing: "var(--ls-eyebrow)",
    textTransform: "uppercase",
    color: "rgba(255,255,255,.42)",
    fontWeight: "var(--fw-semibold)"
  },
  link: {
    fontSize: "var(--fs-sm)",
    color: "rgba(255,255,255,.72)"
  },
  disc: {
    fontSize: "var(--fs-2xs)",
    lineHeight: 1.85,
    color: "rgba(255,255,255,.42)",
    maxWidth: "88ch",
    margin: 0
  },
  legal: {
    display: "grid",
    gap: 12,
    padding: "20px 0",
    borderTop: "1px solid var(--border-inverse)"
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
    padding: "20px 0",
    borderTop: "1px solid var(--border-inverse)",
    fontSize: "var(--fs-xs)",
    color: "rgba(255,255,255,.42)"
  },
  wordmark: {
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "clamp(72px,20.4vw,300px)",
    lineHeight: 0.78,
    letterSpacing: "var(--ls-wordmark)",
    color: "var(--n-0)",
    textAlign: "center",
    whiteSpace: "nowrap",
    paddingLeft: "0.34em",
    marginBottom: "-0.16em",
    userSelect: "none"
  }
};

/* TODO(copy-placeholder · 页脚细项): 以下三列的条目文案为示例占位内容，非客户定稿。
   页脚整体内容规划完成后，用真实清单整体替换 footerCols 的 links 数组。
   栏目名（指南 / 术语库 / 联系我们）来自客户规格，不是占位内容，勿改。
   搜索关键字：copy-placeholder */
const footerCols = [{
  h: "指南",
  links: ["音乐留学申请时间线", "预筛选录像怎么准备", "曲目要求怎么读", "IELTS 复盘怎么做"]
}, {
  h: "术语库",
  links: ["Pre-screening 预筛选", "MPerf / MMus 学位缩写", "Audition 现场试奏", "Band Score 计分方式"]
}, {
  h: "联系我们",
  links: ["数据纠错", "院校合作", "顾问合作", "hello@stage.example"]
}];
function SiteFooter() {
  return /*#__PURE__*/React.createElement("footer", {
    style: footerStyles.root
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    style: footerStyles.top
  }, footerCols.map(c => /*#__PURE__*/React.createElement("nav", {
    key: c.h,
    style: {
      display: "grid",
      gap: 12,
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: footerStyles.colH
  }, c.h), c.links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: footerStyles.link
  }, l))))), /*#__PURE__*/React.createElement("div", {
    style: footerStyles.legal
  }, /*#__PURE__*/React.createElement("p", {
    style: footerStyles.disc
  }, "IELTS\xAE \u662F\u82F1\u56FD\u6587\u5316\u6559\u80B2\u534F\u4F1A\uFF08British Council\uFF09\u3001IDP IELTS Australia \u4E0E\u5251\u6865\u5927\u5B66\u82F1\u8BED\u8003\u8BC4\u90E8\uFF08Cambridge Assessment English\uFF09\u7684\u6CE8\u518C\u5546\u6807\u3002STAGE \u4E0E\u4E0A\u8FF0\u673A\u6784\u4E0D\u5B58\u5728\u4EFB\u4F55\u5173\u8054\u3001\u8BA4\u53EF\u6216\u5408\u4F5C\u5173\u7CFB\u3002")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...footerStyles.meta,
      borderTop: "none"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 STAGE \xB7 \u97F3\u4E50\u7533\u8BF7 \xD7 IELTS \u51C6\u5907"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      gap: 6,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mail",
    size: 14
  }), "hello@stage.example"))), /*#__PURE__*/React.createElement("div", {
    style: footerStyles.wordmark
  }, "STAGE"));
}
Object.assign(window, {
  SiteFooter
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/SiteFooter.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/SiteHeader.jsx
try { (() => {
const {
  Button,
  IconButton,
  Icon
} = window.STAGEDesignSystem_0f9c53;
const navItems = [{
  label: "院校与专业",
  href: "schools.html"
}, {
  label: "IELTS Lab",
  href: "../ielts_lab/index.html"
}, {
  label: "指南",
  href: "guides.html"
}, {
  label: "定价",
  href: "pricing.html"
}];
const headerStyles = {
  bar: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "var(--surface-glass)",
    backdropFilter: "var(--blur-glass)",
    WebkitBackdropFilter: "var(--blur-glass)",
    borderBottom: "1px solid var(--border-hairline)"
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 88,
    gap: 28
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  /* 全站统一的返回规则：非落地页时，导航栏最左侧为「← STAGE」，
     与 IELTS Lab 应用壳左上角的处理完全一致。 */
  brandBack: {
    color: "var(--n-400)",
    display: "grid",
    flex: "none",
    marginLeft: -6,
    marginRight: -2
  },
  mark: {
    height: 56,
    width: "auto",
    display: "block"
  },
  word: {
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-semibold)",
    fontSize: 20,
    letterSpacing: "0.3em",
    color: "var(--blue-950)",
    paddingLeft: 2
  },
  wordBack: {
    fontWeight: "var(--fw-bold)"
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 36
  },
  link: {
    fontSize: 19,
    color: "var(--text-muted)",
    fontWeight: "var(--fw-medium)"
  },
  linkActive: {
    color: "var(--blue-950)",
    fontWeight: "var(--fw-semibold)",
    borderBottom: "2px solid var(--action-primary)",
    paddingBottom: 4
  }
};
function SiteHeader({
  active,
  home
}) {
  /* home=true 表示当前就在落地页：字标滚回顶部、锚点就地跳转；
     其他页面：字标回 index.html，锚点链接自动加上 index.html 前缀 */
  const href = raw => home || !raw.startsWith("#") ? raw : "index.html" + raw;
  const [open, setOpen] = React.useState(false);
  const [wide, setWide] = React.useState(typeof window !== "undefined" ? window.innerWidth >= 920 : true);
  React.useEffect(() => {
    const on = () => setWide(window.innerWidth >= 920);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return /*#__PURE__*/React.createElement("header", {
    style: headerStyles.bar
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap",
    style: headerStyles.inner
  }, /*#__PURE__*/React.createElement("a", {
    href: home ? "#top" : "index.html",
    title: home ? undefined : "返回 STAGE 首页",
    style: headerStyles.brand
  }, home ? null : /*#__PURE__*/React.createElement("span", {
    style: headerStyles.brandBack
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 20,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/stage-mark.png",
    alt: "",
    style: headerStyles.mark
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...headerStyles.word,
      ...(home ? null : headerStyles.wordBack)
    }
  }, "STAGE")), wide ? /*#__PURE__*/React.createElement("nav", {
    style: headerStyles.nav
  }, navItems.map(n => /*#__PURE__*/React.createElement("a", {
    key: n.label,
    href: href(n.href),
    style: {
      ...headerStyles.link,
      ...(n.label === active ? headerStyles.linkActive : null)
    }
  }, n.label))) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "schools.html",
    style: {
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Button, null, "\u5F00\u59CB\u67E5\u9662\u6821")), wide ? null : /*#__PURE__*/React.createElement(IconButton, {
    icon: open ? "x" : "menu",
    label: "\u83DC\u5355",
    onClick: () => setOpen(!open)
  }))), open && !wide ? /*#__PURE__*/React.createElement("nav", {
    className: "wrap",
    style: {
      display: "grid",
      gap: 4,
      paddingBottom: 16,
      borderTop: "1px solid var(--border-hairline)",
      paddingTop: 12
    }
  }, navItems.map(n => /*#__PURE__*/React.createElement("a", {
    key: n.label,
    href: href(n.href),
    style: {
      ...headerStyles.link,
      padding: "10px 0",
      fontSize: "var(--fs-body)",
      ...(n.label === active ? {
        color: "var(--blue-950)",
        fontWeight: "var(--fw-semibold)"
      } : null)
    }
  }, n.label))) : null);
}
Object.assign(window, {
  SiteHeader
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/SiteHeader.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/StatBar.jsx
try { (() => {
const stats = [{
  v: "120+",
  l: "全球音乐院校"
}, {
  v: "900+",
  l: "学位项目"
}, {
  v: "100%",
  l: "招生要求均可追溯官方信息源"
}, {
  v: "15",
  l: "覆盖国家与地区"
}];
const statBarStyles = {
  sec: {
    borderBottom: "1px solid var(--border-hairline)",
    background: "var(--surface-page)"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))"
  },
  cell: {
    padding: "clamp(28px,3.4vw,44px) 24px clamp(28px,3.4vw,44px) 0",
    display: "grid",
    gap: 8,
    alignContent: "start"
  },
  v: {
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "clamp(2.25rem,3.6vw,3.25rem)",
    letterSpacing: "var(--ls-display)",
    lineHeight: 1,
    color: "var(--blue-950)",
    fontVariantNumeric: "tabular-nums"
  },
  l: {
    fontSize: "var(--fs-sm)",
    lineHeight: 1.6,
    color: "var(--text-muted)",
    maxWidth: "22ch"
  }
};
function StatBar() {
  return /*#__PURE__*/React.createElement("section", {
    style: statBarStyles.sec
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    style: statBarStyles.grid
  }, stats.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.l,
    style: statBarStyles.cell
  }, /*#__PURE__*/React.createElement("span", {
    style: statBarStyles.v
  }, s.v), /*#__PURE__*/React.createElement("span", {
    style: statBarStyles.l
  }, s.l))))));
}
Object.assign(window, {
  StatBar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/StatBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/VerifySection.jsx
try { (() => {
const {
  Eyebrow,
  Button,
  Icon
} = window.STAGEDesignSystem_0f9c53;
const {
  SchoolListShot
} = window;
const verifyStyles = {
  sec: {
    padding: "var(--section-y) 0"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
    gap: "clamp(40px,5vw,72px)",
    alignItems: "center"
  },
  copy: {
    display: "grid",
    gap: 20,
    alignContent: "start"
  },
  h2: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-d2)",
    lineHeight: "var(--lh-display)",
    letterSpacing: "var(--ls-display)",
    color: "var(--blue-950)"
  },
  flow: {
    display: "grid",
    gap: 0,
    borderTop: "1px solid var(--border-hairline)"
  },
  step: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: 14,
    padding: "18px 0",
    borderBottom: "1px solid var(--border-hairline)",
    alignItems: "baseline"
  },
  n: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)"
  },
  st: {
    fontSize: "var(--fs-h4)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    color: "var(--text-strong)"
  },
  sd: {
    fontSize: "var(--fs-sm)",
    lineHeight: 1.75,
    color: "var(--text-muted)",
    marginTop: 6
  }
};

/* TODO(copy-placeholder · 验证流程说明句): 每一步的第三个字符串（说明小字）为补写的占位内容，非客户定稿。
   三个步骤名「来源抓取 / 结构化核对 / 标注核实日期」来自客户规格，不是占位内容，勿改。
   搜索关键字：copy-placeholder */
const steps = [["01", "来源抓取", "只从院校官方招生页取值，记录页面地址。"], ["02", "结构化核对", "逐字段比对官网原文，字段缺失就留空，不做推断。"], ["03", "标注核实日期", "写入最后一次比对的日期，超期条目标为待复核。"]];
function VerifySection() {
  return /*#__PURE__*/React.createElement("section", {
    id: "schools",
    style: verifyStyles.sec
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    style: verifyStyles.grid
  }, /*#__PURE__*/React.createElement("div", {
    style: verifyStyles.copy
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u9662\u6821\u63A2\u7D22"), /*#__PURE__*/React.createElement("h2", {
    style: verifyStyles.h2
  }, "\u6BCF\u4E00\u6240\u9662\u6821\uFF0C", /*#__PURE__*/React.createElement("br", null), "\u5747\u7ECF\u8FC7\u9A8C\u8BC1\u3002"), /*#__PURE__*/React.createElement("div", {
    style: verifyStyles.flow
  }, steps.map(([n, t, d]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: verifyStyles.step
  }, /*#__PURE__*/React.createElement("span", {
    style: verifyStyles.n
  }, n), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: verifyStyles.st
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      ...verifyStyles.sd,
      display: "block"
    }
  }, d))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Button, {
    iconRight: "arrow-right"
  }, "\u63A2\u7D22\u97F3\u4E50\u9662\u6821"))), /*#__PURE__*/React.createElement(SchoolListShot, null))));
}
Object.assign(window, {
  VerifySection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/VerifySection.jsx", error: String((e && e.message) || e) }); }

// ui_kits/schools/AppChrome.jsx
try { (() => {
const {
  Icon,
  IconButton
} = window.STAGEDesignSystem_0f9c53;
const chromeStyles = {
  shell: {
    minHeight: "100vh",
    background: "var(--surface-page)",
    paddingBottom: 78
  },
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 30,
    background: "var(--surface-glass)",
    backdropFilter: "var(--blur-glass)",
    WebkitBackdropFilter: "var(--blur-glass)",
    borderBottom: "1px solid var(--border-hairline)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    height: 56,
    padding: "0 12px"
  },
  title: {
    fontSize: "var(--fs-body)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    color: "var(--text-strong)",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  tabbar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    height: 66,
    background: "var(--surface-glass)",
    backdropFilter: "var(--blur-glass)",
    WebkitBackdropFilter: "var(--blur-glass)",
    borderTop: "1px solid var(--border-hairline)",
    display: "grid",
    gridAutoFlow: "column"
  },
  tab: {
    display: "grid",
    placeItems: "center",
    gap: 3,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
    fontFamily: "var(--font-text)"
  },
  tabLabel: {
    fontSize: "var(--fs-2xs)",
    letterSpacing: 0
  }
};
function TopBar({
  title,
  back,
  onBack,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: chromeStyles.topbar
  }, back ? /*#__PURE__*/React.createElement(IconButton, {
    icon: "chevron-left",
    label: "\u8FD4\u56DE",
    onClick: onBack
  }) : /*#__PURE__*/React.createElement("img", {
    src: "../../assets/stage-mark.png",
    alt: "STAGE",
    style: {
      height: 20,
      marginLeft: 6,
      marginRight: 2
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: chromeStyles.title
  }, title), right);
}
const tabs = [{
  id: "list",
  icon: "search",
  label: "查院校"
}, {
  id: "compare",
  icon: "columns-3",
  label: "对比"
}, {
  id: "saved",
  icon: "bookmark",
  label: "收藏"
}, {
  id: "me",
  icon: "user-round",
  label: "我的"
}];
function TabBar({
  value,
  onChange,
  compareCount
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: chromeStyles.tabbar
  }, tabs.map(t => {
    const on = t.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      type: "button",
      onClick: () => onChange(t.id),
      style: chromeStyles.tab
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        color: on ? "var(--blue-700)" : "var(--text-subtle)",
        display: "grid"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: t.icon,
      size: 21,
      strokeWidth: on ? 2 : 1.75
    }), t.id === "compare" && compareCount ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        top: -4,
        right: -8,
        minWidth: 16,
        height: 16,
        padding: "0 4px",
        borderRadius: "var(--radius-pill)",
        background: "var(--action-primary)",
        color: "var(--n-0)",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        display: "grid",
        placeItems: "center"
      }
    }, compareCount) : null), /*#__PURE__*/React.createElement("span", {
      style: {
        ...chromeStyles.tabLabel,
        color: on ? "var(--blue-700)" : "var(--text-subtle)",
        fontWeight: on ? "var(--fw-medium)" : "var(--fw-regular)"
      }
    }, t.label));
  }));
}
Object.assign(window, {
  TopBar,
  TabBar,
  chromeStyles
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/schools/AppChrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/schools/CompareScreen.jsx
try { (() => {
const {
  EmptyState,
  Button,
  VerifiedBadge,
  Badge,
  Eyebrow,
  IconButton
} = window.STAGEDesignSystem_0f9c53;
const cmpStyles = {
  head: {
    padding: "18px 16px 14px",
    display: "grid",
    gap: 10
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h1)",
    letterSpacing: "var(--ls-display)",
    lineHeight: 1.1,
    color: "var(--blue-950)"
  },
  hint: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)"
  },
  scroll: {
    overflowX: "auto",
    padding: "0 16px 24px"
  },
  table: {
    display: "grid",
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    minWidth: 520
  },
  hRow: {
    display: "grid",
    background: "var(--surface-sunken)",
    borderBottom: "1px solid var(--border-hairline)"
  },
  hCell: {
    padding: "14px 12px",
    borderLeft: "1px solid var(--border-hairline)",
    display: "grid",
    gap: 6,
    alignContent: "start"
  },
  row: {
    display: "grid",
    borderBottom: "1px solid var(--border-hairline)"
  },
  field: {
    padding: "14px 12px",
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    background: "var(--surface-page)"
  },
  cell: {
    padding: "14px 12px",
    borderLeft: "1px solid var(--border-hairline)",
    fontSize: "var(--fs-sm)",
    color: "var(--text-body)",
    lineHeight: 1.6
  },
  missing: {
    color: "var(--text-subtle)"
  }
};
const fields = [["国家 Country", s => s.country], ["语言要求 English", s => s.lang], ["申请截止 Deadline", s => s.deadline, true], ["学费 Tuition", s => s.fee, true], ["曲目要求 Repertoire", s => s.audition], ["面试形式 Interview", s => s.interview], ["奖学金 Scholarship", s => s.scholarship]];
function CompareScreen({
  compare,
  onCompare,
  onBrowse
}) {
  const rows = window.SCHOOLS.filter(s => compare.includes(s.id));
  const cols = `132px repeat(${Math.max(rows.length, 1)}, minmax(160px,1fr))`;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: cmpStyles.head
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u9662\u6821\u4E0E\u4E13\u4E1A"), /*#__PURE__*/React.createElement("h1", {
    style: cmpStyles.h1
  }, "\u5E76\u6392\u5BF9\u6BD4"), /*#__PURE__*/React.createElement("span", {
    style: cmpStyles.hint
  }, "\u6700\u591A\u540C\u65F6\u5BF9\u6BD4 3 \u6240\u9662\u6821 \xB7 \u540C\u4E00\u5B57\u6BB5\u9010\u6761\u5BF9\u9F50\uFF0C\u7F3A\u5931\u663E\u793A\u300C\u5B98\u65B9\u672A\u516C\u5E03\u300D")), rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 16px"
    }
  }, /*#__PURE__*/React.createElement(EmptyState, {
    icon: "columns-3",
    title: "\u8FD8\u6CA1\u6709\u52A0\u5165\u5BF9\u6BD4\u7684\u9662\u6821",
    description: "\u5728\u9662\u6821\u5217\u8868\u91CC\u70B9\u300C\u52A0\u5165\u5BF9\u6BD4\u300D\uFF0C\u6700\u591A\u9009 3 \u6240\u3002",
    action: /*#__PURE__*/React.createElement(Button, {
      onClick: onBrowse
    }, "\u6D4F\u89C8\u9662\u6821")
  })) : /*#__PURE__*/React.createElement("div", {
    style: cmpStyles.scroll
  }, /*#__PURE__*/React.createElement("div", {
    style: cmpStyles.table
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cmpStyles.hRow,
      gridTemplateColumns: cols
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: cmpStyles.field
  }), rows.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: cmpStyles.hCell
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-strong)",
      lineHeight: 1.35,
      flex: 1
    }
  }, s.name), /*#__PURE__*/React.createElement("span", {
    onClick: () => onCompare(s.id)
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "x",
    label: "\u79FB\u51FA\u5BF9\u6BD4",
    size: "sm"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      color: "var(--text-subtle)"
    }
  }, s.en), /*#__PURE__*/React.createElement(VerifiedBadge, {
    date: s.verified,
    size: "sm",
    stale: s.stale
  })))), fields.map(([label, get, mono], i) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      ...cmpStyles.row,
      gridTemplateColumns: cols,
      borderBottom: i === fields.length - 1 ? "none" : cmpStyles.row.borderBottom
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: cmpStyles.field
  }, label), rows.map(s => {
    const v = get(s);
    return /*#__PURE__*/React.createElement("div", {
      key: s.id,
      style: {
        ...cmpStyles.cell,
        ...(v ? null : cmpStyles.missing),
        fontFamily: mono && v ? "var(--font-mono)" : "var(--font-text)",
        fontSize: mono && v ? "var(--fs-xs)" : "var(--fs-sm)"
      }
    }, v || "官方未公布");
  }))))));
}
Object.assign(window, {
  CompareScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/schools/CompareScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/schools/DetailScreen.jsx
try { (() => {
const {
  Tabs,
  DataRow,
  Card,
  Badge,
  VerifiedBadge,
  SourceLink,
  Button,
  Eyebrow,
  Icon
} = window.STAGEDesignSystem_0f9c53;
const detailStyles = {
  hero: {
    padding: "20px 16px 0",
    display: "grid",
    gap: 10
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h1)",
    letterSpacing: "var(--ls-display)",
    lineHeight: 1.12,
    color: "var(--blue-950)"
  },
  en: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-muted)"
  },
  tabsWrap: {
    padding: "18px 16px 0",
    position: "sticky",
    top: 56,
    background: "var(--surface-page)",
    zIndex: 20
  },
  body: {
    padding: "8px 16px 28px"
  },
  sourceNote: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    padding: "12px 14px",
    background: "var(--surface-verified)",
    border: "1px solid var(--verified-border)",
    borderRadius: "var(--radius-md)",
    fontSize: "var(--fs-xs)",
    color: "var(--green-700)",
    lineHeight: 1.6
  }
};
const sections = [{
  value: "req",
  label: "申请要求"
}, {
  value: "aud",
  label: "面试与试奏"
}, {
  value: "fee",
  label: "费用与截止"
}];
function DetailScreen({
  school,
  compare,
  onCompare
}) {
  const [tab, setTab] = React.useState("req");
  const s = school;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: detailStyles.hero
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u9662\u6821\u4E0E\u4E13\u4E1A"), /*#__PURE__*/React.createElement("h1", {
    style: detailStyles.h1
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: detailStyles.en
  }, s.en, " \xB7 ", s.city), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, s.country), s.degrees.map(d => /*#__PURE__*/React.createElement(Badge, {
    key: d,
    tone: "brand"
  }, d))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(VerifiedBadge, {
    date: s.verified,
    size: "sm",
    stale: s.stale
  }), /*#__PURE__*/React.createElement(SourceLink, {
    href: "#",
    domain: s.domain,
    size: "sm"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    onClick: () => onCompare(s.id),
    variant: compare.includes(s.id) ? "secondary" : "primary",
    icon: compare.includes(s.id) ? "check" : "columns-3"
  }, compare.includes(s.id) ? "已加入对比" : "加入对比"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconRight: "external-link"
  }, "\u5B98\u7F51"))), /*#__PURE__*/React.createElement("div", {
    style: detailStyles.tabsWrap
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: sections,
    value: tab,
    onChange: setTab
  })), /*#__PURE__*/React.createElement("div", {
    style: detailStyles.body
  }, tab === "req" ? /*#__PURE__*/React.createElement(Card, {
    padding: 18,
    style: {
      paddingTop: 2,
      paddingBottom: 2
    }
  }, /*#__PURE__*/React.createElement(DataRow, {
    field: "\u8BED\u8A00\u8981\u6C42 English",
    value: s.lang,
    note: s.langNote,
    sourceHref: "#",
    sourceDomain: s.domain,
    verifiedOn: s.verified,
    stale: s.stale
  }), /*#__PURE__*/React.createElement(DataRow, {
    field: "\u5B66\u4F4D\u5C42\u7EA7 Degree",
    value: s.degrees.join(" · "),
    sourceHref: "#",
    sourceDomain: s.domain,
    verifiedOn: s.verified,
    stale: s.stale
  }), /*#__PURE__*/React.createElement(DataRow, {
    field: "\u4E13\u4E1A\u65B9\u5411 Majors",
    value: s.instruments.join(" · "),
    sourceHref: "#",
    sourceDomain: s.domain,
    verifiedOn: s.verified,
    stale: s.stale
  }), /*#__PURE__*/React.createElement(DataRow, {
    field: "\u7533\u8BF7\u6750\u6599 Materials",
    value: s.materials,
    sourceHref: "#",
    sourceDomain: s.domain,
    verifiedOn: s.verified,
    stale: s.stale,
    last: true
  })) : null, tab === "aud" ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: 18,
    style: {
      paddingTop: 2,
      paddingBottom: 2
    }
  }, /*#__PURE__*/React.createElement(DataRow, {
    field: "\u66F2\u76EE\u8981\u6C42 Repertoire",
    value: s.audition,
    note: s.auditionNote,
    sourceHref: "#",
    sourceDomain: s.domain,
    verifiedOn: s.verified,
    stale: s.stale
  }), /*#__PURE__*/React.createElement(DataRow, {
    field: "\u9762\u8BD5\u5F62\u5F0F Interview",
    value: s.interview,
    sourceHref: s.interview ? "#" : undefined,
    sourceDomain: s.domain,
    verifiedOn: s.interviewVerified,
    stale: s.interviewStale,
    last: true
  })), /*#__PURE__*/React.createElement("div", {
    style: detailStyles.sourceNote
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      paddingTop: 1
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "badge-check",
    size: 15
  })), "\u672C\u9875\u6BCF\u6761\u8981\u6C42\u5747\u6BD4\u5BF9\u9662\u6821\u5B98\u7F51\u539F\u6587\uFF1B\u6807\u4E3A\u300C\u5F85\u590D\u6838\u300D\u7684\u6761\u76EE\u8DDD\u4E0A\u6B21\u6838\u5B9E\u5DF2\u8D85\u8FC7 180 \u5929\uFF0C\u8BF7\u4EE5\u5B98\u7F51\u4E3A\u51C6\u3002")) : null, tab === "fee" ? /*#__PURE__*/React.createElement(Card, {
    padding: 18,
    style: {
      paddingTop: 2,
      paddingBottom: 2
    }
  }, /*#__PURE__*/React.createElement(DataRow, {
    field: "\u5B66\u8D39 Tuition",
    value: s.fee,
    sourceHref: "#",
    sourceDomain: s.domain,
    verifiedOn: s.verified,
    stale: s.stale
  }), /*#__PURE__*/React.createElement(DataRow, {
    field: "\u7533\u8BF7\u622A\u6B62 Deadline",
    value: s.deadline,
    note: "\u4EE5\u5B98\u7F51\u516C\u5E03\u7684\u5F53\u5E74\u65F6\u95F4\u4E3A\u51C6",
    sourceHref: "#",
    sourceDomain: s.domain,
    verifiedOn: s.verified,
    stale: s.stale
  }), /*#__PURE__*/React.createElement(DataRow, {
    field: "\u5956\u5B66\u91D1 Scholarship",
    value: s.scholarship,
    sourceHref: s.scholarship ? "#" : undefined,
    sourceDomain: s.domain,
    verifiedOn: s.scholarship ? s.verified : undefined,
    last: true
  })) : null));
}
Object.assign(window, {
  DetailScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/schools/DetailScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/schools/SavedScreen.jsx
try { (() => {
const {
  Card,
  EmptyState,
  Button,
  Badge,
  VerifiedBadge,
  Eyebrow,
  Switch,
  Icon
} = window.STAGEDesignSystem_0f9c53;
const savedStyles = {
  head: {
    padding: "18px 16px 14px",
    display: "grid",
    gap: 10
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h1)",
    letterSpacing: "var(--ls-display)",
    lineHeight: 1.1,
    color: "var(--blue-950)"
  },
  list: {
    display: "grid",
    gap: 12,
    padding: "0 16px 24px"
  },
  name: {
    fontSize: "var(--fs-h4)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    color: "var(--text-strong)"
  },
  deadline: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: "var(--fs-xs)",
    fontFamily: "var(--font-mono)",
    color: "var(--text-muted)",
    marginTop: 8
  }
};
function SavedScreen({
  saved,
  onOpen,
  onBrowse
}) {
  const [remind, setRemind] = React.useState(true);
  const rows = window.SCHOOLS.filter(s => saved.includes(s.id));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: savedStyles.head
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u6211\u7684\u6536\u85CF"), /*#__PURE__*/React.createElement("h1", {
    style: savedStyles.h1
  }, "\u5DF2\u6536\u85CF\u9662\u6821"), /*#__PURE__*/React.createElement(Card, {
    padding: 14
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "\u622A\u6B62\u65E5\u671F\u63D0\u9192",
    description: "\u622A\u6B62\u524D 30 \u5929\u5728\u5E94\u7528\u5185\u63D0\u793A",
    checked: remind,
    onChange: setRemind
  }))), /*#__PURE__*/React.createElement("div", {
    style: savedStyles.list
  }, rows.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "bookmark",
    title: "\u8FD8\u6CA1\u6709\u6536\u85CF\u7684\u9662\u6821",
    description: "\u5728\u5217\u8868\u91CC\u70B9\u4E66\u7B7E\u56FE\u6807\u5373\u53EF\u6536\u85CF\uFF0C\u65B9\u4FBF\u8FFD\u8E2A\u622A\u6B62\u65E5\u671F\u3002",
    action: /*#__PURE__*/React.createElement(Button, {
      onClick: onBrowse
    }, "\u6D4F\u89C8\u9662\u6821")
  }) : rows.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.id,
    interactive: true,
    padding: 18,
    onClick: () => onOpen(s.id)
  }, /*#__PURE__*/React.createElement("div", {
    style: savedStyles.name
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-subtle)",
      marginTop: 2
    }
  }, s.en), /*#__PURE__*/React.createElement("div", {
    style: savedStyles.deadline
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 14
  }), "\u7533\u8BF7\u622A\u6B62 ", s.deadline), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(VerifiedBadge, {
    date: s.verified,
    size: "sm",
    stale: s.stale
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, s.country))))));
}
Object.assign(window, {
  SavedScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/schools/SavedScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/schools/SearchScreen.jsx
try { (() => {
const {
  Input,
  Tag,
  Card,
  Badge,
  VerifiedBadge,
  SourceLink,
  Icon,
  IconButton,
  Eyebrow,
  EmptyState,
  Button
} = window.STAGEDesignSystem_0f9c53;
const listStyles = {
  head: {
    padding: "18px 16px 12px",
    display: "grid",
    gap: 14
  },
  h1: {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--fs-h1)",
    letterSpacing: "var(--ls-display)",
    lineHeight: 1.1,
    color: "var(--blue-950)"
  },
  chips: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    padding: "0 16px 14px",
    scrollbarWidth: "none"
  },
  count: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px 10px",
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    fontFamily: "var(--font-mono)"
  },
  list: {
    display: "grid",
    gap: 12,
    padding: "0 16px 24px"
  },
  row: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start"
  },
  name: {
    fontSize: "var(--fs-h4)",
    fontWeight: "var(--fw-semibold)",
    letterSpacing: "var(--ls-heading)",
    color: "var(--text-strong)",
    lineHeight: 1.3
  },
  en: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-subtle)",
    marginTop: 2
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: "6px 12px",
    marginTop: 14,
    fontSize: "var(--fs-xs)"
  },
  metaK: {
    color: "var(--text-subtle)"
  },
  metaV: {
    color: "var(--text-body)",
    fontFamily: "var(--font-mono)"
  },
  foot: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 14,
    paddingTop: 12,
    borderTop: "1px solid var(--border-hairline)"
  }
};
const countries = ["全部", "英国 UK", "美国 US", "德国 DE", "法国 FR"];
function SearchScreen({
  onOpen,
  saved,
  onSave,
  compare,
  onCompare
}) {
  const [q, setQ] = React.useState("");
  const [country, setCountry] = React.useState("全部");
  const all = window.SCHOOLS;
  const rows = all.filter(s => (country === "全部" || s.country === country) && (q === "" || (s.name + s.en + s.city + s.instruments.join("")).toLowerCase().includes(q.toLowerCase())));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: listStyles.head
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u9662\u6821\u4E0E\u4E13\u4E1A"), /*#__PURE__*/React.createElement("h1", {
    style: listStyles.h1
  }, "\u67E5\u7533\u8BF7\u8981\u6C42"), /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    size: "lg",
    placeholder: "\u641C\u7D22\u9662\u6821\u3001\u57CE\u5E02\u6216\u4E13\u4E1A",
    value: q,
    onChange: e => setQ(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: listStyles.chips
  }, countries.map(c => /*#__PURE__*/React.createElement(Tag, {
    key: c,
    selected: c === country,
    onClick: () => setCountry(c)
  }, c)), /*#__PURE__*/React.createElement(Tag, {
    onClick: () => {}
  }, "\u7855\u58EB Master"), /*#__PURE__*/React.createElement(Tag, {
    onClick: () => {}
  }, "\u94A2\u7434 Piano")), /*#__PURE__*/React.createElement("div", {
    style: listStyles.count
  }, /*#__PURE__*/React.createElement("span", null, rows.length, " \u6240\u9662\u6821 \xB7 \u5171 ", all.length, " \u6240\u5DF2\u6536\u5F55"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-text)"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "sliders-horizontal",
    label: "\u7B5B\u9009",
    size: "sm",
    variant: "outline"
  }))), /*#__PURE__*/React.createElement("div", {
    style: listStyles.list
  }, rows.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "search",
    title: "\u6CA1\u6709\u5339\u914D\u7684\u9662\u6821",
    description: "\u6362\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u6E05\u9664\u7B5B\u9009\u6761\u4EF6\u518D\u8BD5\u3002",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => {
        setQ("");
        setCountry("全部");
      }
    }, "\u6E05\u9664\u7B5B\u9009")
  }) : rows.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.id,
    interactive: true,
    padding: 18,
    onClick: () => onOpen(s.id)
  }, /*#__PURE__*/React.createElement("div", {
    style: listStyles.row
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: listStyles.name
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: listStyles.en
  }, s.en), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, s.country), s.degrees.slice(0, 2).map(d => /*#__PURE__*/React.createElement(Badge, {
    key: d,
    tone: "brand"
  }, d)))), /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onSave(s.id);
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "bookmark",
    label: "\u6536\u85CF",
    active: saved.includes(s.id)
  }))), /*#__PURE__*/React.createElement("div", {
    style: listStyles.metaGrid
  }, /*#__PURE__*/React.createElement("span", {
    style: listStyles.metaK
  }, "\u8BED\u8A00\u8981\u6C42"), /*#__PURE__*/React.createElement("span", {
    style: listStyles.metaV
  }, s.lang), /*#__PURE__*/React.createElement("span", {
    style: listStyles.metaK
  }, "\u7533\u8BF7\u622A\u6B62"), /*#__PURE__*/React.createElement("span", {
    style: listStyles.metaV
  }, s.deadline), /*#__PURE__*/React.createElement("span", {
    style: listStyles.metaK
  }, "\u5B66\u8D39"), /*#__PURE__*/React.createElement("span", {
    style: listStyles.metaV
  }, s.fee)), /*#__PURE__*/React.createElement("div", {
    style: listStyles.foot
  }, /*#__PURE__*/React.createElement(VerifiedBadge, {
    date: s.verified,
    size: "sm",
    stale: s.stale
  }), /*#__PURE__*/React.createElement(SourceLink, {
    href: "#",
    domain: s.domain,
    size: "sm",
    label: "\u6765\u6E90"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    },
    onClick: e => {
      e.stopPropagation();
      onCompare(s.id);
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-medium)",
      color: compare.includes(s.id) ? "var(--blue-700)" : "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: compare.includes(s.id) ? "check" : "plus",
    size: 14,
    strokeWidth: 2
  }), compare.includes(s.id) ? "已加入对比" : "加入对比")))))));
}
Object.assign(window, {
  SearchScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/schools/SearchScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/schools/data.js
try { (() => {
window.SCHOOLS = [{
  id: "rcm",
  name: "皇家音乐学院",
  en: "Royal College of Music",
  city: "伦敦 London",
  country: "英国 UK",
  degrees: ["本科 Bachelor", "硕士 Master"],
  lang: "IELTS 6.0",
  langNote: "写作不低于 5.5",
  deadline: "2026-10-01",
  fee: "£32,600 / 年",
  verified: "2026-07-14",
  domain: "rcm.ac.uk",
  audition: "现场演奏两首不同风格作品，其中一首为 1900 年后创作",
  auditionNote: "现场演奏，不接受录像替代",
  interview: "现场面试；国际申请人可申请线上面试",
  interviewVerified: "2025-11-02",
  interviewStale: true,
  materials: "作品集不适用；需提交推荐信 2 封、成绩单、护照",
  scholarship: null,
  instruments: ["钢琴 Piano", "小提琴 Violin", "声乐 Voice", "作曲 Composition"]
}, {
  id: "curtis",
  name: "柯蒂斯音乐学院",
  en: "Curtis Institute of Music",
  city: "费城 Philadelphia",
  country: "美国 US",
  degrees: ["本科 Bachelor", "硕士 Master"],
  lang: "TOEFL 84",
  langNote: "不接受 Duolingo",
  deadline: "2026-12-11",
  fee: "全额奖学金制",
  verified: "2026-07-02",
  domain: "curtis.edu",
  audition: "预筛录像 + 现场试奏；曲目按专业分列",
  auditionNote: "预筛录像截止早于申请截止",
  interview: "现场试奏当日安排面谈",
  interviewVerified: "2026-07-02",
  materials: "推荐信 3 封、成绩单、预筛录像",
  scholarship: "全部录取学生享全额学费奖学金",
  instruments: ["钢琴 Piano", "大提琴 Cello", "指挥 Conducting"]
}, {
  id: "hmtmh",
  name: "汉诺威音乐戏剧媒体学院",
  en: "HMTM Hannover",
  city: "汉诺威 Hannover",
  country: "德国 DE",
  degrees: ["本科 Bachelor", "硕士 Master"],
  lang: "DSH-2 / TestDaF 4",
  langNote: "部分英语授课专业接受 IELTS 6.5",
  deadline: "2026-11-30",
  fee: "学期注册费 €440",
  verified: "2026-06-28",
  domain: "hmtm-hannover.de",
  audition: "现场入学考试，分两轮；曲目由院系公布",
  auditionNote: null,
  interview: "第二轮含专业面谈",
  interviewVerified: "2026-06-28",
  materials: "成绩单、语言证明、简历",
  scholarship: null,
  instruments: ["钢琴 Piano", "小提琴 Violin", "指挥 Conducting"]
}, {
  id: "cnsmdp",
  name: "巴黎国立高等音乐舞蹈学院",
  en: "CNSMDP",
  city: "巴黎 Paris",
  country: "法国 FR",
  degrees: ["本科 Bachelor", "硕士 Master"],
  lang: "法语 B2",
  langNote: "以院系要求为准",
  deadline: "2026-10-15",
  fee: "€560 / 年",
  verified: "2025-10-20",
  domain: "conservatoiredeparis.fr",
  audition: "现场考试；曲目清单每年更新",
  auditionNote: "曲目清单以当年官网公布为准",
  interview: null,
  interviewVerified: null,
  materials: "成绩单、语言证明",
  scholarship: null,
  instruments: ["钢琴 Piano", "长笛 Flute", "作曲 Composition"],
  stale: true
}, {
  id: "juilliard",
  name: "茱莉亚学院",
  en: "The Juilliard School",
  city: "纽约 New York",
  country: "美国 US",
  degrees: ["本科 Bachelor", "硕士 Master", "博士 Doctoral"],
  lang: "TOEFL 89",
  langNote: "IELTS 7.0 亦可",
  deadline: "2026-12-01",
  fee: "$55,500 / 年",
  verified: "2026-07-09",
  domain: "juilliard.edu",
  audition: "预筛录像 + 现场试奏",
  auditionNote: null,
  interview: "部分专业含面谈",
  interviewVerified: "2026-07-09",
  materials: "预筛录像、推荐信 3 封、成绩单",
  scholarship: "按需与按专业发放",
  instruments: ["钢琴 Piano", "小提琴 Violin", "声乐 Voice", "爵士 Jazz"]
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/schools/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.DataRow = __ds_scope.DataRow;

__ds_ns.SourceLink = __ds_scope.SourceLink;

__ds_ns.StatFigure = __ds_scope.StatFigure;

__ds_ns.VerifiedBadge = __ds_scope.VerifiedBadge;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
