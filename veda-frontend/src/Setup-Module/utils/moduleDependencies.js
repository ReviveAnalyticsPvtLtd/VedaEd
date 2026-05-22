import { OPTIONAL_MODULES } from "../constants/moduleSelection";

/** Payroll requires HR; Transport links with Fees (Fees is always required). */
export const MODULE_DEPENDENCY_RULES = {
  Payroll: {
    requires: ["HR"],
    message:
      "Payroll depends on HR. If Payroll is enabled, HR should also be enabled.",
  },
  Transport: {
    linksWith: ["Fees"],
    message:
      "Transport fees can link with the Fees module. Fees is already enabled as a core module.",
  },
};

/**
 * Returns active dependency warnings for the current optional selection.
 */
export function getDependencyWarnings(enabledOptional = []) {
  const warnings = [];
  const enabled = new Set(enabledOptional);

  if (enabled.has("Payroll") && !enabled.has("HR")) {
    warnings.push(MODULE_DEPENDENCY_RULES.Payroll.message);
  }

  return warnings;
}

/** Guidance messages shown in the sidebar (reference: always visible for Payroll). */
export function getDependencyGuidance(enabledOptional = []) {
  const messages = [MODULE_DEPENDENCY_RULES.Payroll.message];

  if (enabledOptional.includes("Transport")) {
    messages.push(MODULE_DEPENDENCY_RULES.Transport.message);
  }

  return messages;
}

/**
 * Resolves toggle side-effects: auto-enable HR when Payroll is turned on;
 * disable Payroll when HR is turned off.
 */
export function applyModuleToggle(key, enabledOptional, turningOn) {
  const next = new Set(enabledOptional);

  if (turningOn) {
    const module = OPTIONAL_MODULES.find((m) => m.key === key);
    if (module?.dependsOn) {
      next.add(module.dependsOn);
    }
    next.add(key);
    return {
      enabled: [...next],
      autoEnabled: module?.dependsOn && !enabledOptional.includes(module.dependsOn)
        ? [module.dependsOn]
        : [],
    };
  }

  next.delete(key);

  if (key === "HR") {
    next.delete("Payroll");
  }

  return { enabled: [...next], autoEnabled: [] };
}

// Future Update:
// Add AI-based module recommendation engine
// based on school size and usage analytics
