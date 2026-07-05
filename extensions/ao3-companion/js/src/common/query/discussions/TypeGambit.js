import { KeyValueGambit } from 'flarum/common/query/IGambit';

export default class TypeGambit extends KeyValueGambit {
  key() {
    return 'type';
  }

  hint() {
    return 'rec, chapter, lff, general';
  }

  filterKey() {
    return 'ao3Type';
  }
}
