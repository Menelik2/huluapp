<?php
namespace App\Http\Middleware;

use App\Services\AdminRoleService;
use Closure;
use Illuminate\Http\Request;

/**
 * Authoritative admin gate.
 * Client-provided role is never consulted — only DB role + email allow-list.
 */
class AdminMiddleware
{
    public function __construct(private AdminRoleService $adminRoles)
    {
    }

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Reconcile role against allow-list (demote stale admins)
        $user = $this->adminRoles->reconcileStoredRole($user);
        // Keep request user in sync after possible demotion
        $request->setUserResolver(fn () => $user);

        if (!$this->adminRoles->canAccessAdmin($user)) {
            return response()->json([
                'message' => 'Admin access required.',
            ], 403);
        }

        return $next($request);
    }
}
