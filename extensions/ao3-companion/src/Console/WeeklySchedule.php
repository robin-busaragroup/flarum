<?php

namespace Ao3\Companion\Console;

use Illuminate\Console\Scheduling\Event;

class WeeklySchedule
{
    public function __invoke(Event $event): void
    {
        // Monday mornings, once, never overlapping a still-running send.
        $event->weeklyOn(1, '8:00')->withoutOverlapping();
    }
}
