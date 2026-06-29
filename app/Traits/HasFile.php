<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

trait HasFile
{
    public function upload_file(Request $request, string $column, string $folder): ?string
    {
        return $request->hasFile($column) ? $request->file($column)->store($folder, 'public') : null;
    }

    public function update_file(Request $request, Model $model, string $column, string $folder): ?string
    {
        if ($request->hasFile($column)) {
            // Hapus file lama dari disk 'public'
            if ($model->$column) {
                Storage::disk('public')->delete($model->$column);
            }
            // Simpan file baru ke disk 'public'
            $thumbnail = $request->file($column)->store($folder, 'public');
        } else {
            $thumbnail = $model->$column;
        }

        return $thumbnail;

        // if ($request->hasFile($column)) {
        //     if ($model->$column) {
        //         Storage::delete($model->$column);
        //     }
        //     $thumbnail = $request->file($column)->store($folder);
        // } else {
        //     $thumbnail = $model->$column;
        // }

        // return $thumbnail;
    }

    public function delete_file(Model $model, string $column): void
    {
        if ($model->$column) {
            Storage::delete($model->$column);
        }
    }
}
