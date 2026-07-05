import Extend from 'flarum/common/extenders';

import TypeGambit from './query/discussions/TypeGambit';
import FoundGambit from './query/discussions/FoundGambit';

export default [
  new Extend.Search() //
    .gambit('discussions', TypeGambit)
    .gambit('discussions', FoundGambit),
];
