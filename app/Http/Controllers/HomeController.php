<?php

namespace App\Http\Controllers;
use App\Models\Report;
use App\Models\User;
use App\Notifications\AlertNotification;
use App\Notifications\NewReportNotification;
use App\Notifications\WebPushNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Notification;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        return inertia('Home', [
            'page_settings' => [
                'title' => 'SiSUPIT DAMKAR',
                'subtitle' => 'SISTEM INFORMASI KESIAPSIAGAAN UNTUK PEMADAM KEBAKARAN TERINTEGRASI',
            ],
            'page_data' => [
                'reportChart' => $this->chart(),
                'total_reports' => Report::count(),
                'total_handled_reports' => Report::where('status', 'TERKENDALI')->count(),
                'total_users' => User::role(['petugas', 'relawan'])->count(),
            ],
        ]);
    }

    public function chart(): array
    {
        $end_date = Carbon::now();
        $start_date = $end_date->copy()->subMonth()->startOfMonth();
        $reports = Report::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as total')
            // ->when(auth()->user()->hasAnyRole(['god']), function ($query) {
            //     return $query;
            // })
            ->whereBetween('created_at', [$start_date, $end_date])
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('total', 'date');

        $handled_reports = Report::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as total')
            ->where('status', 'TERKENDALI')
            ->whereNotNull('created_at')
            ->whereBetween('created_at', [$start_date, $end_date])
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('total', 'date');
        $charts = [];
        $period = Carbon::parse($start_date)->daysUntil($end_date);
        foreach ($period as $date) {
            $date_string = $date->toDateString();
            $charts[] = [
                'date' => $date_string,
                'reports' => $reports->get($date_string, 0),
                'handled_reports' => $handled_reports->get($date_string, 0),
            ];
        }

        return $charts;
    }
}
