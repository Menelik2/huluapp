<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AdminRoleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;

class AuthController extends Controller
{
    public function google(Request $request, AdminRoleService $adminRoles)
    {
        $data = $request->validate([
            'id_token' => 'required|string|max:4096',
        ]);

        $credentialsPath = config('services.firebase.credentials');
        if (!$credentialsPath || !is_readable($credentialsPath)) {
            return response()->json(['message' => 'Firebase credentials not configured on server.'], 500);
        }

        try {
            $factory = (new Factory)->withServiceAccount($credentialsPath);
            $auth = $factory->createAuth();
            $verified = $auth->verifyIdToken($data['id_token']);
            $claims = $verified->claims();
            $uid = $claims->get('sub');
            $firebaseUser = $auth->getUser($uid);
        } catch (\Throwable $e) {
            Log::info('Firebase token verification failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Invalid or expired Firebase ID token.'], 401);
        }

        // Prefer verified token claims for email; require verified email for admin
        $email = $firebaseUser->email
            ?? $claims->get('email')
            ?? null;

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['message' => 'Firebase account has no valid email.'], 422);
        }

        $emailVerified = (bool) (
            $firebaseUser->emailVerified
            ?? $claims->get('email_verified')
            ?? false
        );

        $wantsAdmin = $adminRoles->isAllowedAdminEmail($email);
        if ($wantsAdmin && !$emailVerified) {
            return response()->json([
                'message' => 'Admin accounts must use a verified email address.',
            ], 403);
        }

        // Ignore any client-supplied role field entirely
        if ($request->has('role') || $request->has('is_admin')) {
            Log::warning('Client attempted to supply role during auth', [
                'ip' => $request->ip(),
                'email' => $email,
            ]);
        }

        $user = DB::transaction(function () use ($firebaseUser, $email, $adminRoles) {
            $user = User::where('firebase_uid', $firebaseUser->uid)->lockForUpdate()->first();

            // Also lock by email to avoid duplicate accounts for same identity
            if (!$user) {
                $user = User::where('email', strtolower($email))->lockForUpdate()->first();
            }

            $role = $adminRoles->resolveRole($email, $user);
            $previousRole = $user?->role;

            $attributes = [
                'firebase_uid' => $firebaseUser->uid,
                'email' => strtolower($email),
                'name' => $firebaseUser->displayName ?: ($user->name ?? 'Kulu User'),
                'avatar' => $firebaseUser->photoUrl ?: ($user->avatar ?? null),
            ];

            if (!$user) {
                $user = new User($attributes);
                $user->forceFill(['role' => $role])->save();
            } else {
                $user->fill($attributes);
                $user->forceFill(['role' => $role])->save();
            }

            if ($previousRole && $previousRole !== $role) {
                Log::info('Auth role change', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'from' => $previousRole,
                    'to' => $role,
                ]);
            }

            return $user->fresh();
        });

        // Issue a fresh token; optionally prune old mobile tokens to reduce sprawl
        $user->tokens()->where('name', 'mobile')->where('created_at', '<', now()->subDays(45))->delete();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'role' => $user->role, // informational for UI only
                'firebase_uid' => $user->firebase_uid,
            ],
            'token' => $user->createToken('mobile')->plainTextToken,
        ]);
    }
}
