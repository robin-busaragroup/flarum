<?php

use Flarum\Database\Migration;

return Migration::addColumns('discussions', [
    'ao3_type' => ['string', 'length' => 20, 'nullable' => true],
    'ao3_fic_title' => ['string', 'length' => 255, 'nullable' => true],
    'ao3_fic_url' => ['string', 'length' => 255, 'nullable' => true],
    'ao3_chapter' => ['integer', 'unsigned' => true, 'nullable' => true],
    'ao3_spoiler_scope' => ['string', 'length' => 120, 'nullable' => true],
    'ao3_content_warnings' => ['text', 'nullable' => true],
]);
