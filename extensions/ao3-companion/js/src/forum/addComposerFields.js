import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import Select from 'flarum/common/components/Select';
import extractText from 'flarum/common/utils/extractText';

import { TYPES, typeLabel, warningVocabulary } from '../common/ao3';

export default function addComposerFields() {
  extend('flarum/forum/components/DiscussionComposer', 'oninit', function () {
    const fields = this.composer.fields;

    fields.ao3Type = fields.ao3Type || '';
    fields.ao3FicTitle = fields.ao3FicTitle || '';
    fields.ao3FicUrl = fields.ao3FicUrl || '';
    fields.ao3Chapter = fields.ao3Chapter || '';
    fields.ao3SpoilerScope = fields.ao3SpoilerScope || '';
    fields.ao3ContentWarnings = fields.ao3ContentWarnings || [];
  });

  extend('flarum/forum/components/DiscussionComposer', 'headerItems', function (items) {
    const fields = this.composer.fields;
    const trans = (key) => app.translator.trans(`ao3-companion.forum.composer.${key}`);
    const vocabulary = warningVocabulary(app);

    const typeOptions = { '': extractText(trans('type_placeholder')) };
    TYPES.forEach((type) => {
      typeOptions[type] = extractText(typeLabel(app, type));
    });

    const showDetails = fields.ao3Type && fields.ao3Type !== 'general';

    const textInput = (key, placeholderKey, attrs = {}) => (
      <input
        className="FormControl"
        value={fields[key]}
        placeholder={extractText(trans(placeholderKey))}
        oninput={(e) => (fields[key] = e.target.value)}
        {...attrs}
      />
    );

    items.add(
      'ao3Fields',
      <div className="Ao3ComposerFields">
        <div className="Ao3ComposerFields-row">
          <Select value={fields.ao3Type} options={typeOptions} onchange={(value) => (fields.ao3Type = value)} />
          {showDetails && textInput('ao3FicTitle', 'fic_title_placeholder')}
          {showDetails && textInput('ao3FicUrl', 'fic_url_placeholder', { type: 'url' })}
        </div>
        {showDetails && (
          <div className="Ao3ComposerFields-row">
            {fields.ao3Type === 'chapter' && textInput('ao3Chapter', 'chapter_placeholder', { type: 'number', min: 1 })}
            {textInput('ao3SpoilerScope', 'spoiler_scope_placeholder')}
          </div>
        )}
        {!!fields.ao3Type && !!vocabulary.length && (
          <ul className="Ao3CwChecklist">
            {vocabulary.map((warning) => (
              <li>
                <label>
                  <input
                    type="checkbox"
                    checked={fields.ao3ContentWarnings.includes(warning)}
                    onchange={(e) => {
                      if (e.target.checked) {
                        fields.ao3ContentWarnings.push(warning);
                      } else {
                        fields.ao3ContentWarnings = fields.ao3ContentWarnings.filter((w) => w !== warning);
                      }
                    }}
                  />
                  {warning}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>,
      5
    );
  });

  extend('flarum/forum/components/DiscussionComposer', 'data', function (data) {
    const fields = this.composer.fields;

    data.ao3Type = fields.ao3Type || null;
    data.ao3FicTitle = fields.ao3FicTitle || null;
    data.ao3FicUrl = fields.ao3FicUrl || null;
    data.ao3Chapter = parseInt(fields.ao3Chapter, 10) || null;
    data.ao3SpoilerScope = fields.ao3SpoilerScope || null;
    data.ao3ContentWarnings = fields.ao3ContentWarnings || [];
  });

  override('flarum/forum/components/DiscussionComposer', 'onsubmit', function (original) {
    if (app.forum.attribute('ao3RequireType') && !this.composer.fields.ao3Type) {
      app.alerts.show({ type: 'error' }, app.translator.trans('ao3-companion.forum.composer.type_required_alert'));
      return;
    }

    return original();
  });
}
