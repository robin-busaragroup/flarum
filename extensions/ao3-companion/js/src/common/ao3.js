export const TYPES = ['rec', 'chapter', 'lff', 'general'];

export const TYPE_ICONS = {
  rec: 'fas fa-heart',
  chapter: 'fas fa-book-open',
  lff: 'fas fa-search',
  general: 'fas fa-comments',
};

export function typeLabel(app, type) {
  return app.translator.trans(`ao3-companion.lib.type_${type}`);
}

export function warningVocabulary(app) {
  return (app.forum.attribute('ao3Warnings') || '')
    .split('\n')
    .map((w) => w.trim())
    .filter(Boolean);
}
