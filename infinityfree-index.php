<?php
/**
 * Kulu API front controller for InfinityFree.
 * All Laravel files are in the same directory (htdocs/).
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$app->handleRequest(\Illuminate\Http\Request::capture());
