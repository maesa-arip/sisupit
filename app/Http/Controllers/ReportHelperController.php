<?php

namespace App\Http\Controllers;

use App\Enums\MessageType;
use App\Http\Requests\ReportHelperRequest;
use App\Models\ReportHelper;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReportHelperController extends Controller
{
    public function store(ReportHelperRequest $request): RedirectResponse
    {
        try {
            $exists = ReportHelper::where('report_id', $request->report_id)
            ->where('user_id', auth()->id())
            ->exists();
            // dd($exists);

        if ($exists) {
            flashMessage(MessageType::ERROR->message(error: 'Sudah menjadi relawan untuk kasus ini'), 'error');
            return to_route('dashboard'); // <-- tambahkan return di sini
        }
            $report = ReportHelper::create([
                'user_id' => auth()->user()->id,
                'location_lat' => $request->location_lat,
                'location_lng' => $request->location_lng,
                'report_id' => $request->report_id,
                'status' => 'waiting',
            ]);
            flashMessage(MessageType::CREATED->message('Bantuan'));
            return to_route('dashboard');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('dashboard');
        }
    }
}
