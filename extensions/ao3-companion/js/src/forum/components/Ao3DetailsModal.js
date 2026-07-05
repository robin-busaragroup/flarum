import app from 'flarum/forum/app';
import FormModal from 'flarum/common/components/FormModal';
import Button from 'flarum/common/components/Button';
import Select from 'flarum/common/components/Select';
import extractText from 'flarum/common/utils/extractText';
import Stream from 'flarum/common/utils/Stream';

import { TYPES, typeLabel, warningVocabulary } from '../../common/ao3';

export default class Ao3DetailsModal extends FormModal {
  oninit(vnode) {
    super.oninit(vnode);

    const discussion = this.attrs.discussion;

    this.type = Stream(discussion.ao3Type() || '');
    this.ficTitle = Stream(discussion.ao3FicTitle() || '');
    this.ficUrl = Stream(discussion.ao3FicUrl() || '');
    this.chapter = Stream(discussion.ao3Chapter() || '');
    this.spoilerScope = Stream(discussion.ao3SpoilerScope() || '');
    this.warnings = (discussion.ao3ContentWarnings() || []).slice();
    this.loading = false;
  }

  className() {
    return 'Ao3DetailsModal Modal--small';
  }

  title() {
    return app.translator.trans('ao3-companion.forum.modal.title');
  }

  trans(key) {
    return app.translator.trans(`ao3-companion.forum.composer.${key}`);
  }

  content() {
    const typeOptions = { '': extractText(this.trans('type_placeholder')) };
    TYPES.forEach((type) => {
      typeOptions[type] = extractText(typeLabel(app, type));
    });

    const vocabulary = warningVocabulary(app);

    const input = (stream, labelKey, placeholderKey, attrs = {}) => (
      <div className="Form-group">
        <label>{this.trans(labelKey)}</label>
        <input className="FormControl" bidi={stream} placeholder={extractText(this.trans(placeholderKey))} {...attrs} />
      </div>
    );

    return (
      <div className="Modal-body">
        <div className="Form">
          <div className="Form-group">
            <label>{this.trans('type_label')}</label>
            <Select value={this.type()} options={typeOptions} onchange={this.type} />
          </div>
          {input(this.ficTitle, 'fic_title_label', 'fic_title_placeholder')}
          {input(this.ficUrl, 'fic_url_label', 'fic_url_placeholder', { type: 'url' })}
          {this.type() === 'chapter' && input(this.chapter, 'chapter_label', 'chapter_placeholder', { type: 'number', min: 1 })}
          {input(this.spoilerScope, 'spoiler_scope_label', 'spoiler_scope_placeholder')}
          {!!vocabulary.length && (
            <div className="Form-group">
              <label>{this.trans('content_warnings_label')}</label>
              <ul className="Ao3CwChecklist">
                {vocabulary.map((warning) => (
                  <li>
                    <label>
                      <input
                        type="checkbox"
                        checked={this.warnings.includes(warning)}
                        onchange={(e) => {
                          if (e.target.checked) {
                            this.warnings.push(warning);
                          } else {
                            this.warnings = this.warnings.filter((w) => w !== warning);
                          }
                        }}
                      />
                      {warning}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="Form-group">
            <Button className="Button Button--primary" type="submit" loading={this.loading}>
              {app.translator.trans('ao3-companion.forum.modal.submit')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  onsubmit(e) {
    e.preventDefault();

    this.loading = true;

    this.attrs.discussion
      .save({
        ao3Type: this.type() || null,
        ao3FicTitle: this.ficTitle() || null,
        ao3FicUrl: this.ficUrl() || null,
        ao3Chapter: parseInt(this.chapter(), 10) || null,
        ao3SpoilerScope: this.spoilerScope() || null,
        ao3ContentWarnings: this.warnings,
      })
      .then(() => this.hide(), this.loaded.bind(this));
  }
}
