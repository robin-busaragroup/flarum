import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Discussion from 'flarum/common/models/Discussion';
import Badge from 'flarum/common/components/Badge';

import { TYPE_ICONS, typeLabel } from '../common/ao3';

export default function addBadges() {
  extend(Discussion.prototype, 'badges', function (badges) {
    const type = this.ao3Type();

    if (type && type !== 'general') {
      badges.add(
        'ao3Type',
        <Badge type={`ao3-${type}`} label={typeLabel(app, type)} icon={TYPE_ICONS[type]} tabindex="0" />,
        9
      );
    }

    const scope = this.ao3SpoilerScope();

    if (scope) {
      badges.add(
        'ao3Spoilers',
        <Badge
          type="ao3-spoiler"
          label={app.translator.trans('ao3-companion.forum.badges.spoilers', { scope })}
          icon="fas fa-exclamation-triangle"
          tabindex="0"
        />,
        8
      );
    }

    const warnings = this.ao3ContentWarnings() || [];

    if (warnings.length) {
      badges.add(
        'ao3Warnings',
        <Badge type="ao3-cw" label={warnings.join(', ')} icon="fas fa-eye-slash" tabindex="0" />,
        7
      );
    }
  });
}
