<?php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    /** Customer */
    public const ROLE_USER = 'user';
    /** Store owner — manages catalog, orders, inventory, chat (the seller) */
    public const ROLE_ADMIN = 'admin';

    public const ROLES = [
        self::ROLE_USER,
        self::ROLE_ADMIN,
    ];

    /** role is NOT fillable — set only via forceFill in trusted server code */
    protected $fillable = [
        'firebase_uid',
        'name',
        'email',
        'avatar',
        'fcm_token',
    ];

    protected $hidden = [
        'remember_token',
        'fcm_token',
    ];

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isCustomer(): bool
    {
        return $this->role === self::ROLE_USER;
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'seller_id');
    }
}
