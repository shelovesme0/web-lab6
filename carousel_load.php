<?php
// carousel_load.php
header('Content-Type: application/json; charset=utf-8');

$file = __DIR__ . DIRECTORY_SEPARATOR . 'carousel_data.json';

if (!file_exists($file)) {
    echo json_encode([
        'status'      => 'empty',
        'slides'      => [],
        'intervalSec' => 4,
        'startIndex'  => 0,
        'savedAt'     => null
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$json = file_get_contents($file);
$data = json_decode($json, true);

if (!is_array($data)) {
    echo json_encode([
        'status'      => 'error',
        'message'     => 'Файл з даними каруселі пошкоджено.',
        'slides'      => [],
        'intervalSec' => 4,
        'startIndex'  => 0,
        'savedAt'     => null
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$data['status'] = 'ok';

echo json_encode($data, JSON_UNESCAPED_UNICODE);
