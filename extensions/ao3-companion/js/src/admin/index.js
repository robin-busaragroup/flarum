import app from 'flarum/admin/app';

app.initializers.add('ao3-companion', () => {
  app.registry
    .for('ao3-companion')
    .registerSetting({
      setting: 'ao3-companion.warnings',
      type: 'textarea',
      label: app.translator.trans('ao3-companion.admin.settings.warnings_label'),
      help: app.translator.trans('ao3-companion.admin.settings.warnings_help'),
    })
    .registerSetting({
      setting: 'ao3-companion.anonymize_ips',
      type: 'boolean',
      label: app.translator.trans('ao3-companion.admin.settings.anonymize_ips_label'),
      help: app.translator.trans('ao3-companion.admin.settings.anonymize_ips_help'),
    })
    .registerSetting({
      setting: 'ao3-companion.require_type',
      type: 'boolean',
      label: app.translator.trans('ao3-companion.admin.settings.default_type_required_label'),
    });
});
