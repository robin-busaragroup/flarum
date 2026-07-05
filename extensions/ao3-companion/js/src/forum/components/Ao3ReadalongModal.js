import app from 'flarum/forum/app';
import FormModal from 'flarum/common/components/FormModal';
import Button from 'flarum/common/components/Button';

export default class Ao3ReadalongModal extends FormModal {
  oninit(vnode) {
    super.oninit(vnode);

    // Deep copy so edits don't mutate the model until saved.
    this.rows = (this.attrs.discussion.ao3Readalong() || []).map((r) => ({
      chapter: r.chapter || '',
      label: r.label || '',
      date: r.date || '',
    }));

    if (!this.rows.length) this.addRow();

    this.loading = false;
  }

  className() {
    return 'Ao3ReadalongModal Modal--medium';
  }

  title() {
    return app.translator.trans('ao3-companion.forum.readalong.modal_title');
  }

  trans(key) {
    return app.translator.trans(`ao3-companion.forum.readalong.${key}`);
  }

  addRow() {
    this.rows.push({ chapter: '', label: '', date: '' });
  }

  content() {
    return (
      <div className="Modal-body">
        <p className="helpText">{this.trans('modal_help')}</p>

        <table className="Ao3ReadalongTable">
          <thead>
            <tr>
              <th>{this.trans('col_chapter')}</th>
              <th>{this.trans('col_label')}</th>
              <th>{this.trans('col_date')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {this.rows.map((row, i) => (
              <tr>
                <td>
                  <input
                    className="FormControl"
                    type="number"
                    min="1"
                    value={row.chapter}
                    oninput={(e) => (row.chapter = e.target.value)}
                  />
                </td>
                <td>
                  <input className="FormControl" value={row.label} oninput={(e) => (row.label = e.target.value)} />
                </td>
                <td>
                  <input className="FormControl" type="date" value={row.date} oninput={(e) => (row.date = e.target.value)} />
                </td>
                <td>
                  <Button
                    className="Button Button--icon Button--flat"
                    icon="fas fa-trash"
                    onclick={() => this.rows.splice(i, 1)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Button className="Button Button--flat" icon="fas fa-plus" onclick={() => this.addRow()}>
          {this.trans('add_row')}
        </Button>

        <div className="Form-group">
          <Button className="Button Button--primary" type="submit" loading={this.loading}>
            {this.trans('save')}
          </Button>
        </div>
      </div>
    );
  }

  onsubmit(e) {
    e.preventDefault();

    this.loading = true;

    const readalong = this.rows
      .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date))
      .map((r) => ({
        chapter: parseInt(r.chapter, 10) || null,
        label: r.label || '',
        date: r.date,
      }));

    this.attrs.discussion.save({ ao3Readalong: readalong }).then(() => this.hide(), this.loaded.bind(this));
  }
}
