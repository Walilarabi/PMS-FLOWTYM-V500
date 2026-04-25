-- ═══════════════════════════════════════════════════════════════════════════
-- FLOWTYM PMS — ÉTAPE 1 : NETTOYAGE
-- Exécuter CE fichier EN PREMIER dans Supabase SQL Editor
-- Puis exécuter init_database.sql
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS ereporting_batches        CASCADE;
DROP TABLE IF EXISTS pdp_exchange_logs         CASCADE;
DROP TABLE IF EXISTS invoice_pdp_status        CASCADE;
DROP TABLE IF EXISTS cash_counts               CASCADE;
DROP TABLE IF EXISTS documents                 CASCADE;
DROP TABLE IF EXISTS alerts                    CASCADE;
DROP TABLE IF EXISTS lost_found_items          CASCADE;
DROP TABLE IF EXISTS cash_register             CASCADE;
DROP TABLE IF EXISTS maintenance_tasks         CASCADE;
DROP TABLE IF EXISTS staff_schedules           CASCADE;
DROP TABLE IF EXISTS room_cleaning_tasks       CASCADE;
DROP TABLE IF EXISTS avoirs                    CASCADE;
DROP TABLE IF EXISTS invoices                  CASCADE;
DROP TABLE IF EXISTS prestations               CASCADE;
DROP TABLE IF EXISTS payments                  CASCADE;
DROP TABLE IF EXISTS reservations              CASCADE;
DROP TABLE IF EXISTS group_reservations        CASCADE;
DROP TABLE IF EXISTS guest_history             CASCADE;
DROP TABLE IF EXISTS guests                    CASCADE;
DROP TABLE IF EXISTS rate_plans                CASCADE;
DROP TABLE IF EXISTS exchange_rates            CASCADE;
DROP TABLE IF EXISTS staff_members             CASCADE;
DROP TABLE IF EXISTS rooms                     CASCADE;
DROP TABLE IF EXISTS hotels                    CASCADE;

DROP VIEW IF EXISTS v_exp01_occupation         CASCADE;
DROP VIEW IF EXISTS v_exp09_noshow             CASCADE;
DROP VIEW IF EXISTS v_exp10_departures         CASCADE;
DROP VIEW IF EXISTS v_sta01_dashboard          CASCADE;
DROP VIEW IF EXISTS v_sta05_channels           CASCADE;
DROP VIEW IF EXISTS v_sta06_nationalities      CASCADE;
DROP VIEW IF EXISTS v_fin02_payments           CASCADE;
DROP VIEW IF EXISTS v_fin09_tva                CASCADE;
DROP VIEW IF EXISTS v_cli01_debtors            CASCADE;
DROP VIEW IF EXISTS v_cli05_clv                CASCADE;
DROP VIEW IF EXISTS v_dir01_direction          CASCADE;

-- ✅ Tables nettoyées. Exécutez maintenant init_database.sql
