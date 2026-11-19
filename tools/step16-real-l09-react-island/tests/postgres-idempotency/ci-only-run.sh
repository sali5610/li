#!/usr/bin/env bash
# CI-only disposable Postgres test. NO Neon connection, no published network port.
set -euo pipefail
BASE="$(cd "$(dirname "$0")" && pwd)"
CT="li_idempotency_ci_$(date +%s)_$$"
cleanup() { docker stop "$CT" >/dev/null 2>&1 || true; }
trap cleanup EXIT
echo "Starting disposable postgres:16-alpine, local Docker only"
docker run --rm -d --name "$CT" \
  -e POSTGRES_PASSWORD=ci-only-non-secret \
  -e POSTGRES_DB=li_idempotency_ci postgres:16-alpine >/dev/null

for i in $(seq 1 70); do
  if docker logs "$CT" 2>&1 | grep -Fq "PostgreSQL init process complete" && \
     docker exec "$CT" pg_isready -U postgres -d li_idempotency_ci >/dev/null 2>&1; then break; fi
  if ((i==70)); then echo "FAIL: isolated database never ready" >&2; exit 1; fi
  sleep 0.3
done
query() { docker exec -i "$CT" psql -X -A -t -v ON_ERROR_STOP=1 -U postgres -d li_idempotency_ci; }
one() { docker exec "$CT" psql -X -A -t -v ON_ERROR_STOP=1 -U postgres -d li_idempotency_ci -c "$1"; }

grep -Fq "CI_ONLY_DATABASE_REQUIRED" "$BASE/ci-only-schema.sql"
grep -Fq "CI_ONLY_DATABASE_REQUIRED" "$BASE/ci-only-assertions.sql"
query < "$BASE/ci-only-schema.sql" >/tmp/li_pg_schema_run.log
query < "$BASE/ci-only-assertions.sql" > /tmp/li_pg_assertions_run.log
grep -Fq "LI_PG_IDEMPOTENCY_ISOLATED_ASSERTIONS_PASS" /tmp/li_pg_assertions_run.log
echo "PASS PG-01..13: forced RLS, receipts, CAS, replay, revoke and atomic rollback"

run_first() {
  local mode="$1" op="$2" key="$3" payload="$4"
  local marker="li_pg_$mode"
  query <<SQL
BEGIN;
SET ROLE authenticated;
SELECT set_config('li.test_subject','synthetic-A',false);
SELECT public.li_apply_user_edit_v1('preference','$key','$payload'::jsonb,
 NULL,0,'$op'::uuid);
SELECT pg_sleep(4) /* $marker */;
COMMIT;
SQL
}
wait_held() {
  local marker="$1" seen="0"
  for _ in $(seq 1 80); do
    seen="$(one "SELECT count(*) FROM pg_stat_activity WHERE state='active' AND query LIKE 'SELECT pg_sleep(4)%$marker%' AND query NOT LIKE '%pg_stat_activity%';" | tail -n1)"
    if [[ "$seen" == "1" ]]; then return 0; fi
    sleep 0.1
  done
  echo "FAIL: first transaction never reached $marker" >&2
  return 1
}

same_op='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
run_first "same" "$same_op" "qa-concurrent-same" '{"value":"A"}' >/tmp/li_pg_same_first.log 2>&1 &
same_pid=$!
wait_held "li_pg_same"
same_output="$(query <<SQL
SET ROLE authenticated;
SELECT set_config('li.test_subject','synthetic-A',false);
SELECT public.li_apply_user_edit_v1('preference','qa-concurrent-same',
 '{"value":"A"}'::jsonb,NULL,0,'$same_op'::uuid)->>'kind';
SQL
)"
wait "$same_pid"
if [[ "$(printf '%s\n' "$same_output" | tail -n1)" != "replayed" ]]; then
 echo "FAIL: concurrent same operation was not replayed" >&2
 exit 1
fi
echo "PASS PG-14: concurrent same-opId replay after serialized first commit"

diff_op_a='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
diff_op_b='cccccccc-cccc-4ccc-8ccc-cccccccccccc'
run_first "different" "$diff_op_a" "qa-concurrent-different" '{"value":"first"}' >/tmp/li_pg_diff_first.log 2>&1 &
diff_pid=$!
wait_held "li_pg_different"
if query >/tmp/li_pg_diff_second.log 2>&1 <<SQL
SET ROLE authenticated;
SELECT set_config('li.test_subject','synthetic-A',false);
SELECT public.li_apply_user_edit_v1('preference','qa-concurrent-different',
 '{"value":"second"}'::jsonb,NULL,0,'$diff_op_b'::uuid);
SQL
then
 echo "FAIL: concurrent stale different-opId was accepted" >&2
 exit 1
fi
wait "$diff_pid"
grep -Fq 'LI_SYNC_REVISION_CONFLICT' /tmp/li_pg_diff_second.log
one "SELECT public.ci_assert((SELECT count(*) FROM public.li_sync_operation_receipts WHERE item_id='qa-concurrent-different')=1,'concurrent different-op receipt count');" >/dev/null
echo "PASS PG-15: concurrent different-opId stale revision blocked"
one "SELECT public.ci_assert((SELECT COUNT(*) FROM public.li_user_state)=4,'final expected synthetic rows');" >/dev/null
grep -Fq "CI_ONLY_DATABASE_REQUIRED" "$BASE/ci-only-hardening.sql"
query < "$BASE/ci-only-hardening.sql" > /tmp/li_pg_hardening_run.log
grep -Fq "LI_PG_DIRECT_DML_BYPASS_DENIED_16_TO_20_PASS" /tmp/li_pg_hardening_run.log
echo "PASS PG-16..20: server RPC only, direct INSERT/UPDATE/DELETE denied, PUBLIC EXECUTE revoked"
echo "LI_POSTGRES_IDEMPOTENCY_CI_PASS 20/20 (mock identities, NO real JWT)"
