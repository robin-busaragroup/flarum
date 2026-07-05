import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import Select from 'flarum/common/components/Select';
import Button from 'flarum/common/components/Button';
import extractText from 'flarum/common/utils/extractText';

import { TYPES, typeLabel, warningVocabulary } from '../common/ao3';

// Map fetched AO3 relationships onto forum ship tags, and add matched tags to
// the composer's tag selection. Returns { added:[names], unmatched:[ao3names] }.
function suggestShipTags(component, relationships) {
  const aliases = app.forum.attribute('ao3ShipAliases') || {};
  const current = component.composer.fields.tags || [];
  const currentIds = new Set(current.map((t) => t.id()));

  const added = [];
  const unmatched = [];

  (relationships || []).forEach((rel) => {
    const lower = rel.toLowerCase();
    let slug = null;

    for (const [needle, target] of Object.entries(aliases)) {
      if (lower.includes(needle)) {
        slug = target;
        break;
      }
    }

    const tag = slug && app.store.getBy('tags', 'slug', slug);

    if (tag) {
      if (!currentIds.has(tag.id())) {
        current.push(tag);
        currentIds.add(tag.id());
        added.push(tag.name());
      }
    } else {
      unmatched.push(rel);
    }
  });

  component.composer.fields.tags = current;

  return { added, unmatched };
}

function fetchAo3Metadata(component, onDone) {
  const fields = component.composer.fields;
  const match = (fields.ao3FicUrl || '').match(/archiveofourown\.org\/works\/(\d+)/);

  if (!match) {
    app.alerts.show({ type: 'error' }, app.translator.trans('ao3-companion.forum.composer.fetch_bad_url'));
    onDone();
    return;
  }

  app
    .request({ method: 'GET', url: `${app.forum.attribute('apiUrl')}/ao3/work/${match[1]}` })
    .then((data) => {
      if (data.title && !fields.ao3FicTitle) {
        fields.ao3FicTitle = data.title;
      }

      // AO3 capitalizes connective words inconsistently ("Depictions Of
      // Violence"), so match against the vocabulary case-insensitively.
      const byLower = new Map(warningVocabulary(app).map((w) => [w.toLowerCase(), w]));
      const suggested = (data.warnings || []).map((w) => byLower.get(w.toLowerCase())).filter(Boolean);

      fields.ao3ContentWarnings = [...new Set([...(fields.ao3ContentWarnings || []), ...suggested])];

      const ships = suggestShipTags(component, data.relationships);

      app.alerts.show(
        { type: 'success' },
        app.translator.trans('ao3-companion.forum.composer.fetch_success', {
          title: data.title || '?',
          rating: data.rating || '—',
        })
      );

      if (ships.added.length) {
        app.alerts.show(
          { type: 'success' },
          app.translator.trans('ao3-companion.forum.composer.ships_added', { ships: ships.added.join(', ') })
        );
      }

      if (ships.unmatched.length) {
        app.alerts.show(
          {},
          app.translator.trans('ao3-companion.forum.composer.ships_unmatched', { ships: ships.unmatched.join(', ') })
        );
      }
    })
    .catch(() => {
      app.alerts.show({ type: 'error' }, app.translator.trans('ao3-companion.forum.composer.fetch_failed'));
    })
    .finally(onDone);
}

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
          <Select
            value={fields.ao3Type}
            options={typeOptions}
            onchange={(value) => {
              fields.ao3Type = value;

              // A stale chapter number from a previously selected type would
              // silently attach to the new thread.
              if (value !== 'chapter') fields.ao3Chapter = '';
            }}
          />
          {showDetails && textInput('ao3FicTitle', 'fic_title_placeholder')}
          {showDetails && textInput('ao3FicUrl', 'fic_url_placeholder', { type: 'url' })}
          {showDetails && (
            <Button
              className="Button Ao3FetchButton"
              icon="fas fa-wand-magic-sparkles"
              loading={this.ao3Fetching}
              disabled={!/archiveofourown\.org\/works\/\d+/.test(fields.ao3FicUrl || '')}
              onclick={() => {
                this.ao3Fetching = true;
                fetchAo3Metadata(this, () => {
                  this.ao3Fetching = false;
                  m.redraw();
                });
              }}
            >
              {app.translator.trans('ao3-companion.forum.composer.fetch_button')}
            </Button>
          )}
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
