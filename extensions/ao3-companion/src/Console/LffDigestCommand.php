<?php

namespace Ao3\Companion\Console;

use Carbon\Carbon;
use Flarum\Discussion\Discussion;
use Flarum\Http\UrlGenerator;
use Flarum\Locale\TranslatorInterface;
use Flarum\Mail\Job\SendInformationalEmailJob;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\User;
use Illuminate\Console\Command;
use Illuminate\Contracts\Queue\Queue;

class LffDigestCommand extends Command
{
    protected $signature = 'ao3:lff-digest {--dry-run : Print the digest instead of emailing it}';

    protected $description = 'Email opted-in members a digest of fic searches still open.';

    public function handle(
        Queue $queue,
        UrlGenerator $url,
        SettingsRepositoryInterface $settings,
        TranslatorInterface $translator
    ): int {
        $open = Discussion::query()
            ->where('ao3_type', 'lff')
            ->where('ao3_solved', false)
            ->whereNull('hidden_at')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        if ($open->isEmpty()) {
            $this->info('No open "looking for a fic" threads — nothing to send.');

            return Command::SUCCESS;
        }

        $forumTitle = (string) $settings->get('forum_title');
        $lines = $open->map(function (Discussion $d) use ($url) {
            $age = Carbon::parse($d->created_at)->diffForHumans();
            $link = $url->to('forum')->path('d/'.$d->id);

            return "• {$d->title} ({$age})\n  {$link}";
        });

        $body = "Fanfics your fellow readers are still hunting for:\n\n"
            .$lines->implode("\n\n")
            ."\n\nRecognise one? Reply with the link — and mark it found when it's solved.\n\n"
            .'You can turn this digest off in your forum settings.';

        $count = $open->count();
        $subject = $translator->trans('ao3-companion.email.lff_digest.subject', [
            'count' => $count,
            'forum' => $forumTitle,
        ]);

        // The translation strings are pluralized with {1}…|[2,*]… syntax;
        // fall back to a plain string if the locale file isn't loaded (CLI).
        if (str_contains($subject, '|') || str_contains($subject, 'ao3-companion.email')) {
            $noun = $count === 1 ? 'fic search' : 'fic searches';
            $subject = "{$count} {$noun} still open on {$forumTitle}";
        }

        if ($this->option('dry-run')) {
            $recipients = $this->recipients()->count();
            $this->info("Subject: {$subject}");
            $this->info("Recipients (opted in): {$recipients}");
            $this->line('');
            $this->line($body);

            return Command::SUCCESS;
        }

        $sent = 0;

        $this->recipients()->each(function (User $user) use ($queue, $subject, $body, $forumTitle, &$sent) {
            $queue->push(new SendInformationalEmailJob(
                email: $user->email,
                displayName: $user->display_name,
                subject: $subject,
                body: $body,
                forumTitle: $forumTitle,
                bodyTitle: 'Still looking',
                locale: $user->getPreference('locale'),
            ));

            $sent++;
        });

        $this->info("Queued the digest for {$sent} member(s).");

        return Command::SUCCESS;
    }

    /**
     * Members who opted into the digest and have a confirmed email.
     *
     * @return \Illuminate\Database\Eloquent\Builder<User>
     */
    protected function recipients()
    {
        return User::query()
            ->whereNotNull('email')
            ->where('is_email_confirmed', true)
            // Preferences are stored as JSON; a LIKE keeps this DB-agnostic.
            ->where('preferences', 'like', '%"ao3-companion.lff_digest":true%');
    }
}
