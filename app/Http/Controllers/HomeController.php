<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\Admin\TransactionLoanResource;
use App\Http\Resources\Admin\TransactionReturnBookResource;
use App\Models\Book;
use App\Models\Fine;
use App\Models\Loan;
use App\Models\Report;
use App\Models\ReturnBook;
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
        $loans = Loan::query()
            ->select(['id', 'loan_code', 'book_id', 'user_id', 'created_at'])
            // ->when(auth()->user()->hasAnyRole(['admin', 'operator']), function ($query) {
            //     return $query;
            // }, function ($query) {
            //     return $query->where('user_id', auth()->user()->id);
            // })
            ->latest('created_at')
            ->limit(5)
            ->with(['user', 'book'])
            ->get();
        $return_books = ReturnBook::query()
            ->select(['id', 'return_book_code', 'book_id', 'user_id', 'created_at'])
            // ->when(auth()->user()->hasAnyRole(['admin', 'operator']), function ($query) {
            //     return $query;
            // }, function ($query) {
            //     return $query->where('user_id', auth()->user()->id);
            // })
            ->latest('created_at')
            ->limit(5)
            ->with(['user', 'book'])
            ->get();

        return inertia('Home', [
            'page_settings' => [
                'title' => 'SiSUPIT DAMKAR',
                'subtitle' => 'SISTEM INFORMASI KESIAPSIAGAAN UNTUK PEMADAM KEBAKARAN TERINTEGRASI',
            ],
            'page_data' => [
                'transactionChart' => $this->chart(),
                'loans' => TransactionLoanResource::collection($loans),
                'return_books' => TransactionReturnBookResource::collection($return_books),
                'total_books' => Book::count(),
                'total_users' => User::count(),
                'total_loans' => Loan::query()
                    // ->when(auth()->user()->hasAnyRole(['admin', 'operator']), function ($query) {
                    //     return $query;
                    // }, function ($query) {
                    //     return $query->where('user_id', auth()->user()->id);
                    // })
                    ->count(),
                'total_returns' => ReturnBook::query()
                    // ->when(auth()->user()->hasAnyRole(['admin', 'operator']), function ($query) {
                    //     return $query;
                    // }, function ($query) {
                    //     return $query->where('user_id', auth()->user()->id);
                    // })
                    ->count(),
                'total_fines' =>  0,
            ],
        ]);
    }

    public function chart(): array
    {
        $end_date = Carbon::now();
        $start_date = $end_date->copy()->subMonth()->startOfMonth();
        $loans = Report::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as loan')
            // ->when(auth()->user()->hasAnyRole(['god']), function ($query) {
            //     return $query;
            // })
            ->whereBetween('created_at', [$start_date, $end_date])
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('loan', 'date');

        $return_books = Report::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as returns')
            ->where('status', 'TERKENDALI')
            ->whereNotNull('created_at')
            ->whereBetween('created_at', [$start_date, $end_date])
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('returns', 'date');
        $charts = [];
        $period = Carbon::parse($start_date)->daysUntil($end_date);
        foreach ($period as $date) {
            $date_string = $date->toDateString();
            $charts[] = [
                'date' => $date_string,
                'loan' => $loans->get($date_string, 0),
                'return_book' => $return_books->get($date_string, 0),
            ];
        }

        return $charts;
    }

    public function testnotif (){
        $user = User::all();
        $data = "Ini adalah contoh data";
        //dibawah ini merupakan
        //contoh mengirimkan notifikasi ke semua user
        Notification::send($user, new NewReportNotification($data));
        return response()->json([
            'message' => 'Notifikasi berhasil dikirim'
        ]);
    }
    public function kirimNotifikasi()
{
    // dump(config('webpush.vapid'));
    // $user = User::find(1); // ganti sesuai ID user yang akan dikirimi
    // $user->notify(new AlertNotification(
    //     '🚨 Kejadian Baru!',
    //     'Ada laporan kebakaran di daerah Anda',
    //     url('/laporan/123')
    // ));
    $user = User::find(1); // contoh user
    $user->notify(new WebPushNotification());

    return response()->json(['message' => 'Notifikasi dikirim']);
}

}
