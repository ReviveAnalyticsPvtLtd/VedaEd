/**
 * Superadmin SIS layout.
 *
 * Phase 1: re-export the shared SIS layout so both admin and superadmin use a
 * single implementation. Kept as a re-export so existing App.js imports do not
 * need to change during the migration.
 */
export { default } from "../../modules/sis/SisLayout";
