<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
| Conversation channel name is always private-chat.{lowUserId}.{highUserId}
| Only the two participants may subscribe.
*/
Broadcast::channel('chat.{low}.{high}', function (User $user, int $low, int $high) {
    if ($low < 1 || $high < 1 || $low >= $high) {
        return false;
    }

    $uid = (int) $user->id;
    if ($uid !== $low && $uid !== $high) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'role' => $user->role,
    ];
});
