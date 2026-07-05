<?php

namespace Ao3\Companion\Formatter;

use s9e\TextFormatter\Configurator;

/**
 * Adds spoiler markup to posts:
 *
 *   [spoiler]...[/spoiler]              -> collapsed <details> block
 *   [spoiler=Chapter 12]...[/spoiler]   -> collapsed block with a label
 *   ||inline spoiler||                  -> blacked-out inline text
 */
class ConfigureSpoilers
{
    public function __invoke(Configurator $config): void
    {
        if (! isset($config->BBCodes['SPOILER'])) {
            $config->BBCodes->addCustom(
                '[SPOILER title={TEXT1;optional}]{TEXT2}[/SPOILER]',
                '<details class="Ao3Spoiler"><summary><xsl:choose><xsl:when test="@title"><xsl:value-of select="@title"/></xsl:when><xsl:otherwise>Spoiler</xsl:otherwise></xsl:choose></summary>{TEXT2}</details>'
            );
        }

        $config->Preg->replace(
            '/\|\|(.+?)\|\|/s',
            '<span class="Ao3SpoilerInline" tabindex="0">$1</span>',
            'AO3INLINESPOILER'
        );
    }
}
