<?php

use Flarum\Database\Migration;

return Migration::addColumns('discussions', [
    'ao3_readalong' => ['text', 'nullable' => true],
]);
