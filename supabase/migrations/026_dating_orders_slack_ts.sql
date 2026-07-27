-- The Slack root message ts (from chat.postMessage) is needed to (a) reply
-- in-thread on later status transitions and (b) chat.update the header so
-- the message reflects the current order state. Stored per-order; NULL for
-- orders created before this feature or when the Slack bot fails.
alter table dating_orders
  add column if not exists slack_sales_thread_ts text;
