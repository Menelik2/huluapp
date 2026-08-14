<?php
namespace App\Services;

use App\Models\User;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\AndroidConfig;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    protected function messaging()
    {
        $credentials = config('services.firebase.credentials');
        if (!$credentials || !is_readable($credentials)) {
            return null;
        }

        return (new Factory)
            ->withServiceAccount($credentials)
            ->createMessaging();
    }

    /**
     * Send a data+notification push to a single user.
     * Clears stale tokens when FCM reports them invalid/unregistered.
     */
    public function sendToUser(?User $user, string $title, string $body, array $data = []): bool
    {
        if (!$user || !$user->fcm_token) {
            return false;
        }

        $messaging = $this->messaging();
        if (!$messaging) {
            Log::warning('FCM skipped: Firebase credentials missing or unreadable');
            return false;
        }

        try {
            $message = CloudMessage::withTarget('token', $user->fcm_token)
                ->withNotification(Notification::create($title, $body))
                ->withData(array_map('strval', $data))
                ->withAndroidConfig(
                    AndroidConfig::fromArray([
                        'priority' => 'high',
                        'notification' => [
                            'sound' => 'default',
                            'default_sound' => true,
                            'default_vibrate_timings' => true,
                        ],
                    ])
                );

            $messaging->send($message);
            return true;
        } catch (\Kreait\Firebase\Exception\Messaging\NotFound $e) {
            // Token no longer valid
            $user->update(['fcm_token' => null]);
            Log::info('FCM token cleared for user ' . $user->id . ' (not found)');
            return false;
        } catch (\Kreait\Firebase\Exception\Messaging\InvalidMessage $e) {
            $user->update(['fcm_token' => null]);
            Log::info('FCM token cleared for user ' . $user->id . ' (invalid)');
            return false;
        } catch (\Throwable $e) {
            Log::warning('FCM send failed for user ' . $user->id . ': ' . $e->getMessage());
            return false;
        }
    }

    public function notifyAdmins(string $title, string $body, array $data = []): int
    {
        $count = 0;
        User::where('role', 'admin')
            ->whereNotNull('fcm_token')
            ->get()
            ->each(function (User $u) use ($title, $body, $data, &$count) {
                if ($this->sendToUser($u, $title, $body, $data)) {
                    $count++;
                }
            });

        return $count;
    }
}
