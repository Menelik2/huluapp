<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function storeFcm(Request $request)
    {
        $data = $request->validate([
            'fcm_token' => 'required|string|min:10|max:512',
        ]);

        $request->user()->update(['fcm_token' => $data['fcm_token']]);

        return response()->json(['message' => 'FCM token saved']);
    }
}
