-- Fandom spaces (primary tags)
UPDATE tags SET description = 'Cross-fandom chatter, forum meta, introductions.' WHERE slug = 'general';

INSERT INTO tags (name, slug, description, color, position, is_primary, icon) VALUES
  ('Harry Potter', 'harry-potter', 'The Wizarding World: canon, Marauders era, next-gen.', '#7f0909', 1, 1, 'fas fa-bolt'),
  ('Marvel', 'marvel', 'MCU, comics, X-Men and every multiverse in between.', '#e23636', 2, 1, 'fas fa-mask'),
  ('Anime & Manga', 'anime-manga', 'From shonen juggernauts to quiet slice-of-life.', '#ff7043', 3, 1, 'fas fa-torii-gate'),
  ('K-Pop & RPF', 'kpop-rpf', 'Real person fic. Curate your space, respect the fourth wall.', '#8e24aa', 4, 1, 'fas fa-music'),
  ('Books & Literature', 'books-lit', 'Literary fandoms old and new.', '#00695c', 5, 1, 'fas fa-book'),
  ('Other Fandoms', 'other-fandoms', 'Small fandoms welcome. Yell about your niche here.', '#546e7a', 6, 1, 'fas fa-globe');

-- Semi-private fandom space: only visible to Members and Mods.
INSERT INTO tags (name, slug, description, color, position, is_primary, is_restricted, icon) VALUES
  ('Members Lounge', 'members-lounge', 'Semi-private space — visible to registered members only.', '#37474f', 7, 1, 1, 'fas fa-lock');

-- Ship / pairing tags (secondary)
INSERT INTO tags (name, slug, description, color, is_primary) VALUES
  ('Drarry', 'drarry', 'Draco Malfoy / Harry Potter', '#c2185b', 0),
  ('Wolfstar', 'wolfstar', 'Sirius Black / Remus Lupin', '#c2185b', 0),
  ('Stucky', 'stucky', 'Steve Rogers / Bucky Barnes', '#c2185b', 0),
  ('Reylo', 'reylo', 'Rey / Ben Solo', '#c2185b', 0),
  ('Rare Pairs', 'rare-pairs', 'Ships with a two-digit AO3 tag count.', '#c2185b', 0),
  ('Gen', 'gen', 'No romantic pairing focus.', '#c2185b', 0);

-- Trope / genre tags (secondary)
INSERT INTO tags (name, slug, description, color, is_primary) VALUES
  ('Fluff', 'fluff', NULL, '#0288d1', 0),
  ('Angst', 'angst', NULL, '#0288d1', 0),
  ('Hurt/Comfort', 'hurt-comfort', NULL, '#0288d1', 0),
  ('AU', 'au', 'Alternate universe', '#0288d1', 0),
  ('Slow Burn', 'slow-burn', NULL, '#0288d1', 0),
  ('Fix-It', 'fix-it', NULL, '#0288d1', 0),
  ('Canon Divergence', 'canon-divergence', NULL, '#0288d1', 0),
  ('Long Fic (100k+)', 'long-fic', NULL, '#0288d1', 0);

-- Scoped permissions for the Members Lounge: Members (3) and Mods (4) can
-- see it and post in it; guests cannot even see it exists.
INSERT INTO group_permission (group_id, permission)
SELECT g.id, 'tag' || t.id || '.viewForum'
FROM groups g, tags t WHERE g.id IN (3, 4) AND t.slug = 'members-lounge';

INSERT INTO group_permission (group_id, permission)
SELECT g.id, 'tag' || t.id || '.startDiscussion'
FROM groups g, tags t WHERE g.id IN (3, 4) AND t.slug = 'members-lounge';

INSERT INTO group_permission (group_id, permission)
SELECT g.id, 'tag' || t.id || '.discussion.reply'
FROM groups g, tags t WHERE g.id IN (3, 4) AND t.slug = 'members-lounge';

-- Privacy hardening: mods cannot browse post IPs or last-seen times.
DELETE FROM group_permission WHERE permission IN ('discussion.viewIpsPosts', 'user.viewLastSeenAt');
