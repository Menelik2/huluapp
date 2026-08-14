<?php
namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Message;
use App\Models\User;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    public function send(Request $request, PushNotificationService $push)
    {
        $data = $request->validate([
            'receiver_id' => 'required|integer|exists:users,id',
            'message' => 'required|string|max:5000',
        ]);

        $sender = $request->user();
        $receiver = User::findOrFail($data['receiver_id']);

        if ($sender->id === $receiver->id) {
            return response()->json(['message' => 'Cannot message yourself.'], 422);
        }

        // Only customer (user) <-> admin
        $allowed = ($sender->role === User::ROLE_ADMIN && $receiver->role === User::ROLE_USER)
            || ($receiver->role === User::ROLE_ADMIN && $sender->role === User::ROLE_USER);

        if (!$allowed) {
            return response()->json(['message' => 'Chat is only between customers and admin.'], 403);
        }

        $message = Message::create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'message' => $data['message'],
        ]);

        $message->load(['sender:id,name,email,avatar,role']);

        try {
            broadcast(new MessageSent($message));
        } catch (\Throwable $e) {
            Log::warning('Chat broadcast failed: ' . $e->getMessage());
        }

        try {
            $preview = mb_strlen($data['message']) > 80
                ? mb_substr($data['message'], 0, 77) . '...'
                : $data['message'];

            $push->sendToUser(
                $receiver,
                $sender->name ?: 'Kulu',
                $preview,
                [
                    'type' => 'chat',
                    'sender_id' => (string) $sender->id,
                    'message_id' => (string) $message->id,
                ]
            );
        } catch (\Throwable $e) {
            // ignore
        }

        return response()->json($message, 201);
    }

    public function messages(Request $request, $userId)
    {
        $auth = $request->user();
        $otherId = (int) $userId;

        if ($otherId < 1) {
            return response()->json(['message' => 'Invalid user id.'], 422);
        }

        // Participant check (admin or the other user in the thread)
        $other = User::findOrFail($otherId);
        $isParticipant = (
            ($auth->role === User::ROLE_ADMIN && $other->role === User::ROLE_USER)
            || ($auth->role === User::ROLE_USER && $other->role === User::ROLE_ADMIN)
            || $auth->id === $otherId
        );

        if (!$isParticipant) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return Message::with(['sender:id,name,email,avatar,role'])
            ->where(function ($q) use ($auth, $otherId) {
                $q->where(function ($q2) use ($auth, $otherId) {
                    $q2->where('sender_id', $auth->id)->where('receiver_id', $otherId);
                })->orWhere(function ($q2) use ($auth, $otherId) {
                    $q2->where('sender_id', $otherId)->where('receiver_id', $auth->id);
                });
            })
            ->orderBy('created_at')
            ->paginate(50);
    }

    public function channelInfo(Request $request, $userId)
    {
        $auth = $request->user();
        $otherId = (int) $userId;
        if ($otherId < 1) {
            return response()->json(['message' => 'Invalid user id.'], 422);
        }

        $other = User::findOrFail($otherId);
        $allowed = ($auth->role === User::ROLE_ADMIN && $other->role === User::ROLE_USER)
            || ($other->role === User::ROLE_ADMIN && $auth->role === User::ROLE_USER);

        if (!$allowed) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $low = min((int) $auth->id, $otherId);
        $high = max((int) $auth->id, $otherId);

        return [
            'channel' => 'chat.' . $low . '.' . $high,
            'private_channel' => 'private-chat.' . $low . '.' . $high,
            'event' => 'message.sent',
        ];
    }
}
