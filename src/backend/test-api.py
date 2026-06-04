#!/usr/bin/env python3
"""Spottruck API — Integration test"""
import urllib.request, urllib.error, json

BASE = "http://localhost:4000/api/v1"

def req(method, path, data=None, token=None):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req_obj = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req_obj, timeout=10) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return 0, {"error": str(e)}

def test(name, fn):
    code, body = fn()
    ok = 200 <= code < 300
    print(f"  {'✅' if ok else '❌'} [{code}] {name}")
    if not ok:
        print(f"       -> {body.get('error', body)}")
    return ok

def get_token(email):
    _, d = req("POST", "/auth/login", {"email": email, "password": "Demo1234!"})
    return d.get("data", {}).get("accessToken", "")

print("=" * 60)
print("SPOTTRUCK API -- INTEGRATION TEST")
print("=" * 60)

company_token = get_token("empresa@demo.com")
driver_token = get_token("camionero1@demo.com")

# Auth
print("\n🔐 AUTH")
test("Login empresa", lambda: req("POST", "/auth/login", {"email": "empresa@demo.com", "password": "Demo1234!"}))
test("Login driver", lambda: req("POST", "/auth/login", {"email": "camionero1@demo.com", "password": "Demo1234!"}))
test("Get me (company)", lambda: req("GET", "/auth/me", token=company_token))
test("Get me (driver)", lambda: req("GET", "/auth/me", token=driver_token))

# Trips
print("\n🚚 TRIPS")
test("Get all trips", lambda: req("GET", "/trips", token=company_token))

_, trips_raw = req("GET", "/trips", token=company_token)
trips = trips_raw.get("data", [])
draft_trip = next((t for t in trips if t["status"] == "DRAFT"), None)

if draft_trip:
    tid = draft_trip["id"]
    test(f"Publish trip (DRAFT->OPEN)", lambda: req("PUT", f"/trips/{tid}", {"status": "OPEN"}, company_token))
    _, auc_resp = req("POST", "/auctions", {"tripId": tid}, company_token)
    if auc_resp.get("data"):
        auc_id = auc_resp["data"]["id"]
        test("Create auction", lambda: (201, auc_resp))
        _, auc_detail = req("GET", f"/auctions/{auc_id}", token=company_token)
        current = auc_detail.get("data", {}).get("currentPrice", 0)
        test(f"Bid {current - 2000} on auction",
             lambda: req("POST", f"/auctions/{auc_id}/bid", {"amount": current - 2000}, driver_token))

# Payments
print("\n💳 PAYMENTS")
in_progress = next((t for t in trips if t["status"] == "IN_PROGRESS"), None)
if in_progress:
    test("Get payment for trip", lambda: req("GET", f"/payments/{in_progress['id']}", token=company_token))

# Ratings
print("\n⭐ RATINGS")
_, me = req("GET", "/auth/me", token=driver_token)
driver_id = me.get("data", {}).get("id", "")
if in_progress and driver_id:
    test("Create rating", lambda: req("POST", "/ratings", {
        "tripId": in_progress["id"], "toUserId": driver_id,
        "score": 5, "punctuality": 5, "communication": 4,
        "comment": "Excelente conductor",
    }, company_token))
    test("Get driver ratings", lambda: req("GET", f"/ratings/user/{driver_id}", token=company_token))

print("\n" + "=" * 60)
print("Integration test complete")
print("empresa@demo.com / Demo1234!  (COMPANY)")
print("camionero1@demo.com / Demo1234!  (DRIVER)")
print("=" * 60)
