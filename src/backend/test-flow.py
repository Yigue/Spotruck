#!/usr/bin/env python3
"""Spottruck — Clean full flow test"""
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

def ok(code): return 200 <= code < 300

print("=== FULL FLOW TEST ===\n")

# Login
_, d = req("POST", "/auth/login", {"email":"empresa@demo.com","password":"Demo1234!"})
ct = d["data"]["accessToken"]
_, d = req("POST", "/auth/login", {"email":"camionero1@demo.com","password":"Demo1234!"})
dt = d["data"]["accessToken"]
print(f"Tokens OK: company={ct[:15]}... driver={dt[:15]}...\n")

# Find DRAFT trip
_, t = req("GET", "/trips", token=ct)
trips = t.get("data", [])
print(f"Trips ({len(trips)}):")
for tr in trips:
    print(f"  {tr['status']:12s}  {tr['id'][:8]}  basePrice={tr.get('basePrice', '?')}")

draft = next((x for x in trips if x["status"] == "DRAFT"), None)
print()

if draft:
    tid = draft["id"]
    bp = draft["basePrice"]
    print(f"[1] DRAFT trip: {tid}  basePrice={bp}")

    # Publish
    code, _ = req("PUT", f"/trips/{tid}", {"status": "OPEN"}, ct)
    print(f"[2] Publish trip: {'OK' if ok(code) else f'FAIL {code}'}")

    # Create auction
    code, auc = req("POST", "/auctions", {"tripId": tid}, ct)
    if ok(code):
        aid = auc["data"]["id"]
        cp = auc["data"]["currentPrice"]
        rp = auc["data"].get("reservePrice", "?")
        print(f"[3] Auction created: {aid}  currentPrice={cp}  reservePrice={rp}")

        # Bid lower
        bid_amount = cp - 2000
        print(f"[4] Bidding {bid_amount} (current={cp}, reserve={rp})")
        code, b = req("POST", f"/auctions/{aid}/bid", {"amount": bid_amount}, dt)
        if ok(code):
            print(f"    BID OK: {b['data']['id']}  amount={b['data']['amount']}")
        else:
            print(f"    BID FAIL [{code}]: {b['error']}")
    else:
        print(f"[3] Auction FAIL [{code}]: {auc['error']}")

print("\n=== DONE ===")
