<?php

namespace Ao3\Companion\Listener;

use Flarum\Post\Event\Saving;
use Flarum\Settings\SettingsRepositoryInterface;

/**
 * Privacy hardening: never persist poster IP addresses when enabled.
 */
class AnonymizeIpAddress
{
    public function __construct(
        protected SettingsRepositoryInterface $settings
    ) {
    }

    public function handle(Saving $event): void
    {
        if ((bool) $this->settings->get('ao3-companion.anonymize_ips')) {
            $event->post->ip_address = null;
        }
    }
}
