<?php
// carousel_save.php
header('Content-Type: application/json; charset=utf-8');

// 1. Перевіряємо, що прийшов POST з полем payload
if (!isset($_POST['payload'])) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Не передано payload у POST-запиті.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Декодуємо JSON із payload
$raw = $_POST['payload'];
$data = json_decode($raw, true);

if (!is_array($data) || !isset($data['slides']) || !is_array($data['slides'])) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Невірний формат JSON (немає масиву slides).',
        'raw'     => $raw
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. Готуємо структуру для збереження
$wrapped = [
    'slides'      => $data['slides'],
    'intervalSec' => isset($data['intervalSec']) ? (int)$data['intervalSec'] : 4,
    'startIndex'  => isset($data['startIndex']) ? (int)$data['startIndex'] : 0,
    'savedAt'     => date('Y-m-d H:i:s')
];

// 4. Записуємо у файл
$filePath = __DIR__ . DIRECTORY_SEPARATOR . 'carousel_data.json';

$result = @file_put_contents(
    $filePath,
    json_encode($wrapped, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
);

if ($result === false) {
    error_log("Не вдалося записати файл: $filePath");

    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Не вдалося записати файл carousel_data.json. Перевірте права на папку.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. Якщо все ок – повертаємо JSON
echo json_encode([
    'status'  => 'ok',
    'message' => 'Дані каруселі збережено.',
    'savedAt' => $wrapped['savedAt']
], JSON_UNESCAPED_UNICODE);
