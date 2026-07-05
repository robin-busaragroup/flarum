import app from 'flarum/forum/app';
import extractText from 'flarum/common/utils/extractText';

// Discussions the user chose to reveal this session, by id. Shared between
// the list blur and the discussion-page interstitial so revealing in one
// place reveals everywhere.
export const revealed = new Set();

export function matchedWarnings(discussion) {
  const user = app.session.user;

  if (!user) return [];

  const hidden = user.ao3HiddenWarnings() || [];
  const warnings = discussion.ao3ContentWarnings() || [];

  const matched = warnings.filter((w) => hidden.includes(w));

  if (user.ao3HideSpoilers() && discussion.ao3SpoilerScope()) {
    matched.push(extractText(app.translator.trans('ao3-companion.forum.badges.spoilers_generic')));
  }

  return matched;
}
