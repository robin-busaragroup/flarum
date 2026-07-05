import app from 'flarum/forum/app';

import addComposerFields from './addComposerFields';
import addBadges from './addBadges';
import addFicCard from './addFicCard';
import addCwFiltering from './addCwFiltering';
import addCwInterstitial from './addCwInterstitial';
import addDiscussionControls from './addDiscussionControls';
import addReadalongCard from './addReadalongCard';
import addTypeNavigation from './addTypeNavigation';
import addSettingsFilters from './addSettingsFilters';

export { default as extend } from './extend';

app.initializers.add('ao3-companion', () => {
  addComposerFields();
  addBadges();
  addFicCard();
  addCwFiltering();
  addCwInterstitial();
  addDiscussionControls();
  addReadalongCard();
  addTypeNavigation();
  addSettingsFilters();
});
