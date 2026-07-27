-- Onboarding questionnaire answers collected right after payment.
-- JSONB keyed by question id (stable) → chosen option (string). NULL until
-- the customer completes the questionnaire — the /dating/success page
-- uses NULL vs non-NULL to decide whether to show the questions or the
-- upload UI. Orders paid before this migration stay NULL and the flow
-- treats them as "questionnaire pending".
alter table dating_orders
  add column if not exists questionnaire_answers jsonb;
