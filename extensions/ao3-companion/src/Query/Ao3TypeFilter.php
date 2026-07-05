<?php

namespace Ao3\Companion\Query;

use Ao3\Companion\Api\DiscussionResourceFields;
use Flarum\Search\Database\DatabaseSearchState;
use Flarum\Search\Filter\FilterInterface;
use Flarum\Search\SearchState;

/**
 * Allows the discussion list to be filtered by AO3 thread type,
 * e.g. ?filter[ao3Type]=rec for fic recommendation threads.
 *
 * @implements FilterInterface<DatabaseSearchState>
 */
class Ao3TypeFilter implements FilterInterface
{
    public function getFilterKey(): string
    {
        return 'ao3Type';
    }

    public function filter(SearchState $state, string|array $value, bool $negate): void
    {
        $types = array_intersect((array) $value, DiscussionResourceFields::TYPES);

        if (! $types) {
            return;
        }

        $state->getQuery()->whereIn('discussions.ao3_type', $types, 'and', $negate);
    }
}
