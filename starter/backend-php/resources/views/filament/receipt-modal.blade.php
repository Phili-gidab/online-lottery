<div class="space-y-3">
    <img
        src="{{ route('admin.receipt', $ticket) }}"
        alt="Payment receipt"
        style="max-height: 70vh; margin-inline: auto; border-radius: 0.5rem;"
    />
    <p style="text-align:center; font-size: 0.875rem; opacity: 0.7;">
        Ref: {{ $ticket->payment_ref }} · {{ $ticket->first_name }} {{ $ticket->father_name }} · {{ $ticket->phone }}
    </p>
</div>
