<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DrawResource\Pages\ManageDraws;
use App\Models\Draw;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class DrawResource extends Resource
{
    protected static ?string $model = Draw::class;

    protected static ?string $navigationIcon = 'heroicon-o-gift';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Select::make('lottery_id')
                ->relationship('lottery', 'title')->required()->columnSpanFull(),
            Forms\Components\TextInput::make('draw_number')
                ->numeric()->minValue(1)->maxValue(5)->required(),
            Forms\Components\Select::make('category')
                ->options([
                    'house' => 'House',
                    'car' => 'Car',
                    'phone' => 'Phone',
                    'cash' => 'Cash',
                    'other' => 'Other',
                ])->required(),
            Forms\Components\TextInput::make('prize_name')->required()->columnSpanFull(),
            Forms\Components\FileUpload::make('prize_image_path')
                ->label('Prize image')
                ->disk('public')->directory('prizes')->visibility('public')
                ->image()->maxSize(5120)->columnSpanFull(),
            Forms\Components\DateTimePicker::make('draw_date'),
            Forms\Components\TextInput::make('title')->label('Custom title (optional)'),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('draw_number')
            ->columns([
                Tables\Columns\TextColumn::make('lottery.title')->limit(24),
                Tables\Columns\TextColumn::make('draw_number')->label('Nº')->sortable(),
                Tables\Columns\TextColumn::make('category')->badge(),
                Tables\Columns\TextColumn::make('prize_name')->limit(30),
                Tables\Columns\TextColumn::make('draw_date')->dateTime('d M Y')->sortable(),
                Tables\Columns\TextColumn::make('draw_status')
                    ->label('Status')->badge()
                    ->color(fn (string $state) => $state === 'drawn' ? 'success' : 'warning'),
                Tables\Columns\TextColumn::make('winner_ticket_number')->label('Winner Nº'),
                Tables\Columns\TextColumn::make('winner_display_name')->label('Winner'),
            ])
            ->actions([
                Tables\Actions\Action::make('execute')
                    ->label('Run draw')
                    ->icon('heroicon-o-sparkles')
                    ->color('success')
                    ->visible(fn (Draw $r) => $r->draw_status === 'scheduled')
                    ->requiresConfirmation()
                    ->modalHeading('Execute this draw?')
                    ->modalDescription('A winner is selected at random from all active tickets. This runs exactly once and the result is published immediately.')
                    ->action(function (Draw $r) {
                        try {
                            $result = $r->execute();
                            Notification::make()
                                ->title("Winner: Nº {$result['winnerTicketNumber']} — {$result['winnerDisplayName']}")
                                ->body("Selected from {$result['eligibleTickets']} eligible tickets.")
                                ->success()->persistent()->send();
                        } catch (\Throwable $e) {
                            Notification::make()
                                ->title('Draw not executed')
                                ->body($e->getMessage())
                                ->danger()->send();
                        }
                    }),
                Tables\Actions\EditAction::make()
                    ->visible(fn (Draw $r) => $r->draw_status === 'scheduled'),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ManageDraws::route('/'),
        ];
    }
}
