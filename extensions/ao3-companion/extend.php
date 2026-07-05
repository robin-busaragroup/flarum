<?php

/*
 * This file is part of AOFORUM.
 *
 * AO3 Companion: thread types, spoiler labels, content warnings and
 * privacy hardening for a fanfic discussion forum.
 */

use Ao3\Companion\Api\Controller\Ao3WorkLookupController;
use Ao3\Companion\Api\DiscussionResourceFields;
use Ao3\Companion\Api\UserResourceFields;
use Ao3\Companion\Formatter\ConfigureSpoilers;
use Ao3\Companion\Listener\AnonymizeIpAddress;
use Ao3\Companion\Listener\PrivacyDefaults;
use Ao3\Companion\Query\Ao3SolvedFilter;
use Ao3\Companion\Query\Ao3TypeFilter;
use Flarum\Api\Resource;
use Flarum\Discussion\Discussion;
use Flarum\Discussion\Search\DiscussionSearcher;
use Flarum\Extend;
use Flarum\Post\Event\Saving as PostSaving;
use Flarum\User\Event\Registered;
use Flarum\Search\Database\DatabaseSearchDriver;
use Flarum\User\User;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->jsDirectory(__DIR__.'/js/dist/forum')
        ->css(__DIR__.'/resources/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js'),

    new Extend\Locales(__DIR__.'/resources/locale'),

    (new Extend\Model(Discussion::class))
        ->cast('ao3_chapter', 'int')
        ->cast('ao3_content_warnings', 'array')
        ->cast('ao3_solved', 'bool'),

    (new Extend\Model(User::class))
        ->cast('ao3_hidden_warnings', 'array')
        ->cast('ao3_hide_spoilers', 'bool'),

    (new Extend\ApiResource(Resource\DiscussionResource::class))
        ->fields(DiscussionResourceFields::class),

    (new Extend\ApiResource(Resource\UserResource::class))
        ->fields(UserResourceFields::class),

    (new Extend\Settings())
        ->default('ao3-companion.warnings', "Graphic Depictions of Violence\nMajor Character Death\nRape/Non-Con\nUnderage")
        ->default('ao3-companion.anonymize_ips', true)
        ->default('ao3-companion.require_type', false)
        ->serializeToForum('ao3Warnings', 'ao3-companion.warnings')
        ->serializeToForum('ao3RequireType', 'ao3-companion.require_type', 'boolval'),

    (new Extend\Formatter())
        ->configure(ConfigureSpoilers::class),

    (new Extend\Event())
        ->listen(PostSaving::class, AnonymizeIpAddress::class)
        ->listen(Registered::class, PrivacyDefaults::class),

    (new Extend\Routes('api'))
        ->get('/ao3/work/{id:\d+}', 'ao3.work', Ao3WorkLookupController::class),

    (new Extend\SearchDriver(DatabaseSearchDriver::class))
        ->addFilter(DiscussionSearcher::class, Ao3TypeFilter::class)
        ->addFilter(DiscussionSearcher::class, Ao3SolvedFilter::class),
];
