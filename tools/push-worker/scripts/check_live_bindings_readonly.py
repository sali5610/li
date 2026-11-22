#!/usr/bin/env python3
"""Only inspect Cloudflare Worker binding metadata, never secret values or D1 rows."""
import json,os,re,sys
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError

NAME="li-push-staging"
EXPECTED_ORIGIN="https://li5610.pages.dev"
EXPECTED_NEON="https://ep-misty-snow-azfrrm3o.apirest.c-3.ap-southeast-1.aws.neon.tech/li/rest/v1"
EXPECTED_SECRET_NAMES={"VAPID_PUBLIC_KEY","VAPID_PRIVATE_KEY","VAPID_SUBJECT"}
def call(path):
    aid=os.getenv("CLOUDFLARE_ACCOUNT_ID","")
    token=os.getenv("CLOUDFLARE_API_TOKEN","")
    if not re.fullmatch(r"[a-f0-9]{32}",aid,re.I) or not token:
        raise RuntimeError("CLOUDFLARE_ACCOUNT_OR_SCOPED_TOKEN_UNAVAILABLE")
    request=Request(f"https://api.cloudflare.com/client/v4/accounts/{aid}/{path}",headers={
      "Authorization":"Bearer "+token,"Accept":"application/json",
      "User-Agent":"li-push-runtime-binding-readonly-qa/1.0"})
    try:
      with urlopen(request,timeout=20) as resp: data=json.load(resp)
    except HTTPError as e:raise RuntimeError("CLOUDFLARE_API_HTTP_"+str(e.code)) from None
    except (URLError,ValueError,TimeoutError):raise RuntimeError("CLOUDFLARE_API_UNREACHABLE") from None
    if not isinstance(data,dict) or data.get("success") is not True:
        raise RuntimeError("CLOUDFLARE_READ_UNVERIFIED")
    return data.get("result")

def main():
    settings=call(f"workers/scripts/{NAME}/settings")
    if not isinstance(settings,dict) or not isinstance(settings.get("bindings"),list):
       raise RuntimeError("WORKER_BINDINGS_UNVERIFIED")
    bindings={item.get("name"):item for item in settings["bindings"]
       if isinstance(item,dict) and isinstance(item.get("name"),str)}
    for key,expected in (("ALLOWED_ORIGIN",EXPECTED_ORIGIN),("NEON_DATA_API_URL",EXPECTED_NEON)):
        b=bindings.get(key,{})
        ok=b.get("type")=="plain_text" and b.get("text")==expected
        print(f"LI_PUSH_LIVE_{key}_"+("PASS" if ok else "MISMATCH"))
        if not ok:raise RuntimeError(key+"_MISMATCH")
    secret_names={name for name,b in bindings.items() if b.get("type")=="secret_text"}
    if not EXPECTED_SECRET_NAMES.issubset(secret_names):
        raise RuntimeError("VAPID_SECRETS_MISSING")
    print("LI_PUSH_THREE_VAPID_SECRET_NAMES_PASS (values never read)")
    db=bindings.get("PUSH_DB",{})
    if db.get("type")!="d1" or not re.fullmatch(r"[a-f0-9-]{36}",str(db.get("id","")),re.I):
       raise RuntimeError("PUSH_D1_BINDING_MISSING")
    databases=call("d1/database?per_page=100")
    matches=[b for b in databases if isinstance(b,dict) and b.get("name")==NAME]
    if len(matches)!=1 or matches[0].get("uuid")!=db.get("id"):
       raise RuntimeError("PUSH_D1_ID_MISMATCH")
    print("LI_PUSH_D1_BINDING_MATCH_PASS (ID not logged)")
    cron=call(f"workers/scripts/{NAME}/schedules")
    entries=cron.get("schedules") if isinstance(cron,dict) else None
    if not isinstance(entries,list) or len(entries)!=1 or entries[0].get("cron")!="* * * * *":
       raise RuntimeError("PUSH_MINUTE_CRON_UNVERIFIED")
    print("LI_PUSH_LIVE_CRON_EVERY_MINUTE_PASS")
    print("LI_PUSH_BINDING_READONLY_QA_PASS -- does NOT prove signed Apple subscription or Neon RPC success")

if __name__=="__main__":
    try:main()
    except Exception as e:
       print("LI_PUSH_BINDING_READONLY_QA_BLOCKED "+str(e),file=sys.stderr)
       sys.exit(1)
