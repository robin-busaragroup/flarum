<?php

namespace Ao3\Companion\Query;

use Flarum\Search\Database\DatabaseSearchState;
use Flarum\Search\Filter\FilterInterface;
use Flarum\Search\SearchState;

/**
 * Filters "looking for a fic" threads by solved state, e.g. is:found in
 * search or ?filter[ao3Solved]=true.
 *
 * @implements FilterInterface<DatabaseSearchState>
 */
class Ao3SolvedFilter implements FilterInterface
{
    public function getFilterKey(): string
    {
        return 'ao3Solved';
    }

    public function filter(SearchState $state, string|array $value, bool $negate): void
    {
        $state->getQuery()->where('discussions.ao3_solved', ! $negate);
    }
}
