<?php

namespace App\Filament\Resources\LotteryResource\Pages;

use App\Filament\Resources\LotteryResource;
use Filament\Actions;
use Filament\Resources\Pages\ManageRecords;

class ManageLotteries extends ManageRecords
{
    protected static string $resource = LotteryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()->label('New lottery'),
        ];
    }
}
