<?php

namespace App\Notifications;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Application $application,
        public ?string $oldStatus = null,
        public ?string $notes = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $newStatus = $this->application->status;

        return (new MailMessage)
            ->subject('Your application status has been updated')
            ->greeting('Hello ' . ($notifiable->name ?? 'there') . '!')
            ->line(sprintf(
                'Your application for "%s" is now: %s',
                $this->application->jobListing?->title ?? 'a position',
                strtoupper($newStatus),
            ))
            ->when($this->notes, fn(MailMessage $mail) => $mail->line("Note from the employer: {$this->notes}"))
            ->action('View application', url("/ats/applications/{$this->application->id}"))
            ->line('Thanks for using our platform.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'application_id' => $this->application->id,
            'job_title'      => $this->application->jobListing?->title,
            'old_status'     => $this->oldStatus,
            'new_status'     => $this->application->status,
            'notes'          => $this->notes,
        ];
    }
}
