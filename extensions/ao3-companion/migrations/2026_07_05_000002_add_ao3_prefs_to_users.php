<?php

use Flarum\Database\Migration;

return Migration::addColumns('users', [
    'ao3_hidden_warnings' => ['text', 'nullable' => true],
    'ao3_hide_spoilers' => ['boolean', 'default' => false],
]);
