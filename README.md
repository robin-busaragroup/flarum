# AOFORUM

A **privacy-first, anonymous forum for AO3 readers to discuss fanfics**, built on a
[Flarum 2.0](https://flarum.org) scaffold (forked from
[flarum/flarum](https://github.com/flarum/flarum)) plus a custom first-party extension,
[`ao3/companion`](extensions/ao3-companion).

## Feature map

| AO3-reader need | How it's covered |
| --- | --- |
| **Fandom tags** | `flarum/tags` primary tags — one space per fandom (Harry Potter, Marvel, Anime & Manga, K-Pop & RPF, Books & Lit, Other Fandoms seeded) |
| **Pairing/ship tags** | Secondary tags (Drarry, Wolfstar, Stucky, Reylo, Rare Pairs, Gen) plus trope tags (Fluff, Angst, Hurt/Comfort, AU, Slow Burn, Fix-It, Canon Divergence, Long Fic) |
| **Spoiler labels** | Per-thread "Spoilers through …" scope shown as a badge; `[spoiler]…[/spoiler]` and `[spoiler=Chapter 12]…[/spoiler]` collapsed blocks; `\|\|inline\|\|` blacked-out spoiler text |
| **Fic recommendation threads** | `Fic Rec` thread type with fic title + AO3 link metadata card and a dedicated sidebar filter |
| **Chapter discussion threads** | `Chapter Discussion` thread type with chapter number + spoiler scope on the thread header |
| **"Looking for a fic" posts** | `Looking for a Fic` thread type with its own badge and sidebar filter |
| **Content warning filters** | Threads carry AO3-style archive warnings (admin-editable vocabulary); each reader picks warnings to filter in Settings → threads matching them are blurred in lists until clicked |
| **Private / semi-private fandom spaces** | Restricted tags with scoped permissions — the seeded **Members Lounge** is invisible to guests, visible/postable for members and mods |
| **Long comments and quote replies** | `flarum/mentions` quote-reply and post mentions; SQLite/MySQL TEXT posts, full Markdown + BBCode |

## Privacy stance

- **No IP retention** — the extension nulls poster IP addresses before every post is saved
  (on by default, admin-toggleable). Mods' "view post IPs" permission is removed.
- **Anonymous display names** — `flarum/nicknames` is enabled; emails are never exposed via
  the API and the display name never has to be a real name.
- **Reader-side content control** — spoiler and content-warning filters are personal
  preferences, visible and writable only by the account that owns them.
- **GDPR tooling** — `flarum/gdpr` gives every user self-service data export and erasure
  requests.
- **Last-seen hidden from staff** — the mod "view last seen" permission is removed;
  users can additionally hide online status per account.
- **Local-first storage** — SQLite by default; no third-party services required to run.

## The `ao3/companion` extension

Lives in [`extensions/ao3-companion`](extensions/ao3-companion) and provides:

- Discussion fields: `ao3Type` (`rec` / `chapter` / `lff` / `general`), `ao3FicTitle`,
  `ao3FicUrl` (http/https only), `ao3Chapter`, `ao3SpoilerScope`, `ao3ContentWarnings`
  (validated against the admin vocabulary).
- User fields: `ao3HiddenWarnings`, `ao3HideSpoilers` (self-only visibility).
- Composer UI: thread-type select, fic metadata inputs, content-warning checklist.
- Discussion list: type/spoiler/CW badges, CSS blur + click-to-reveal for filtered threads.
- Discussion page: fic metadata card with "Open on AO3" link.
- Server-side `filter[ao3Type]` for the discussion list, wired to sidebar navigation.
- Spoiler BBCode + inline spoiler formatter.
- Admin settings: warning vocabulary (one per line), IP anonymization toggle,
  "require a thread type" toggle.

## Local development

Requirements: PHP ≥ 8.2 (with `pdo_sqlite`), Composer, Node 18+ (only to rebuild extension JS).

```bash
composer install

# install with SQLite (interactive; or use `php flarum install -f <config.json>`)
php flarum install

php flarum extension:enable ao3-companion
php flarum extension:enable flarum-nicknames
php flarum extension:enable flarum-gdpr
php flarum extension:enable flarum-messages

# serve
php -S localhost:8000 -t public
```

To rebuild the extension frontend after changing `extensions/ao3-companion/js/src`:

```bash
cd extensions/ao3-companion/js
npm install
npm run build
cd ../../..
php flarum assets:publish && php flarum cache:clear
```

A seed for the fandom/ship tag taxonomy and the Members Lounge permissions is in
[`docs/seed-tags.sql`](docs/seed-tags.sql).

## Credits

Scaffold: [flarum/flarum](https://github.com/flarum/flarum) (MIT). All Flarum bundled
extensions are first-party MIT-licensed packages.
