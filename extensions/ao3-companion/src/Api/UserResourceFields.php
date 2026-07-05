<?php

namespace Ao3\Companion\Api;

use Flarum\Api\Context;
use Flarum\Api\Schema;
use Flarum\User\User;

class UserResourceFields
{
    public function __invoke(): array
    {
        // Filter preferences are personal: only the user themselves (or nobody
        // else at all) can see or change them.
        $self = function (User $user, Context $context): bool {
            return $context->getActor()->id === $user->id;
        };

        return [
            Schema\Arr::make('ao3HiddenWarnings')
                ->nullable()
                ->visible($self)
                ->writable($self)
                ->set(function (User $user, ?array $value) {
                    $warnings = array_values(array_filter(array_map(strval(...), $value ?? [])));

                    $user->ao3_hidden_warnings = $warnings ?: null;
                }),

            Schema\Boolean::make('ao3HideSpoilers')
                ->visible($self)
                ->writable($self),
        ];
    }
}
