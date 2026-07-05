import Extend from 'flarum/common/extenders';
import Discussion from 'flarum/common/models/Discussion';
import User from 'flarum/common/models/User';

export default [
  new Extend.Model(Discussion)
    .attribute('ao3Type')
    .attribute('ao3FicTitle')
    .attribute('ao3FicUrl')
    .attribute('ao3Chapter')
    .attribute('ao3SpoilerScope')
    .attribute('ao3ContentWarnings'),

  new Extend.Model(User) //
    .attribute('ao3HiddenWarnings')
    .attribute('ao3HideSpoilers'),
];
