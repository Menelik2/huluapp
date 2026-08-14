<?php
/**
 * Kulu API front controller for cPanel.
 * Adjust the relative path if kulu_core is not a sibling of public_html.
 */
$core = __DIR__ . '/../kulu_core';

require $core . '/vendor/autoload.php';

$app = require_once $core . '/bootstrap/app.php';

$app->handleRequest(\Illuminate\Http\Request::capture());
