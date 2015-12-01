<?php
date_default_timezone_set('GMT');

require(__DIR__ . '/vendor/autoload.php');

$loader = new josegonzalez\Dotenv\Loader('.env');
$loader->parse();

define('ROOT_DIR', __DIR__);
$app = new \Dip\App($loader);

$app->run();