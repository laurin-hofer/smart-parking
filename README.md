# Smart Parking System

Production-ready Next.js parking management system with real hardware integration via Raspberry Pi.

## Stack

- **Next.js 15** App Router + TypeScript
- **Direct PostgreSQL** via `pg` → Supabase/PostgreSQL
- **Tailwind CSS** dark theme
- **Vercel** deployment

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo>
cd smart-parking-system
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, ADMIN_PASSWORD, HARDWARE_API_KEY
```

### 3. Set up database

```bash
# The app creates the required PostgreSQL tables automatically
# on first database access. To create them manually instead,
# run supabase/schema.sql in the Supabase SQL Editor.
```

### 4. Start dev server

```bash
npm run dev
```

App runs at `http://localhost:3000`

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Mobile-first user page — enter plate, see session, pay |
| `/map` | Public parking map (live, no auth) |
| `/admin` | Admin control center (password protected) |
| `/admin/login` | Admin login |

---

## API Reference

### Hardware Endpoints (Raspberry Pi)

All `/api/hardware/*` endpoints require the header:
```
x-hardware-key: <HARDWARE_API_KEY>
```

---

#### `POST /api/hardware/plate-detected`

OCR detected a license plate. The app stores the vehicle and places it in the pending entry queue. No parking spot is assigned yet.

```bash
curl -X POST https://your-app.vercel.app/api/hardware/plate-detected \
  -H "x-hardware-key: super-secret-raspberry-key" \
  -H "Content-Type: application/json" \
  -d '{"plate": "I-00000A"}'
```

Response:
```json
{ "success": true, "pendingEntry": { "licensePlate": "I-00000A", "status": "PENDING" } }
```

---

#### `POST /api/hardware/entry/start`

Button pressed → open barrier immediately, lock entry.

```bash
curl -X POST https://your-app.vercel.app/api/hardware/entry/start \
  -H "x-hardware-key: super-secret-raspberry-key" \
  -H "Content-Type: application/json" \
  -d '{"plate": "I-00000A"}'   # plate optional, send if quick-OCR available
```

Response:
```json
{ "gateOpen": true, "latestPendingPlate": "I-00000A" }
```

---

#### `POST /api/hardware/entry/complete`

OCR + sensor done → create session, assign spot, release lock.

```bash
curl -X POST https://your-app.vercel.app/api/hardware/entry/complete \
  -H "x-hardware-key: super-secret-raspberry-key" \
  -H "Content-Type: application/json" \
  -d '{"plate": "I-00000A", "spotCode": "A-8"}'
```

Response:
```json
{
  "success": true,
  "session": {
    "id": "...",
    "status": "ACTIVE",
    "enteredAt": "2026-05-18T10:00:00.000Z",
    "vehicle": { "licensePlate": "I-00000A", "ownerName": "Guest" },
    "spot": { "code": "A-8" }
  }
}
```

---

#### `POST /api/hardware/sensor`

Distance sensor update for a parking spot.

```bash
curl -X POST https://your-app.vercel.app/api/hardware/sensor \
  -H "x-hardware-key: super-secret-raspberry-key" \
  -H "Content-Type: application/json" \
  -d '{"spotCode": "A-3", "occupied": true}'

# Or use sensorId (matched to spot via database)
# -d '{"sensorId": "sensor_a_3", "occupied": false}'
```

Response:
```json
{ "spotCode": "A-3", "status": "OCCUPIED" }
```

---

#### `POST /api/hardware/exit/check`

Exit button pressed → check payment, open or deny.

```bash
curl -X POST https://your-app.vercel.app/api/hardware/exit/check \
  -H "x-hardware-key: super-secret-raspberry-key" \
  -H "Content-Type: application/json" \
  -d '{"plate": "I-00000A"}'
```

Response (paid):
```json
{ "gateOpen": true, "reason": "Payment confirmed", "priceCents": 150 }
```

Response (unpaid):
```json
{ "gateOpen": false, "reason": "Payment required before exit", "priceCents": 350, "sessionId": "..." }
```

---

### Public Parking API

#### `GET /api/parking/spots`

All spots with live status.

#### `GET /api/parking/session?plate=I-00000A`

Active/paid session for a given plate.

#### `POST /api/parking/pay`

```json
{ "sessionId": "...", "paymentMethod": "card" }
```
`paymentMethod`: `"card"` | `"apple_pay"`

---

## Raspberry Pi Integration

### Full entry flow

```python
import requests, time

BASE_URL = "https://your-app.vercel.app"
HEADERS = {"x-hardware-key": "super-secret-raspberry-key", "Content-Type": "application/json"}

def on_entry_button():
    # 1. Open barrier immediately
    r = requests.post(f"{BASE_URL}/api/hardware/entry/start", headers=HEADERS, json={})
    if not r.json().get("gateOpen"):
        print("Entry locked — another car is entering")
        return

    # 2. Run OCR (takes ~20 seconds)
    plate = run_ocr()

    # 3. Wait for distance sensor to report spot
    spot_code = wait_for_sensor()  # polls until car stops

    # 4. Finalize entry
    requests.post(f"{BASE_URL}/api/hardware/entry/complete",
                  headers=HEADERS, json={"plate": plate, "spotCode": spot_code})

def on_sensor_change(spot_code: str, occupied: bool):
    requests.post(f"{BASE_URL}/api/hardware/sensor",
                  headers=HEADERS, json={"spotCode": spot_code, "occupied": occupied})

def on_exit_button(plate: str):
    r = requests.post(f"{BASE_URL}/api/hardware/exit/check",
                      headers=HEADERS, json={"plate": plate})
    data = r.json()
    if data["gateOpen"]:
        open_exit_barrier()
    else:
        show_display(f"Please pay: {data.get('priceCents', 0) / 100:.2f} EUR")
```

---

## Pricing

- **€0.05 per minute**
- **Minimum: €0.50**
- Calculated in `lib/pricing.ts`
- User pays via mobile at `https://your-app.vercel.app` → enters plate → Pay now

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `ADMIN_PASSWORD` | ✅ | Password for `/admin` |
| `HARDWARE_API_KEY` | ✅ | Shared secret for Raspberry Pi |

---

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard or:
vercel env add DATABASE_URL
vercel env add ADMIN_PASSWORD
vercel env add HARDWARE_API_KEY
```

Use the same Supabase PostgreSQL `DATABASE_URL` in Vercel so every device reads and writes the same database.

---

## Legacy Local Data Export

```bash
npm run db:export-legacy-sqlite-sql
```

This prints SQL for the old local SQLite backup in `legacy/dev.db`, in case you want to import those previous local records into Supabase.
