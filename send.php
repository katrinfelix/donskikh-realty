<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$TG_TOKEN   = '8684180896:AAH5WsIK3Bg5fqbx3UmdrCXUNe1_JTdEnSA';
$TG_CHAT_ID = '6213426240';

$input = json_decode(file_get_contents('php://input'), true);

$name      = trim(strip_tags($input['name'] ?? ''));
$phone     = trim(strip_tags($input['phone'] ?? ''));
$situation = trim(strip_tags($input['situation'] ?? ''));
$message   = trim(strip_tags($input['message'] ?? ''));

if (!$name || !$phone) {
    echo json_encode(['ok' => false, 'error' => 'missing fields']);
    exit;
}

$situations = ['buy' => 'Куплю', 'sell' => 'Продам', 'invest' => 'Инвестирую', 'other' => 'Другое'];
$sit_label  = $situations[$situation] ?? $situation;

$text = "🏠 *Новая заявка с сайта*\n\n"
      . "👤 " . $name . "\n"
      . "📞 " . $phone . "\n"
      . "📋 " . $sit_label
      . ($message ? "\n💬 " . $message : '');

$response = file_get_contents(
    "https://api.telegram.org/bot{$TG_TOKEN}/sendMessage",
    false,
    stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => 'Content-Type: application/json',
            'content' => json_encode([
                'chat_id'    => $TG_CHAT_ID,
                'text'       => $text,
                'parse_mode' => 'Markdown'
            ])
        ]
    ])
);

echo $response ?: json_encode(['ok' => false]);
