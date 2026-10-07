import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiArrowRight,
  FiChevronDown,
  FiChevronRight,
  FiShield,
  FiAward,
  FiCheckCircle,
  FiTrendingUp,
  FiPackage,
  FiStar,
  FiBookmark,
  FiEye,
  FiTag,
  FiClock,
  FiMessageCircle,
} from "react-icons/fi";
import { motion, useReducedMotion } from "framer-motion";

/* ═════════════════════════════════════════════════════════════
 * Guide — Grading Guide
 * Premium+ · Premium · Excellent · Very Good · Good
 * Fully responsive · image-free
 * ═════════════════════════════════════════════════════════════ */

/* ─── Grade data ─────────────────────────────────── */
const GRADES = [
  {
    id: "premium-plus",
    condition: "Premium Plus",
    label: "Premium+",
    tier: "01",
    accent: "#0A0A0A",
    icon: FiAward,
    badge: "Highest Tier",
    tagline: "Unworn · Tags attached",
    definition:
      "An item that has never been worn or used outside of a try-on. All original tags, labels, packaging, and accessories are present and intact. Any protective films or wraps remain in place.",
    bestFor:
      "Collectors, gifting, resale investments, or anyone who wants the absolute best.",
    inspectionPoints: [
      "Original retail tags attached",
      "Manufacturer packaging present",
      "Dust bag / box in original condition",
      "No creasing, fading, or marks anywhere",
      "Hardware and stitching factory-perfect",
    ],
    wear: "Never worn",
    packaging: "Full original",
    returns: "30-day full guarantee",
    priceIndex: 100,
    save: "0–10%",
  },
  {
    id: "premium",
    condition: "Premium",
    label: "Premium",
    tier: "02",
    accent: "#1E40AF",
    icon: FiCheckCircle,
    badge: "Most Wanted",
    tagline: "Worn once · Flawless",
    definition:
      "Worn once or twice for a short period in a controlled environment. No visible signs of wear under normal inspection. Every component is functionally and visually indistinguishable from new.",
    bestFor:
      "Everyday use where you want new-look quality at a meaningful discount.",
    inspectionPoints: [
      "No visible wear on soles, cuffs, or corners",
      "Original color depth and finish intact",
      "Soles/cuffs show no scratches or scuffs",
      "Hardware operates smoothly",
      "Interior lining spotless",
    ],
    wear: "Worn 1–2 times",
    packaging: "Partial original",
    returns: "30-day full guarantee",
    priceIndex: 85,
    save: "15–30%",
  },
  {
    id: "excellent",
    condition: "Excellent",
    label: "Excellent",
    tier: "03",
    accent: "#059669",
    icon: FiTrendingUp,
    badge: "Editor's Pick",
    tagline: "Barely worn · Near-perfect",
    definition:
      "Shows minimal signs of use under close inspection, but nothing visible from normal wear distance. Original finish, color, and structure remain intact throughout.",
    bestFor:
      "Regular wearers who want near-new quality without the new-price tag.",
    inspectionPoints: [
      "Faint surface marks under close inspection only",
      "Soles may show light tread wear",
      "Deep-cleaned and sanitized",
      "All zippers, buttons, straps functional",
      "No structural damage",
    ],
    wear: "Worn 3–10 times",
    packaging: "Partial or none",
    returns: "30-day full guarantee",
    priceIndex: 70,
    save: "35–50%",
  },
  {
    id: "very-good",
    condition: "Very Good",
    label: "Very Good",
    tier: "04",
    accent: "#D97706",
    icon: FiPackage,
    badge: "Best Value",
    tagline: "Lightly worn · Well kept",
    definition:
      "Shows clear signs of regular use — light scuffs, minor fading, or faint creasing — but everything functions and looks correct. Well maintained by the previous owner.",
    bestFor:
      "Budget-conscious buyers who want quality without paying premium prices.",
    inspectionPoints: [
      "Visible light wear on high-contact areas",
      "Minor creasing or patina from use",
      "Cleaned and conditioned before listing",
      "Fully functional — no repairs needed",
      "All fasteners, zippers, laces intact",
    ],
    wear: "Regular use, maintained",
    packaging: "None",
    returns: "30-day full guarantee",
    priceIndex: 55,
    save: "50–65%",
  },
  {
    id: "good",
    condition: "Good",
    label: "Good",
    tier: "05",
    accent: "#B45309",
    icon: FiShield,
    badge: "Entry Point",
    tagline: "Worn · Full of character",
    definition:
      "Shows noticeable wear from regular use — scuffs, fading, or minor cosmetic imperfections. Structurally sound and fully functional. Character that tells a story.",
    bestFor:
      "First-time buyers, everyday beaters, or anyone who values function over finish.",
    inspectionPoints: [
      "Visible scuffs, fading, or marks",
      "May show patina or age-related character",
      "Deep-cleaned and inspected for defects",
      "Fully functional — usable as intended",
      "Any repairs disclosed upfront",
    ],
    wear: "Heavy but functional",
    packaging: "None",
    returns: "30-day full guarantee",
    priceIndex: 40,
    save: "60–75%",
  },
];

/* ─── Inspection checklist ───────────────────────── */
const CHECKLIST = [
  {
    icon: FiEye,
    title: "Visual inspection",
    body: "Every item is photographed from 8 angles under neutral lighting. Fading, discoloration, and surface marks are documented.",
  },
  {
    icon: FiTag,
    title: "Authenticity check",
    body: "Brand stamps, serial numbers, and stitching patterns are verified against manufacturer databases.",
  },
  {
    icon: FiShield,
    title: "Structural integrity",
    body: "Zippers, buttons, soles, seams, and hardware are stress-tested. Any repair is disclosed in the listing.",
  },
  {
    icon: FiStar,
    title: "Cleaning & conditioning",
    body: "Leather is conditioned, textiles are deep-cleaned, and metals are polished before listing.",
  },
  {
    icon: FiClock,
    title: "Final review",
    body: "A second inspector signs off on the grade. Grades are re-verified if an item is returned.",
  },
];

/* ─── FAQ ────────────────────────────────────────── */
const FAQS = [
  {
    q: "What's the difference between Premium and Premium+?",
    a: "Premium+ items have never been worn and still carry original tags and packaging. Premium items have been worn once or twice but show no visible signs of wear.",
  },
  {
    q: "Can I return an item if the grade doesn't match?",
    a: "Yes. Every purchase includes a 30-day full guarantee. If the item arrives in a condition that doesn't match its listed grade, we'll refund you in full.",
  },
  {
    q: "Do Good-grade items have holes or tears?",
    a: "No. Good-grade items show visible wear like scuffs or fading, but are structurally sound with no holes, tears, or broken components unless explicitly stated.",
  },
  {
    q: "How do you determine which grade to assign?",
    a: "Two inspectors independently review each item. If they disagree, the item is downgraded to the lower grade to keep our standard consistent.",
  },
  {
    q: "Are repairs and alterations disclosed?",
    a: "Always. Any repair, replacement part, or alteration is documented with photos and noted in the product listing.",
  },
  {
    q: "Can I request additional photos before buying?",
    a: "Yes. Contact support with the item ID and we'll send additional photos within 24 hours.",
  },
];

/* ─── Motion ─────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ═════════════════════════════════════════════════════════════
 * Hero
 * ═════════════════════════════════════════════════════════════ */
const GuideHero = () => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    className="mx-auto max-w-3xl"
  >
    <div className="inline-flex items-center gap-2">
      <span className="h-px w-6 bg-zinc-900 dark:bg-white sm:w-8" />
      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400 sm:text-[11px] sm:tracking-[0.24em]">
        The Grading Guide
      </span>
    </div>

    <h1 className="mt-4 text-[clamp(1.85rem,1.1rem+3.2vw,4.25rem)] font-black leading-[1.05] tracking-[-0.03em] text-zinc-900 dark:text-white sm:mt-5">
      Every stitch, seam, and scuff —
      <span className="block text-zinc-400 dark:text-zinc-600">
        graded the same way, every time.
      </span>
    </h1>

    <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-6 sm:text-[15px] lg:text-base">
      Our 5-tier grading scale is the backbone of FeatheredShop. Two inspectors review every
      item against the same checklist, so what you see is exactly what you get — no surprises.
    </p>

    <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
      <Link
        to="/conditions"
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto sm:px-6 sm:text-sm"
      >
        Browse by grade
        <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <a
        href="#grades"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-[13.5px] font-semibold text-zinc-800 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:w-auto sm:px-6 sm:text-sm"
      >
        Jump to grades
        <FiChevronDown className="h-4 w-4" />
      </a>
    </div>
  </motion.div>
);

/* ═════════════════════════════════════════════════════════════
 * Sticky quick nav
 * ═════════════════════════════════════════════════════════════ */
const QuickNav = ({ activeId }) => {
  const items = [
    { id: "overview", label: "Overview" },
    { id: "grades", label: "Grades" },
    { id: "checklist", label: "Inspection" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <nav
      aria-label="Guide sections"
      className="sticky top-0 z-30 w-full border-b border-zinc-200/80 bg-white/85 backdrop-blur-lg dark:border-zinc-800/80 dark:bg-zinc-950/85"
    >
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] sm:gap-2 sm:px-6 sm:py-3 lg:px-8 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors sm:px-4 sm:py-2 sm:text-[13px] ${
                active
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
};

/* ═════════════════════════════════════════════════════════════
 * Grade panel
 * ═════════════════════════════════════════════════════════════ */
const GradePanel = ({ grade, open, onToggle }) => {
  const Icon = grade.icon;
  const panelId = `grade-panel-${grade.id}`;
  const buttonId = `grade-button-${grade.id}`;

  return (
    <motion.article
      layout
      variants={itemVariants}
      id={grade.id}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 sm:rounded-3xl"
    >
      <button
        type="button"
        id={buttonId}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="group relative flex w-full items-stretch text-left"
      >
        <div
          className="w-1 shrink-0 sm:w-1.5"
          style={{ background: grade.accent }}
          aria-hidden="true"
        />

        <div className="flex flex-1 items-center gap-3 p-4 sm:gap-5 sm:p-6">
          <div className="relative shrink-0">
            <span
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl"
              style={{ background: grade.accent }}
            >
              <Icon className="h-4.5 w-4.5 sm:h-6 sm:w-6" aria-hidden="true" />
            </span>
            <span
              aria-hidden="true"
              className="absolute -bottom-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[9px] font-black tabular-nums text-zinc-900 ring-2 ring-white dark:bg-zinc-900 dark:text-white dark:ring-zinc-900 sm:h-7 sm:min-w-[28px] sm:text-[11px]"
            >
              {grade.tier}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-base font-black tracking-tight text-zinc-900 dark:text-white sm:text-xl lg:text-2xl">
                {grade.label}
              </h3>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:text-[10px]"
                style={{
                  background: `${grade.accent}15`,
                  color: grade.accent,
                }}
              >
                {grade.badge}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500 sm:mt-1 sm:text-[12.5px]">
              {grade.tagline}
            </p>
          </div>

          {/* Save badge — desktop */}
          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Save
              </p>
              <p className="text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                {grade.save}
              </p>
            </div>
          </div>

          <FiChevronDown
            className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-300 sm:h-5 sm:w-5 ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Body */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid transition-[grid-template-rows,opacity] duration-400 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-zinc-100 px-4 py-5 dark:border-zinc-800/70 sm:px-6 sm:py-8">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
              {/* Left */}
              <div className="min-w-0">
                <p className="text-[13.5px] leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-[14.5px]">
                  {grade.definition}
                </p>

                <h4 className="mt-5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500 sm:mt-6 sm:text-[11px]">
                  What we check
                </h4>
                <ul className="mt-3 space-y-2">
                  {grade.inspectionPoints.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2.5 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-[13.5px]"
                    >
                      <FiCheckCircle
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
                        style={{ color: grade.accent }}
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/40 sm:mt-6">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500 sm:text-[11px]">
                    Best for
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-[13.5px]">
                    {grade.bestFor}
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="min-w-0">
                <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/70">
                  <dl className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                    {[
                      ["Wear", grade.wear],
                      ["Packaging", grade.packaging],
                      ["Returns", grade.returns],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 sm:py-3"
                      >
                        <dt className="text-[11.5px] font-medium text-zinc-500 dark:text-zinc-500 sm:text-[12px]">
                          {k}
                        </dt>
                        <dd className="text-right text-[12px] font-semibold text-zinc-900 dark:text-white sm:text-[12.5px]">
                          {v}
                        </dd>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:py-3">
                      <dt className="text-[11.5px] font-medium text-zinc-500 dark:text-zinc-500 sm:text-[12px]">
                        Typical saving
                      </dt>
                      <dd className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 sm:text-[12.5px]">
                        {grade.save}
                      </dd>
                    </div>
                  </dl>

                  <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500 sm:text-[11px]">
                        Price index
                      </span>
                      <span className="text-[11.5px] font-bold tabular-nums text-zinc-900 dark:text-white">
                        {grade.priceIndex}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${grade.priceIndex}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: grade.accent }}
                      />
                    </div>
                  </div>
                </div>

                <Link
                  to={`/shop?condition=${encodeURIComponent(grade.condition)}`}
                  className="mt-4 inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[13px] font-semibold text-zinc-900 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                >
                  Shop {grade.label}
                  <FiChevronRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

/* ═════════════════════════════════════════════════════════════
 * Checklist
 * ═════════════════════════════════════════════════════════════ */
const ChecklistSection = () => (
  <section id="checklist" className="scroll-mt-24">
    <div className="max-w-2xl">
      <div className="inline-flex items-center gap-2">
        <span className="h-px w-6 bg-zinc-900 dark:bg-white sm:w-8" />
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400 sm:text-[11px] sm:tracking-[0.24em]">
          The Inspection
        </span>
      </div>
      <h2 className="mt-4 text-[clamp(1.65rem,1.1rem+2.2vw,3rem)] font-black leading-[1.08] tracking-tight text-zinc-900 dark:text-white">
        Five checks before anything goes live.
      </h2>
      <p className="mt-4 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-[14.5px] lg:text-base">
        Every item passes through the same 5-step review. If any step fails, the item is
        either regraded or rejected entirely.
      </p>
    </div>

    <motion.ol
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
    >
      {CHECKLIST.map((step, i) => {
        const Icon = step.icon;
        return (
          <motion.li
            key={step.title}
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-zinc-700 sm:rounded-3xl sm:p-6"
          >
            <span
              aria-hidden="true"
              className="absolute -top-3 -right-1 text-[4rem] font-black leading-none text-zinc-100 select-none dark:text-zinc-800/60 sm:-top-4 sm:-right-2 sm:text-[5rem]"
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 sm:h-11 sm:w-11 sm:rounded-2xl">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </span>

            <h3 className="relative mt-3 text-[14px] font-black tracking-tight text-zinc-900 dark:text-white sm:mt-4 sm:text-[15px]">
              {step.title}
            </h3>
            <p className="relative mt-1.5 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-2 sm:text-[13px]">
              {step.body}
            </p>
          </motion.li>
        );
      })}
    </motion.ol>
  </section>
);

/* ═════════════════════════════════════════════════════════════
 * FAQ item
 * ═════════════════════════════════════════════════════════════ */
const FaqItem = ({ item, open, onToggle, index }) => {
  const id = `faq-${index}`;
  return (
    <motion.div
      variants={itemVariants}
      className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 sm:px-6 sm:py-5"
      >
        <span className="text-[13.5px] font-bold tracking-tight text-zinc-900 dark:text-white sm:text-[15px]">
          {item.q}
        </span>
        <FiChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>
      <div
        id={id}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="border-t border-zinc-100 px-4 py-4 text-[13px] leading-relaxed text-zinc-600 dark:border-zinc-800/70 dark:text-zinc-400 sm:px-6 sm:py-5 sm:text-[13.5px]">
            {item.a}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

/* ═════════════════════════════════════════════════════════════
 * Main
 * ═════════════════════════════════════════════════════════════ */
const Guide = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openGradeParam = searchParams.get("grade");

  const [openGrade, setOpenGrade] = useState(openGradeParam || "premium-plus");
  const [openFaq, setOpenFaq] = useState(-1);

  /* Sync grade → URL */
  useEffect(() => {
    if (openGrade === openGradeParam) return;
    const next = new URLSearchParams(searchParams);
    if (openGrade) next.set("grade", openGrade);
    else next.delete("grade");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openGrade]);

  /* Scroll spy */
  const [activeSection, setActiveSection] = useState("overview");
  useEffect(() => {
    const ids = ["overview", "grades", "checklist", "faq"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const toggleGrade = useCallback(
    (id) => setOpenGrade((curr) => (curr === id ? "" : id)),
    []
  );
  const toggleFaq = useCallback(
    (i) => setOpenFaq((curr) => (curr === i ? -1 : i)),
    []
  );

  const stats = useMemo(
    () => [
      { label: "Grades", value: "5" },
      { label: "Inspections", value: "2×" },
      { label: "Return window", value: "30 days" },
      { label: "Items graded", value: "12k+" },
    ],
    []
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-zinc-50/40 to-white dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950">
      {/* ─── Hero ─── */}
      <header id="overview" className="relative overflow-hidden scroll-mt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -top-40 right-[8%] h-72 w-72 rounded-full bg-gradient-to-tr from-amber-200/60 to-rose-200/40 opacity-40 blur-3xl dark:from-amber-500/10 dark:to-rose-500/10 sm:h-[420px] sm:w-[420px] lg:h-[520px] lg:w-[520px]" />
          <div className="absolute -bottom-40 left-[5%] h-72 w-72 rounded-full bg-gradient-to-tr from-sky-200/60 to-violet-200/40 opacity-40 blur-3xl dark:from-sky-500/10 dark:to-violet-500/10 sm:h-[420px] sm:w-[420px] lg:h-[520px] lg:w-[520px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-24">
          <GuideHero />

          {/* Stat strip */}
          <motion.dl
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:grid-cols-4 sm:gap-5 lg:gap-6"
          >
            {stats.map((s) => (
              <motion.div
                key={s.label}
                variants={itemVariants}
                className="rounded-2xl border border-zinc-200/80 bg-white/70 px-3.5 py-3.5 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/50 sm:px-5 sm:py-5"
              >
                <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 sm:text-[10.5px]">
                  {s.label}
                </dt>
                <dd className="mt-1 text-lg font-black tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
                  {s.value}
                </dd>
              </motion.div>
            ))}
          </motion.dl>
        </div>
      </header>

      {/* ─── Sticky nav ─── */}
      <QuickNav activeId={activeSection} />

      {/* ─── Grades ─── */}
      <section id="grades" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2">
              <span className="h-px w-6 bg-zinc-900 dark:bg-white sm:w-8" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400 sm:text-[11px] sm:tracking-[0.24em]">
                The 5 Tiers
              </span>
            </div>
            <h2 className="mt-4 text-[clamp(1.65rem,1.1rem+2.2vw,3rem)] font-black leading-[1.08] tracking-tight text-zinc-900 dark:text-white">
              Pick a grade to see the full breakdown.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-[14.5px] lg:text-base">
              Tap any tier to expand its definition, inspection points, and pricing index.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-8 space-y-3 sm:mt-10 sm:space-y-4"
          >
            {GRADES.map((grade) => (
              <GradePanel
                key={grade.id}
                grade={grade}
                open={openGrade === grade.id}
                onToggle={() => toggleGrade(grade.id)}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Checklist ─── */}
      <div className="border-t border-zinc-200/80 dark:border-zinc-800/80">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <ChecklistSection />
        </div>
      </div>

      {/* ─── FAQ ─── */}
      <section
        id="faq"
        className="scroll-mt-24 border-t border-zinc-200/80 dark:border-zinc-800/80"
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
            {/* Sticky heading */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="inline-flex items-center gap-2">
                <span className="h-px w-6 bg-zinc-900 dark:bg-white sm:w-8" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400 sm:text-[11px] sm:tracking-[0.24em]">
                  FAQ
                </span>
              </div>
              <h2 className="mt-4 text-[clamp(1.65rem,1.1rem+2.2vw,2.5rem)] font-black leading-[1.08] tracking-tight text-zinc-900 dark:text-white">
                Still wondering?
              </h2>
              <p className="mt-4 text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-[14.5px]">
                The most common questions we get about grading, condition, and returns.
                If yours isn't here, we're one message away.
              </p>

              <Link
                to="/contact"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-[12.5px] font-semibold text-zinc-800 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:text-[13px]"
              >
                <FiMessageCircle className="h-4 w-4" />
                Contact support
              </Link>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="space-y-2.5 sm:space-y-3"
            >
              {FAQS.map((item, i) => (
                <FaqItem
                  key={item.q}
                  item={item}
                  index={i}
                  open={openFaq === i}
                  onToggle={() => toggleFaq(i)}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Footer CTA ─── */}
      <section className="border-t border-zinc-200/80 dark:border-zinc-800/80">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-900 to-zinc-800 px-5 py-8 text-center dark:border-zinc-800 dark:from-zinc-900 dark:to-black sm:rounded-3xl sm:px-10 sm:py-14"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400/40 via-rose-400/30 to-violet-400/30 blur-3xl opacity-40"
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 backdrop-blur">
                <FiBookmark className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 sm:text-[11px]">
                  Ready to shop
                </span>
              </div>

              <h3 className="mt-5 text-[clamp(1.35rem,1rem+1.4vw,2.25rem)] font-black leading-[1.15] tracking-tight text-white">
                You know the grades. Now pick yours.
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-[13.5px] leading-relaxed text-zinc-300 sm:text-[14.5px] lg:text-base">
                Browse thousands of curated items across all five tiers — every one inspected,
                graded, and backed by our guarantee.
              </p>

              <div className="mt-6 flex flex-col justify-center gap-2.5 sm:mt-7 sm:flex-row sm:gap-3">
                <Link
                  to="/conditions"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-semibold text-zinc-900 shadow-lg shadow-black/30 transition-all hover:bg-zinc-100 active:scale-[0.98] sm:px-6 sm:py-3 sm:text-sm"
                >
                  Browse by grade
                  <FiArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-[13px] font-semibold text-white backdrop-blur transition-all hover:bg-white/10 active:scale-[0.98] sm:px-6 sm:py-3 sm:text-sm"
                >
                  Shop all items
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Guide;