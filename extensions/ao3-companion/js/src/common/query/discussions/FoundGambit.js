import { BooleanGambit } from 'flarum/common/query/IGambit';

export default class FoundGambit extends BooleanGambit {
  key() {
    return 'found';
  }

  filterKey() {
    return 'ao3Solved';
  }
}
