#!/usr/bin/env bash
# CI-only disposable Postgres test. NO Neon connection, no published network port.
set -euo pipefail
BASE="$(cd "$(dirname "$0")" && pwd)"
CT="li_idempotency_ci_$(date +%s)_$$"
HTTP_CT=""
HTTP_NET=""
cleanup() {
  if [[ -n "$HTTP_CT" ]]; then docker stop "$HTTP_CT" >/dev/null 2>&1 || true; fi
  docker stop "$CT" >/dev/null 2>&1 || true
  if [[ -n "$HTTP_NET" ]]; then docker network rm "$HTTP_NET" >/dev/null 2>&1 || true; fi
}
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
grep -Fq "CI_ONLY_DATABASE_REQUIRED" "$BASE/ci-only-rollback.sql"
query < "$BASE/ci-only-rollback.sql" > /tmp/li_pg_rollback_run.log
grep -Fq "LI_PG_ROLLBACK_REHEARSAL_21_TO_24_PASS" /tmp/li_pg_rollback_run.log
echo "PASS PG-21..24: RPC disabled, old DML grants restored, state/receipt retained, RLS enforced"
echo "LI_POSTGRES_IDEMPOTENCY_CI_PASS 24/24 (mock identities, NO real JWT)"

# SYNC-13B: real PostgREST service over loopback only; ephemeral signed JWT.
# Runs AFTER SQL rollback rehearsal, then returns to RPC-only privileges.
grep -Fq "CI_ONLY_DATABASE_REQUIRED" "$BASE/ci-only-http-preflight.sql"
query < "$BASE/ci-only-http-preflight.sql" > /tmp/li_pg_http_preflight.log
grep -Fq "LI_CI_POSTGREST_PREFLIGHT_READY" /tmp/li_pg_http_preflight.log
HTTP_NET="li_pg_http_$(date +%s)_$$"
docker network create "$HTTP_NET" >/dev/null
docker network connect --alias pgci "$HTTP_NET" "$CT"
HTTP_CT="li_pgrest_ci_$(date +%s)_$$"
echo "Starting disposable PostgREST v16.6, published to 127.0.0.1 ONLY"
docker run --rm -d --name "$HTTP_CT" --network "$HTTP_NET" \
  -p 127.0.0.1:28794:3000 \
  -e PGRST_DB_URI="postgres://li_ci_authenticator:li-ci-postgrest-local-only-password@pgci:5432/li_idempotency_ci" \
  -e PGRST_DB_SCHEMAS=public \
  -e PGRST_DB_ANON_ROLE=li_ci_anon \
  -e PGRST_JWT_SECRET=li-ci-postgrest-hs256-secret-very-long-2026 \
  -e PGRST_SERVER_HOST=0.0.0.0 \
  postgrest/postgrest:v16.6 >/dev/null
for i in $(seq 1 60); do
  code="$(curl --silent --max-time 1 --output /dev/null --write-out "%{http_code}" http://127.0.0.1:28794/ || true)"
  if [[ "$code" != "000" && -n "$code" ]]; then break; fi
  if ((i==60)); then
    docker logs "$HTTP_CT" 2>&1 | tail -40
    echo "FAIL: disposable PostgREST never became ready" >&2; exit 1
  fi
  sleep 0.3
done
LI_POSTGREST_CI_URL=http://127.0.0.1:28794 \
LI_POSTGREST_CI_SECRET=li-ci-postgrest-hs256-secret-very-long-2026 \
node --test "$BASE/ci-only-postgrest-http.test.mjs"
echo "LI_POSTGREST_HTTP_CI_PASS 13/13 (disposable signed CI JWT; NOT Neon signed JWT)"
