/**
 * Admin SIS Parents page.
 *
 * Phase 2: re-export the shared SIS Parents page so both admin and superadmin
 * use a single implementation. Kept as a re-export so existing App.js imports
 * do not need to change during the migration.
 */
export { default } from "../modules/sis/pages/Parents";
