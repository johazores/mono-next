"use client";

import { useEffect } from "react";
import { useSiteConfig } from "./site-config-provider";

export function DynamicHead() {
  const { title, favicon } = useSiteConfig();

  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  useEffect(() => {
    if (!favicon) return;

    let link = document.querySelector(
      "link[rel='icon']",
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = favicon;
  }, [favicon]);

  return null;
}
