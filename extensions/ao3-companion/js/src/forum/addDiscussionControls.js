import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';

export default function addDiscussionControls() {
  // DiscussionControls lives in an async chunk AND is a plain object, so
  // neither a boot-time import nor the string-form extend (which targets
  // module.prototype) works — hook the registry load callback directly.
  flarum.reg.onLoad('core', 'forum/utils/DiscussionControls', (module) => {
    extendControls(module);
  });
}

function extendControls(DiscussionControls) {
  extend(DiscussionControls, 'moderationControls', function (items, discussion) {
    if (!discussion.canAo3Edit()) return;

    const trans = (key) => app.translator.trans(`ao3-companion.forum.discussion.${key}`);

    items.add(
      'ao3EditDetails',
      <Button icon="fas fa-book-open" onclick={() => app.modal.show(() => import('./components/Ao3DetailsModal'), { discussion })}>
        {trans('edit_details')}
      </Button>,
      -10
    );

    if (discussion.ao3Type() === 'lff') {
      const solved = !!discussion.ao3Solved();

      items.add(
        'ao3ToggleFound',
        <Button
          icon={solved ? 'fas fa-times-circle' : 'fas fa-check-circle'}
          onclick={() => discussion.save({ ao3Solved: !solved }).then(() => m.redraw())}
        >
          {trans(solved ? 'mark_unfound' : 'mark_found')}
        </Button>,
        -11
      );
    }
  });
}

