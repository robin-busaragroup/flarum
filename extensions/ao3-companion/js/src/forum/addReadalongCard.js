import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Icon from 'flarum/common/components/Icon';

function formatDate(iso) {
  // Parse as local midnight so the date doesn't shift a day in western TZs.
  const d = new Date(`${iso}T00:00:00`);

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Classify each schedule entry relative to today. "current" = the latest
// checkpoint whose date has arrived; everything before it is done, after it
// upcoming. If nothing has arrived yet, the first entry is the current one.
function classify(schedule) {
  const today = new Date().toISOString().slice(0, 10);

  let currentIndex = -1;
  schedule.forEach((entry, i) => {
    if (entry.date <= today) currentIndex = i;
  });

  if (currentIndex === -1) currentIndex = 0;

  return schedule.map((entry, i) => ({
    ...entry,
    status: i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming',
  }));
}

export default function addReadalongCard() {
  extend('flarum/forum/components/DiscussionPage', 'sidebarItems', function (items) {
    const discussion = this.discussion;
    const schedule = discussion && discussion.ao3Readalong();

    if (!schedule || !schedule.length) return;

    const trans = (key) => app.translator.trans(`ao3-companion.forum.readalong.${key}`);
    const rows = classify(schedule);

    items.add(
      'ao3Readalong',
      <div className="Ao3Readalong">
        <h4 className="Ao3Readalong-heading">
          <Icon name="fas fa-calendar-days" /> {trans('heading')}
        </h4>
        <ul className="Ao3Readalong-list">
          {rows.map((row) => (
            <li className={`Ao3Readalong-item Ao3Readalong-item--${row.status}`}>
              <span className="Ao3Readalong-marker" />
              <span className="Ao3Readalong-chapter">
                {row.chapter
                  ? app.translator.trans('ao3-companion.forum.readalong.chapter_prefix', { number: row.chapter })
                  : ''}
                {row.label ? ` ${row.label}` : ''}
              </span>
              <span className="Ao3Readalong-date">{formatDate(row.date)}</span>
              {row.status === 'current' && <span className="Ao3Readalong-now">{trans('status_current')}</span>}
            </li>
          ))}
        </ul>
      </div>,
      5
    );
  });
}
