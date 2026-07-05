# Deploying AOFORUM — Laravel Forge + DigitalOcean

This is the full runbook to take AOFORUM from this repo to a live, HTTPS forum on a
DigitalOcean Droplet managed by Laravel Forge.

**Who does what:** the account signups and dashboard clicks are yours (they need your
login + card). Everything on the code side is already done — the repo is deploy-ready
(built assets committed, `composer.lock` pinned, deploy script and install config
provided under `deploy/`).

**Cost:** ~$12/mo Forge + ~$18/mo Droplet (2 GB/2 vCPU) ≈ **$30/mo**, plus free-tier email.

---

## 1. Accounts (one-time)

1. **DigitalOcean** — create an account at digitalocean.com. Generate a personal access
   token: *API → Tokens → Generate New Token* (read+write). Copy it.
2. **Laravel Forge** — sign up at forge.laravel.com ($12/mo). Connect two things in
   *Account → Source Control* and *Server Providers*:
   - Your **GitHub** (so Forge can pull `robin-busaragroup/flarum`).
   - Your **DigitalOcean** token (from step 1).

## 2. Provision the server

In Forge: *Create Server → DigitalOcean.*

- **Type:** App Server
- **Region:** pick one near your users (choose an EU region — e.g. Frankfurt — to keep
  the privacy-first / GDPR posture).
- **Size:** 2 GB / 2 vCPU to start.
- **PHP version:** 8.3 or 8.4 (this repo requires PHP ≥ 8.3).
- **Database:** MySQL 8. Note the generated DB password Forge shows you.

Forge installs nginx, PHP-FPM, MySQL, and Redis and hands you the server's IP. Point your
domain's DNS `A` record at that IP.

## 3. Create the site

*Server → Sites → Add Site.*

- **Root domain:** your domain (e.g. `aoforum.example`).
- **Web directory:** `/public`  ← important; Flarum's front controller lives there.
- **PHP version:** match the server.

Then *Git Repository*: connect `robin-busaragroup/flarum`, branch **`2.x`**.
Leave "Install Composer dependencies" **unchecked** for now — we deploy manually first.

## 4. Create the database

*Server → Database → Add Database.* Create `aoforum` and a user/password, or reuse the
Forge default DB. Keep the name, user, and password for the next step.

## 5. First-time Flarum install (SSH, once)

Forge shows an SSH command (*Server → root/forge login*). SSH in, then:

```bash
cd ~/YOUR_SITE_DIRECTORY            # e.g. ~/aoforum.example
composer install --no-dev --optimize-autoloader

# Build the install config from the template:
cp deploy/config.production.example.json config.production.json
nano config.production.json          # fill in domain, DB name/user/password, admin pw+email

php flarum install -f config.production.json
rm config.production.json            # it held the admin password — delete it
```

## 6. Enable the extensions

A fresh install enables the default bundled set. Turn on the rest:

```bash
php flarum extension:enable flarum-nicknames
php flarum extension:enable flarum-gdpr
php flarum extension:enable flarum-messages
php flarum extension:enable ao3-companion
php flarum cache:clear
```

**Fandom/ship tags:** `docs/seed-tags.sql` was written for SQLite (it uses `||` string
concatenation, which MySQL reads as OR). Don't run it against MySQL as-is. Instead create
your fandom (primary) and ship (secondary) tags in *Admin → Tags*, or ask for a
MySQL-compatible seed. The Members Lounge is just a restricted tag with member-only view
permission, set in the same panel.

## 7. Turn on automatic deploys

*Site → Deploy Script* — paste the contents of [`deploy/forge-deploy.sh`](deploy/forge-deploy.sh)
and enable *Quick Deploy*. From now on, every push to `2.x` runs
`composer install → flarum migrate → assets:publish → cache:clear` automatically.

## 8. Scheduler (required for the weekly digest)

*Server → Scheduler → Add Scheduled Job:*

- **Command:** `php ~/YOUR_SITE_DIRECTORY/flarum schedule:run`
- **Frequency:** Every Minute
- **User:** forge

This is what fires the `ao3:lff-digest` weekly email (and Flarum's own GDPR/maintenance
tasks). Without it, the digest never sends.

## 9. SSL

*Site → SSL → Let's Encrypt → Obtain Certificate.* Auto-renews. After it's active, confirm
`config.php` has `'url' => 'https://YOUR_DOMAIN'` (the installer set this from the config).

## 10. Email

Registration confirmation, password resets, and the digest all need real SMTP.

1. Create a **Postmark** account (free tier) and a Server; copy the Server API Token.
2. In *Admin → Email* on the forum: driver **SMTP**, host `smtp.postmarkapp.com`, port
   `587`, encryption `tls`, username + password = your Postmark token, from address a
   verified sender on your domain. Send the test email.

Queue note: the queue driver is `sync`, so these emails send inline — the weekly digest
sends during its cron run, registration emails during signup. That's fine to start; a
dedicated `queue:work` daemon (Forge *Daemons*) is an optional later upgrade for snappier
requests under load, not a requirement.

---

## Before you open registration — pre-launch checklist

These are genuine readiness items specific to this build, not generic advice:

- [ ] **Harden the AO3 lookup.** `/api/ao3/work/{id}` scrapes AO3's live HTML on every
      *Fetch from AO3* click with no caching or rate limit. Under real traffic that risks
      getting the **server's IP rate-limited or blocked by AO3**. Add per-work caching
      (a table + TTL) and a per-user rate limit before launch. *(Ask and I'll implement it.)*
- [ ] **Anti-spam.** An anonymous forum is a spam magnet, and IP anonymization disables
      IP-based flood control. Add a captcha extension (hCaptcha/reCAPTCHA) and keep
      `flarum/approval` on for first posts.
- [ ] **Legal.** Publish a ToS + privacy policy (you market privacy — put it in writing),
      a DMCA contact, and decide on age-gating given adult-adjacent fanfic content. Confirm
      DigitalOcean's ToS is fine with your content (it is for a discussion forum).
- [ ] **Backups.** Enable Forge's scheduled database backups to an S3/Spaces bucket.
- [ ] **Flarum 2.0 is a release candidate.** You're on `2.0.0-rc.4`; plan to update to
      stable when it lands (`composer update` + a deploy).

## Ongoing updates

After the initial setup, shipping a change is just:

```bash
git push origin 2.x      # Forge auto-deploys via the script in step 7
```

If you change the extension's JavaScript, rebuild the committed assets locally first
(`cd extensions/ao3-companion/js && npm run build`) and commit `dist/`, since the server
runs the PHP-only deploy script.
