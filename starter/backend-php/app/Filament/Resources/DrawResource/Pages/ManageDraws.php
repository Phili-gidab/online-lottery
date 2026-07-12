<?php

namespace App\Filament\Resources\DrawResource\Pages;

use App\Filament\Resources\DrawResource;
use Filament\Actions;
use Filament\Resources\Pages\ManageRecords;

class ManageDraws extends ManageRecords
{
    protected static string $resource = DrawResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
