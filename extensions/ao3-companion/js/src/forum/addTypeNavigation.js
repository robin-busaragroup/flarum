import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import LinkButton from 'flarum/common/components/LinkButton';

import { TYPES, TYPE_ICONS, typeLabel } from '../common/ao3';

export default function addTypeNavigation() {
  extend('flarum/forum/components/IndexSidebar', 'navItems', function (items) {
    const current = (m.route.param('filter') || {}).ao3Type;

    TYPES.filter((type) => type !== 'general').forEach((type, i) => {
      items.add(
        `ao3Type-${type}`,
        <LinkButton
          href={app.route('index', { filter: { ao3Type: type } })}
          icon={TYPE_ICONS[type]}
          active={current === type}
        >
          {typeLabel(app, type)}
        </LinkButton>,
        60 - i
      );
    });
  });
}
