<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AdResource\Pages\ManageAds;
use App\Models\Ad;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class AdResource extends Resource
{
    protected static ?string $model = Ad::class;

    protected static ?string $navigationIcon = 'heroicon-o-megaphone';

    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('sponsor_name'),
            Forms\Components\TextInput::make('link_url')->url(),
            Forms\Components\FileUpload::make('image_path')
                ->label('Banner image')
                ->disk('public')->directory('ads')->visibility('public')
                ->image()->maxSize(5120)->required()->columnSpanFull(),
            Forms\Components\Toggle::make('active')->default(true),
            Forms\Components\TextInput::make('sort_order')->numeric()->default(0),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('sort_order')
            ->columns([
                Tables\Columns\ImageColumn::make('image_path')->disk('public')->label('Banner'),
                Tables\Columns\TextColumn::make('sponsor_name')->searchable(),
                Tables\Columns\TextColumn::make('link_url')->limit(30),
                Tables\Columns\IconColumn::make('active')->boolean(),
                Tables\Columns\TextColumn::make('sort_order'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ManageAds::route('/'),
        ];
    }
}
