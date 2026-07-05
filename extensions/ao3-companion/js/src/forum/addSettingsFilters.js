import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import FieldSet from 'flarum/common/components/FieldSet';
import Switch from 'flarum/common/components/Switch';

import { warningVocabulary } from '../common/ao3';

export default function addSettingsFilters() {
  extend('flarum/forum/components/SettingsPage', 'settingsItems', function (items) {
    const user = this.user;

    if (!user) return;

    const trans = (key) => app.translator.trans(`ao3-companion.forum.settings.${key}`);
    const hidden = user.ao3HiddenWarnings() || [];
    const vocabulary = warningVocabulary(app);

    items.add(
      'ao3Filters',
      <FieldSet className="Settings-ao3 FieldSet--form" label={trans('heading')}>
        <Switch
          state={!!user.ao3HideSpoilers()}
          onchange={(value) => user.save({ ao3HideSpoilers: value })}
        >
          {trans('hide_spoilers_label')}
        </Switch>

        {!!vocabulary.length && (
          <div className="Form-group">
            <label>{trans('hidden_warnings_label')}</label>
            <p className="helpText">{trans('hidden_warnings_help')}</p>
            {vocabulary.map((warning) => (
              <Switch
                state={hidden.includes(warning)}
                onchange={(value) => {
                  const next = value ? [...hidden, warning] : hidden.filter((w) => w !== warning);
                  user.save({ ao3HiddenWarnings: next });
                }}
              >
                {warning}
              </Switch>
            ))}
          </div>
        )}

        <div className="Form-group">
          <Switch
            state={!!user.preferences()['ao3-companion.lff_digest']}
            onchange={(value) => {
              const preferences = user.preferences();
              preferences['ao3-companion.lff_digest'] = value;
              user.save({ preferences });
            }}
          >
            {trans('lff_digest_label')}
          </Switch>
          <p className="helpText">{trans('lff_digest_help')}</p>
        </div>
      </FieldSet>,
      40
    );
  });
}
