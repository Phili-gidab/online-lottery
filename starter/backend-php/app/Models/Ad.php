<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Ad extends Model
{
    protected $fillable = ['sponsor_name', 'image_path', 'link_url', 'active', 'sort_order'];

    protected $casts = [
        'active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'documentId' => (string) $this->id,
            'sponsorName' => $this->sponsor_name,
            'linkUrl' => $this->link_url,
            'image' => $this->image_path
                ? ['url' => Storage::disk('public')->url($this->image_path)]
                : null,
        ];
    }
}
