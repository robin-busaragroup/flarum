import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Icon from 'flarum/common/components/Icon';

export default function addFicCard() {
  extend('flarum/forum/components/DiscussionHero', 'items', function (items) {
    const discussion = this.attrs.discussion;
    const title = discussion.ao3FicTitle();
    const url = discussion.ao3FicUrl();
    const chapter = discussion.ao3Chapter();
    const scope = discussion.ao3SpoilerScope();
    const warnings = discussion.ao3ContentWarnings() || [];

    if (!title && !url && !chapter && !scope && !warnings.length) return;

    const trans = (key, data) => app.translator.trans(`ao3-companion.forum.discussion.${key}`, data);

    items.add(
      'ao3FicCard',
      <div className="Ao3FicCard">
        {!!title && <div className="Ao3FicCard-title"><Icon name="fas fa-book" /> {title}</div>}
        <div className="Ao3FicCard-meta">
          {!!chapter && <span>{trans('chapter', { number: chapter })}</span>}
          {!!scope && <span>{app.translator.trans('ao3-companion.forum.badges.spoilers', { scope })}</span>}
          {!!url && (
            <span>
              <a href={url} target="_blank" rel="noopener noreferrer nofollow">
                {trans('open_on_ao3')} <Icon name="fas fa-external-link-alt" />
              </a>
            </span>
          )}
        </div>
        {!!warnings.length && (
          <div className="Ao3FicCard-warnings">
            {warnings.map((warning) => (
              <span className="Ao3Cw">{warning}</span>
            ))}
          </div>
        )}
      </div>,
      -10
    );
  });
}
