<?php

namespace Ao3\Companion\Api;

use Flarum\Api\Context;
use Flarum\Api\Schema;
use Flarum\Discussion\Discussion;
use Flarum\Settings\SettingsRepositoryInterface;

class DiscussionResourceFields
{
    public const TYPES = ['rec', 'chapter', 'lff', 'general'];

    public function __construct(
        protected SettingsRepositoryInterface $settings
    ) {
    }

    public function __invoke(): array
    {
        $writable = function (Discussion $discussion, Context $context): bool {
            return $context->creating()
                || ($context->updating() && $context->getActor()->can('rename', $discussion));
        };

        return [
            Schema\Str::make('ao3Type')
                ->nullable()
                ->writable($writable)
                ->set(function (Discussion $discussion, ?string $value) {
                    $discussion->ao3_type = in_array($value, self::TYPES, true) ? $value : null;
                }),

            Schema\Str::make('ao3FicTitle')
                ->nullable()
                ->maxLength(255)
                ->writable($writable)
                ->set(function (Discussion $discussion, ?string $value) {
                    $discussion->ao3_fic_title = $value !== null ? trim($value) ?: null : null;
                }),

            Schema\Str::make('ao3FicUrl')
                ->nullable()
                ->maxLength(255)
                ->writable($writable)
                ->set(function (Discussion $discussion, ?string $value) {
                    $value = $value !== null ? trim($value) : null;

                    // Only accept http(s) URLs to keep rendered links safe.
                    if ($value !== null && ! preg_match('/^https?:\/\//i', $value)) {
                        $value = null;
                    }

                    $discussion->ao3_fic_url = $value ?: null;
                }),

            Schema\Integer::make('ao3Chapter')
                ->nullable()
                ->writable($writable)
                ->set(function (Discussion $discussion, ?int $value) {
                    $discussion->ao3_chapter = ($value !== null && $value > 0) ? $value : null;
                }),

            Schema\Str::make('ao3SpoilerScope')
                ->nullable()
                ->maxLength(120)
                ->writable($writable)
                ->set(function (Discussion $discussion, ?string $value) {
                    $discussion->ao3_spoiler_scope = $value !== null ? trim($value) ?: null : null;
                }),

            Schema\Arr::make('ao3ContentWarnings')
                ->nullable()
                ->writable($writable)
                ->set(function (Discussion $discussion, ?array $value) {
                    $vocabulary = $this->vocabulary();

                    $warnings = array_values(array_intersect(
                        array_map(strval(...), $value ?? []),
                        $vocabulary
                    ));

                    $discussion->ao3_content_warnings = $warnings ?: null;
                }),
        ];
    }

    /**
     * @return string[]
     */
    protected function vocabulary(): array
    {
        $raw = (string) $this->settings->get('ao3-companion.warnings', '');

        return array_values(array_filter(array_map(trim(...), explode("\n", $raw))));
    }
}
