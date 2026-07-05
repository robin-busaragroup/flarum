import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import extractText from 'flarum/common/utils/extractText';

// Discussions the user chose to reveal this session, by id.
const revealed = new Set();

function matchedWarnings(discussion) {
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

export default function addCwFiltering() {
  extend('flarum/forum/components/DiscussionListItem', 'elementAttrs', function (attrs) {
    const discussion = this.attrs.discussion;

    if (revealed.has(discussion.id())) return;

    const matched = matchedWarnings(discussion);

    if (!matched.length) return;

    attrs.className = `${attrs.className || ''} DiscussionListItem--ao3-blurred`;
    attrs['data-ao3-id'] = discussion.id();
    attrs['data-ao3-cw'] = extractText(
      app.translator.trans('ao3-companion.forum.filters.blurred_by_cw', { warnings: matched.join(', ') })
    );
  });

  // The list item's own vnode events are managed by a subtree retainer, so a
  // delegated listener is the reliable way to catch the reveal click.
  document.addEventListener(
    'click',
    (e) => {
      const item = e.target.closest && e.target.closest('.DiscussionListItem--ao3-blurred');

      if (!item) return;

      e.preventDefault();
      e.stopPropagation();

      revealed.add(item.getAttribute('data-ao3-id'));

      // The item is guarded by a subtree retainer, so a redraw won't rebuild
      // it — unblur it directly in the DOM instead.
      item.classList.remove('DiscussionListItem--ao3-blurred');
      item.removeAttribute('data-ao3-cw');
    },
    true
  );
}
