<?php
namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Roles: user (customer) | admin (store owner — manages everything, is the seller).
 * There is no separate seller role.
 */
class AdminRoleService
{
    public function allowedEmails(): array
    {
        $emails = [];

        $single = config('services.kulu.admin_email');
        if (is_string($single) && trim($single) !== '') {
            $emails[] = $single;
        }

        $many = config('services.kulu.admin_emails');
        if (is_string($many) && trim($many) !== '') {
            foreach (explode(',', $many) as $part) {
                $emails[] = $part;
            }
        } elseif (is_array($many)) {
            $emails = array_merge($emails, $many);
        }

        $normalized = [];
        foreach ($emails as $email) {
            $email = strtolower(trim((string) $email));
            if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $normalized[$email] = true;
            }
        }

        return array_keys($normalized);
    }

    public function isAllowedAdminEmail(?string $email): bool
    {
        if (!$email) {
            return false;
        }
        return in_array(strtolower(trim($email)), $this->allowedEmails(), true);
    }

    /**
     * Only two roles: admin (allow-listed email) or user (everyone else).
     * Legacy "seller" rows are treated as user.
     */
    public function resolveRole(?string $email, ?User $existing = null): string
    {
        if ($this->isAllowedAdminEmail($email)) {
            return User::ROLE_ADMIN;
        }

        return User::ROLE_USER;
    }

    public function canAccessAdmin(User $user): bool
    {
        if ($user->role !== User::ROLE_ADMIN) {
            return false;
        }

        if (!$this->isAllowedAdminEmail($user->email)) {
            Log::warning('Admin access blocked: email not on allow-list', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);
            return false;
        }

        return true;
    }

    public function reconcileStoredRole(User $user): User
    {
        $expected = $this->resolveRole($user->email, $user);

        // Also collapse legacy seller → user
        if ($user->role === 'seller') {
            $expected = $this->isAllowedAdminEmail($user->email)
                ? User::ROLE_ADMIN
                : User::ROLE_USER;
        }

        if ($user->role !== $expected) {
            $previous = $user->role;
            $user->forceFill(['role' => $expected])->save();
            Log::info('User role reconciled', [
                'user_id' => $user->id,
                'email' => $user->email,
                'from' => $previous,
                'to' => $expected,
            ]);
            $user->refresh();
        }

        return $user;
    }
}
