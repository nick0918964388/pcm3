import { announcementRepository } from '@/repositories/announcementRepository';

class ScheduledPublisher {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(intervalMinutes: number = 5) {
    if (this.isRunning) {
      console.log('Scheduled publisher is already running');
      return;
    }

    console.log(`Starting scheduled publisher with ${intervalMinutes} minute intervals`);
    this.isRunning = true;

    // Run immediately
    this.publishScheduledAnnouncements();

    // Set up recurring interval
    this.intervalId = setInterval(() => {
      this.publishScheduledAnnouncements();
    }, intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Scheduled publisher stopped');
  }

  async publishScheduledAnnouncements(): Promise<number> {
    try {
      console.log('Checking for scheduled announcements to publish...');
      
      const scheduledAnnouncements = await announcementRepository.getScheduledAnnouncements();
      
      if (scheduledAnnouncements.length === 0) {
        console.log('No scheduled announcements ready for publishing');
        return 0;
      }

      console.log(`Found ${scheduledAnnouncements.length} announcements ready for publishing`);
      let publishedCount = 0;

      for (const announcement of scheduledAnnouncements) {
        try {
          const success = await announcementRepository.publishScheduledAnnouncement(announcement.id);
          
          if (success) {
            publishedCount++;
            console.log(`Successfully published announcement: ${announcement.title} (ID: ${announcement.id})`);
            
            // Here you could add webhook or notification logic
            await this.notifyAnnouncementPublished(announcement);
          } else {
            console.error(`Failed to publish announcement: ${announcement.title} (ID: ${announcement.id})`);
          }
        } catch (error) {
          console.error(`Error publishing announcement ${announcement.id}:`, error);
        }
      }

      if (publishedCount > 0) {
        console.log(`Successfully published ${publishedCount} scheduled announcements`);
      }

      return publishedCount;
    } catch (error) {
      console.error('Error in scheduled announcement publisher:', error);
      return 0;
    }
  }

  private async notifyAnnouncementPublished(announcement: any): Promise<void> {
    try {
      // Here you could implement:
      // - WebSocket notifications to connected dashboard users
      // - Email notifications
      // - Push notifications
      // - Webhook calls to external systems
      
      console.log(`Notification logic would run here for announcement: ${announcement.title}`);
      
      // Example WebSocket notification (if you have WebSocket setup)
      // if (global.wsServer) {
      //   global.wsServer.broadcast({
      //     type: 'announcement-published',
      //     data: announcement
      //   });
      // }
    } catch (error) {
      console.error('Error sending notification for published announcement:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.intervalId !== null,
    };
  }
}

// Create singleton instance
export const scheduledPublisher = new ScheduledPublisher();

// Auto-start in production (you might want to control this via environment variable)
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SCHEDULED_PUBLISHING === 'true') {
  scheduledPublisher.start();
}