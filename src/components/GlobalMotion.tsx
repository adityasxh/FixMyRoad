"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_SELECTOR = [
  ".account-summary-grid > *", ".account-content-grid > *", ".account-panel",
  ".account-report-row", ".report-form-card", ".report-side-card",
  ".report-form-section-title", ".report-card", ".auth-card", ".auth-benefits",
  ".stats-grid > *", ".map-column", ".queue-panel", ".report-row",
  ".bottom-grid > *", ".info-card", ".hero-copy", ".hero-stamp",
  ".section-heading", ".map-layout", ".account-welcome", ".report-page-heading",
].join(",");

export default function GlobalMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector("main") ?? document.body;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lazyImages = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
        if (!img.classList.contains("engineer-illustration")) {
          img.loading = "lazy";
          img.decoding = "async";
        }
      });
    };
    lazyImages(root);

    if (reduceMotion || !("IntersectionObserver" in window)) {
      root.querySelectorAll(REVEAL_SELECTOR).forEach((item) => item.classList.add("global-reveal", "is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
        else entry.target.classList.remove("is-visible");
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });

    const observe = (scope: ParentNode) => {
      scope.querySelectorAll(REVEAL_SELECTOR).forEach((item) => {
        item.classList.add("global-reveal");
        observer.observe(item);
      });
    };
    observe(root);

    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.matches(REVEAL_SELECTOR)) {
            node.classList.add("global-reveal");
            observer.observe(node);
          }
          observe(node);
          lazyImages(node);
        }
      }));
    });
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
