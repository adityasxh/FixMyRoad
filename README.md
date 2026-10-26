# FixMyRoad GIS

GIS-based pothole reporting and prioritization MVP, initially focused on Wagholi, Pune.

## Stack
- Next.js App Router + TypeScript
- Supabase PostgreSQL + PostGIS
- Leaflet + OpenStreetMap

## Starter features
- Responsive dashboard
- Interactive Leaflet map centered on Wagholi
- Reads unresolved records from `pothole_priority_queue`
- Report summary cards and connection state
- No fabricated pothole records

## Run locally
Requires Node.js 20.9 or newer.

```bash
git clone https://github.com/adityasxh/FixMyRoad.git
cd FixMyRoad
npm install
cp .env.example .env.local
```

Edit `.env.local` with values from **Supabase Dashboard → FixMyRoad GIS → Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Use a publishable key (or legacy anon key), never a service-role/secret key in browser code. Never commit `.env.local`.

Then run:

```bash
npm run dev
```

Open http://localhost:3000.

## Database objects expected
- `public.pothole_reports`
- `public.report_evidence`
- `public.pothole_priority_queue`
- PostGIS geography column and GiST spatial index

No sample reports are seeded. The map is centered on Wagholi but will show markers only after database reports exist.

## Priority score
The database view uses a 0–100 heuristic: severity 40%, traffic importance 25%, recurrence 20%, age 15%. Validate the weights before operational use.

## Notes
- OpenStreetMap tile attribution is retained; follow its tile usage policy.
- Public report submission should receive validation, rate limiting and spam prevention before launch.
- Add an authenticated admin workflow for verification/status changes.
- Configure storage policies and image validation before supporting uploads.
