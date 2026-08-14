<?php
namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast immediately (ShouldBroadcastNow) so cPanel hosts without a queue worker still get realtime.
 */
class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message)
    {
        $this->message->loadMissing(['sender:id,name,email,avatar,role']);
    }

    public static function conversationKey(int $userA, int $userB): string
    {
        $low = min($userA, $userB);
        $high = max($userA, $userB);
        return $low . '.' . $high;
    }

    public function broadcastOn(): array
    {
        $key = self::conversationKey(
            (int) $this->message->sender_id,
            (int) $this->message->receiver_id
        );

        return [
            new PrivateChannel('chat.' . $key),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        $m = $this->message;

        return [
            'id' => $m->id,
            'sender_id' => $m->sender_id,
            'receiver_id' => $m->receiver_id,
            'message' => $m->message,
            'created_at' => optional($m->created_at)?->toISOString(),
            'sender' => $m->sender ? [
                'id' => $m->sender->id,
                'name' => $m->sender->name,
                'email' => $m->sender->email,
                'avatar' => $m->sender->avatar,
                'role' => $m->sender->role,
            ] : null,
        ];
    }
}
