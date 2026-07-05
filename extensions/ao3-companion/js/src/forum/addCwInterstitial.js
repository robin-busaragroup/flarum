import app from 'flarum/forum/app';
import { override } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';

import { revealed, matchedWarnings } from './cwState';

// Navigating straight into a thread (search result, shared link) must not
// bypass the reader's content filters: block the page with an interstitial
// until they opt in.
export default function addCwInterstitial() {
  override('flarum/forum/components/DiscussionPage', 'view', function (original) {
    const discussion = this.discussion;

    if (this.loading || !discussion || revealed.has(discussion.id())) {
      return original();
    }

    const matched = matchedWarnings(discussion);

    if (!matched.length) {
      return original();
    }

    const trans = (key, data) => app.translator.trans(`ao3-companion.forum.interstitial.${key}`, data);

    return (
      <div className="DiscussionPage Ao3Interstitial">
        <div className="container">
          <div className="Ao3Interstitial-card">
            <Icon name="fas fa-eye-slash" className="Ao3Interstitial-icon" />
            <h2>{trans('heading')}</h2>
            <p>{trans('body', { warnings: matched.join(', ') })}</p>
            <div className="Ao3Interstitial-actions">
              <Button
                className="Button"
                onclick={() => {
                  app.history.canGoBack() ? app.history.back() : m.route.set('/');
                }}
              >
                {trans('back')}
              </Button>
              <Button
                className="Button Button--primary"
                onclick={() => {
                  revealed.add(discussion.id());
                  m.redraw();
                }}
              >
                {trans('show')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  });
}
