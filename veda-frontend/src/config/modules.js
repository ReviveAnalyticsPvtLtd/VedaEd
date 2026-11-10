import sisModule from "../modules/sis/module.config";

/**
 * Central module registry.
 *
 * Phase 1 only registers SIS. Other modules will be added here as they are
 * migrated, and routing/sidebar/dashboard code can then read from this registry
 * instead of keeping per-role module lists.
 */
export const MODULES = {
  [sisModule.id]: sisModule,
};

export const MODULE_LIST = Object.values(MODULES);

export function getModule(moduleId) {
  return MODULES[moduleId] || null;
}

export default MODULES;
