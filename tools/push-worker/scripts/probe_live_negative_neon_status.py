#!/usr/bin/env python3
"""Production endpoints, synthetic JWT only. Absolutely no user data or secrets.

The li_is_invited RPC is read-only and body {}. If unexpectedly authorized,
the Worker receives invalid body {} and cannot store a subscription.
Only print HTTP status and CORS indicator, never response body/headers or token.
"""
import base64
import json
import urllib.error
import urllib.request

ORIGIN="https://li5610.pages.dev"
WORKER="https://li-push-staging.dungho-product.workers.dev/v1/subscriptions"
NEON="https://ep-misty-snow-azfrrm3o.apirest.c-3.ap-southeast-1.aws.neon.tech/li/rest/v1/rpc/li_is_invited"
payload=base64.urlsafe_b64encode(json.dumps({"sub":"li-synthetic-never-invited-qa-20261123",
    "exp":4102444800},separators=(",",":")).encode()).decode().rstrip("=")
header=base64.urlsafe_b64encode(b'{"alg":"none","typ":"JWT"}').decode().rstrip("=")
fake_token=header+"."+payload+".synthetic" # deliberately INVALID signature

def request(url,worker=False):
    headers={"Authorization":"Bearer "+fake_token,
     "Content-Type":"application/json","Accept":"application/json",
     "User-Agent":"li-webpush-synthetic-negative-contract/1.0"}
    if worker:headers["Origin"]=ORIGIN
    req=urllib.request.Request(url,data=b"{}",method="PUT" if worker else "POST",headers=headers)
    try:
        with urllib.request.urlopen(req,timeout=15) as response:
            return response.status,response.headers.get("Access-Control-Allow-Origin")==ORIGIN
    except urllib.error.HTTPError as e:
        return e.code,e.headers.get("Access-Control-Allow-Origin")==ORIGIN

def main():
    for name,url,worker in [("NEON_DIRECT",NEON,False),("WORKER_PROXY",WORKER,True)]:
        try:
            status,cors=request(url,worker)
        except Exception as e:
            print(name+"_NO_HTTP_RESPONSE "+type(e).__name__)
            raise SystemExit(2)
        print(name+"_HTTP_"+str(status)+" CORS_OK="+str(cors) if worker else name+"_HTTP_"+str(status))
        # A fake JWT must be denied. Never call this a live user-auth PASS.
        if status in (200,201,204):
            raise SystemExit("UNEXPECTED_SYNTHETIC_JWT_ACCEPTED")
    print("LI_PUSH_SYNTHETIC_PROBE_COMPLETE_NO_DEPLOY_NO_USER_DATA")
if __name__=="__main__":
    main()
