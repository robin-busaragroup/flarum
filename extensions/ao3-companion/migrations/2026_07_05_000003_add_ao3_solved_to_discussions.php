<?php

use Flarum\Database\Migration;

return Migration::addColumns('discussions', [
    'ao3_solved' => ['boolean', 'default' => false],
]);
