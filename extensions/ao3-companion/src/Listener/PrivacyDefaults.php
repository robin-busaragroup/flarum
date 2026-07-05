<?php

namespace Ao3\Companion\Listener;

use Flarum\User\Event\Registered;

/**
 * Privacy-first defaults for every new account. Core defaults these
 * preferences in its boot phase (after extenders run), so a per-user value
 * set at registration is the reliable way to flip them.
 */
class PrivacyDefaults
{
    public function handle(Registered $event): void
    {
        $user = $event->user;

        // Don't disclose online/last-seen status unless the user opts in.
        $user->setPreference('discloseOnline', false);
        $user->save();
    }
}
