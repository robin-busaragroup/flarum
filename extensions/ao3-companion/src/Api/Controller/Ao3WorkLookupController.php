<?php

namespace Ao3\Companion\Api\Controller;

use Flarum\Http\RequestUtil;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Fetches public metadata (title, rating, archive warnings, fandoms, ships)
 * for an AO3 work so the composer can auto-fill fic details.
 *
 * SSRF-safe by construction: the client only ever sends a numeric work id,
 * and the URL is built here against a fixed host.
 */
class Ao3WorkLookupController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        // Registered users only, so the endpoint can't be used as an
        // anonymous crawling proxy.
        RequestUtil::getActor($request)->assertRegistered();

        $id = (int) Arr::get($request->getQueryParams(), 'id');

        if ($id < 1) {
            return new JsonResponse(['error' => 'invalid_id'], 400);
        }

        try {
            $response = (new Client([
                'timeout' => 8,
                'connect_timeout' => 4,
                'headers' => [
                    'User-Agent' => 'AOFORUM metadata fetcher (+forum software; contact admin)',
                ],
            ]))->get("https://archiveofourown.org/works/{$id}?view_adult=true");
        } catch (GuzzleException) {
            return new JsonResponse(['error' => 'unreachable'], 502);
        }

        $html = (string) $response->getBody();

        return new JsonResponse([
            'title' => $this->title($html),
            'rating' => Arr::first($this->tags($html, 'rating')),
            'warnings' => $this->tags($html, 'warning'),
            'fandoms' => $this->tags($html, 'fandom'),
            'relationships' => $this->tags($html, 'relationship'),
            'chapters' => $this->chapters($html),
        ]);
    }

    protected function title(string $html): ?string
    {
        if (preg_match('/<h2 class="title heading">\s*(.*?)\s*<\/h2>/s', $html, $m)) {
            return html_entity_decode(trim(strip_tags($m[1])), ENT_QUOTES | ENT_HTML5);
        }

        return null;
    }

    /**
     * @return string[]
     */
    protected function tags(string $html, string $kind): array
    {
        if (! preg_match('/<dd class="'.$kind.' tags">(.*?)<\/dd>/s', $html, $m)) {
            return [];
        }

        preg_match_all('/<a[^>]*class="tag"[^>]*>(.*?)<\/a>/s', $m[1], $tags);

        return array_map(
            fn (string $tag) => html_entity_decode(trim(strip_tags($tag)), ENT_QUOTES | ENT_HTML5),
            $tags[1]
        );
    }

    protected function chapters(string $html): ?string
    {
        if (preg_match('/<dd class="chapters">\s*(.*?)\s*<\/dd>/s', $html, $m)) {
            return trim(strip_tags($m[1]));
        }

        return null;
    }
}
