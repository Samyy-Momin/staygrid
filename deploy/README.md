# Deploying StayGrid (one VPS)

Everything runs on one small server: Postgres, API, admin panel, owner websites, and Caddy (HTTPS).

## 1. DNS (at your domain registrar)

| Record | Name | Value |
|---|---|---|
| A | `api` | server IP |
| A | `admin` | server IP |
| A | `*` (wildcard) | server IP |

Owner custom domain (e.g. `www.sharifafarmhouse.com`): the owner adds a **CNAME** `www` → `sharifafarmhouse.<ROOT_DOMAIN>`,
then the system admin sets the domain on the website in **Admin → Websites → Edit**. HTTPS is issued automatically on first visit.

## 2. Configure

```bash
cd deploy
cp .env.example .env              # domain, DB password, SITES_API_KEY
cp ../apps/backend/.env.example backend.env   # Razorpay LIVE keys, SMTP, Cloudinary, Google Maps
```

`backend.env` must NOT contain DATABASE_URL / CORS / auth URLs — compose sets those from `.env`.

## 3. Start / update

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f backend
```

The backend applies database migrations on every start (`prisma migrate deploy`).

## 4. Backups (do this on day one)

```bash
# daily at 02:30 via crontab -e
30 2 * * * cd /path/to/staygrid/deploy && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U staygrid staygrid | gzip > backups/staygrid-$(date +\%F).sql.gz && find backups -name '*.sql.gz' -mtime +14 -delete
```

Copy `deploy/backups/` off the server (e.g. to Google Drive / S3) regularly.

## 5. Razorpay webhook

Dashboard → Webhooks → `https://api.<ROOT_DOMAIN>/api/bookings/webhook`, event `payment.captured`,
secret = `RAZORPAY_WEBHOOK_SECRET` in `backend.env`.
