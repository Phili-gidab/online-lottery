<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TicketResource\Pages\ManageTickets;
use App\Models\Ticket;
use App\Services\Sms;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class TicketResource extends Resource
{
    protected static ?string $model = Ticket::class;

    protected static ?string $navigationIcon = 'heroicon-o-ticket';

    protected static ?int $navigationSort = 1;

    public static function getNavigationBadge(): ?string
    {
        $pending = Ticket::where('ticket_status', 'pending')->count();

        return $pending > 0 ? (string) $pending : null;
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Select::make('lottery_id')
                ->relationship('lottery', 'title')
                ->required()
                ->columnSpanFull(),
            Forms\Components\TextInput::make('first_name')->required()->maxLength(80),
            Forms\Components\TextInput::make('father_name')->required()->maxLength(80),
            Forms\Components\TextInput::make('phone')->tel()->required()->maxLength(20),
            Forms\Components\TextInput::make('payment_ref')
                ->label('Payment reference')->required()->maxLength(64),
            Forms\Components\FileUpload::make('receipt_path')
                ->label('Receipt screenshot')
                ->disk('local')->directory('receipts')->visibility('private')
                ->image()->maxSize(5120)
                ->columnSpanFull(),
            Forms\Components\Select::make('ticket_status')
                ->options([
                    'pending' => 'Pending',
                    'active' => 'Active',
                    'rejected' => 'Rejected',
                ])
                ->default('pending')->required()
                ->helperText('Setting Active issues the ticket number automatically.'),
            Forms\Components\TextInput::make('ticket_number')
                ->helperText('Leave blank to auto-generate on activation. Exact digit length is validated.'),
            Forms\Components\Select::make('source')
                ->options(['web' => 'Web', 'admin' => 'Admin (WhatsApp)'])
                ->default('admin'),
            Forms\Components\Textarea::make('notes')->columnSpanFull(),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->headerActions([
                Tables\Actions\Action::make('export')
                    ->label('Export CSV')
                    ->icon('heroicon-o-arrow-down-tray')
                    ->url(fn () => route('admin.tickets.export'))
                    ->openUrlInNewTab(),
            ])
            ->columns([
                Tables\Columns\TextColumn::make('id')->sortable(),
                Tables\Columns\TextColumn::make('first_name')
                    ->formatStateUsing(fn (Ticket $r) => "{$r->first_name} {$r->father_name}")
                    ->label('Name')->searchable(['first_name', 'father_name']),
                Tables\Columns\TextColumn::make('phone')->searchable(),
                Tables\Columns\TextColumn::make('payment_ref')->label('Ref')->searchable()->limit(18),
                Tables\Columns\TextColumn::make('lottery.title')->limit(24),
                Tables\Columns\TextColumn::make('ticket_status')
                    ->label('Status')->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'active' => 'success',
                        'pending' => 'warning',
                        'rejected' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('ticket_number')
                    ->label('Nº')->searchable()->weight('bold'),
                Tables\Columns\TextColumn::make('created_at')->dateTime('d M H:i')->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('ticket_status')
                    ->options([
                        'pending' => 'Pending',
                        'active' => 'Active',
                        'rejected' => 'Rejected',
                    ]),
                Tables\Filters\SelectFilter::make('lottery_id')
                    ->relationship('lottery', 'title')->label('Lottery'),
            ])
            ->actions([
                Tables\Actions\Action::make('receipt')
                    ->label('Receipt')
                    ->icon('heroicon-o-photo')
                    ->visible(fn (Ticket $r) => filled($r->receipt_path))
                    ->modalHeading('Payment receipt')
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close')
                    ->modalContent(fn (Ticket $r) => view('filament.receipt-modal', ['ticket' => $r])),
                Tables\Actions\Action::make('approve')
                    ->label('Approve')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn (Ticket $r) => $r->ticket_status === 'pending')
                    ->requiresConfirmation()
                    ->modalDescription('Payment verified? The ticket number is generated automatically.')
                    ->action(function (Ticket $r) {
                        $r->ticket_status = 'active';
                        $r->save();
                        $sent = Sms::send(
                            $r->phone,
                            "Edil: payment verified! Your ticket number is {$r->ticket_number}. "
                            . 'It enters every draw of ' . ($r->lottery?->title ?? 'the lottery') . '. Good luck!'
                        );
                        Notification::make()
                            ->title("Ticket activated — Nº {$r->ticket_number}")
                            ->body($sent ? 'SMS notification sent.' : 'SMS not sent — notify the player manually.')
                            ->success()->send();
                    }),
                Tables\Actions\Action::make('reject')
                    ->label('Reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->visible(fn (Ticket $r) => $r->ticket_status === 'pending')
                    ->form([
                        Forms\Components\Textarea::make('reason')->label('Reason')->required(),
                    ])
                    ->action(function (Ticket $r, array $data) {
                        $r->ticket_status = 'rejected';
                        $r->notes = trim(($r->notes ? $r->notes . "\n" : '') . 'Rejected: ' . $data['reason']);
                        $r->save();
                        Notification::make()->title('Ticket rejected')->danger()->send();
                    }),
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ManageTickets::route('/'),
        ];
    }
}
