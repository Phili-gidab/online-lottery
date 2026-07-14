<?php

namespace App\Filament\Resources;

use App\Filament\Resources\LotteryResource\Pages\ManageLotteries;
use App\Models\Lottery;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class LotteryResource extends Resource
{
    protected static ?string $model = Lottery::class;

    protected static ?string $navigationIcon = 'heroicon-o-trophy';

    protected static ?string $pluralModelLabel = 'lotteries';

    protected static ?int $navigationSort = 0;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('title')->required()->columnSpanFull(),
            Forms\Components\TextInput::make('company')->required(),
            Forms\Components\Select::make('lottery_status')
                ->label('Status')
                ->options([
                    'draft' => 'Draft (hidden from the public)',
                    'open' => 'Open — selling tickets',
                    'closed' => 'Closed — sales stopped',
                    'completed' => 'Completed',
                ])->default('draft')->required(),
            Forms\Components\TextInput::make('ticket_price')->numeric()->suffix('ETB'),
            Forms\Components\TextInput::make('ticket_digits')
                ->numeric()->minValue(4)->maxValue(10)->default(6)->required()
                ->helperText('Exact length of generated ticket numbers.'),
            Forms\Components\TextInput::make('max_tickets')
                ->numeric()->minValue(1)
                ->helperText('Optional cap. Registration closes automatically once pending + active tickets reach this number.'),
            Forms\Components\Toggle::make('allow_multiple_wins')
                ->helperText('Off = a ticket that wins one draw is excluded from later draws.'),
            Forms\Components\Textarea::make('description')->columnSpanFull(),
            Forms\Components\Textarea::make('payment_instructions')
                ->helperText('Shown on the public entry page — bank account, Telebirr number, etc.')
                ->columnSpanFull(),
            Forms\Components\FileUpload::make('poster_path')
                ->label('Campaign poster')
                ->disk('public')->directory('posters')->visibility('public')
                ->image()->maxSize(8192)
                ->helperText('Portrait promo poster (JPG/PNG, max 8 MB) — shown on the homepage with share & download buttons.')
                ->columnSpanFull(),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('title')->searchable(),
                Tables\Columns\TextColumn::make('company'),
                Tables\Columns\TextColumn::make('lottery_status')
                    ->label('Status')->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'open' => 'success',
                        'draft' => 'gray',
                        'closed' => 'warning',
                        'completed' => 'info',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('ticket_price')->money('ETB'),
                Tables\Columns\TextColumn::make('draws_count')->counts('draws')->label('Draws'),
                Tables\Columns\TextColumn::make('tickets_count')->counts('tickets')->label('Tickets'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ManageLotteries::route('/'),
        ];
    }
}
