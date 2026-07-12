"use client";

import { useEffect } from "react";

const SCRIPT_ID = "luban-bao-assistant";
const SCRIPT_SRC = "/assets/js/firebase-ai-chatbot.js";

/**
 * Loads the self-contained Bao live AI assistant module (vendored from the main
 * site into /public). The module boots its own Firebase app and injects a
 * floating chat launcher, so we only need to add the module script once. It is
 * an ES module, which the browser caches after first evaluation, so we never
 * remove it — subsequent mounts are no-ops.
 */
export function BaoAssistant() {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.type = "module";
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    document.body.appendChild(script);
  }, []);

  return null;
}
