import { storageService } from './storageService';
import { Task } from '../types';

export const notificationService = {
  /**
   * Checks if the Notification API is supported by the browser.
   */
  isSupported: (): boolean => {
    return 'Notification' in window;
  },

  /**
   * Requests permission from the user to show notifications.
   * This should be called as a result of a user action (e.g., a button click).
   * @returns A promise that resolves to the permission status ('granted', 'denied', or 'default').
   */
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!notificationService.isSupported()) {
      console.warn('Notifications not supported by this browser.');
      return 'denied';
    }
    const permission = await Notification.requestPermission();
    storageService.write('notification_permission', permission);
    return permission;
  },

  /**
   * Gets the current notification permission status from storage or the browser.
   */
  getPermissionStatus: (): NotificationPermission | 'not_set' => {
    if (!notificationService.isSupported()) return 'denied';
    
    // Check our saved setting first
    const savedPermission = storageService.read<NotificationPermission | null>('notification_permission', null);
    if (savedPermission) return savedPermission;

    // Otherwise, use the browser's current permission state
    return Notification.permission === 'default' ? 'not_set' : Notification.permission;
  },

  /**
   * Shows a local notification to the user.
   * @param title The title of the notification.
   * @param options Standard Notification API options (body, icon, etc.).
   */
  showNotification: (title: string, options?: NotificationOptions): void => {
    const permission = notificationService.getPermissionStatus();
    if (permission !== 'granted') {
      console.log('Notification permission not granted.');
      return;
    }

    // Use the service worker to show the notification for reliability
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        icon: 'https://cdn-icons-png.flaticon.com/512/9662/9662656.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/9662/9662656.png',
        ...options,
      });
    });
  },

  /**
   * Schedules all necessary reminders for tasks and daily logging.
   */
  scheduleReminders: (): void => {
    const permission = notificationService.getPermissionStatus();
    if (permission !== 'granted') return;

    console.log('Scheduling daily and task-based reminders...');
    
    // 1. Schedule a generic reminder to log activity in the evening
    const now = new Date();
    const eveningReminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0); // 8:00 PM today

    if (now < eveningReminderTime) {
      const delay = eveningReminderTime.getTime() - now.getTime();
      setTimeout(() => {
        notificationService.showNotification('Evening Check-in', {
          body: "How was your day? Don't forget to log your activities and plan for tomorrow!",
          tag: 'evening-reminder'
        });
      }, delay);
    }
    
    // 2. Schedule reminders for tasks with due dates
    const tasks = storageService.read<Task[]>('tasks', []);
    const activeTasksWithDueDate = tasks.filter(t => !t.completed && t.dueDate);

    activeTasksWithDueDate.forEach(task => {
      const dueDate = new Date(task.dueDate as string);
      // Set reminder for 9am on the due date. Note: Timezone of server/client matters.
      const reminderTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 9, 0, 0);
      
      if (now < reminderTime) {
        const delay = reminderTime.getTime() - now.getTime();
        setTimeout(() => {
          notificationService.showNotification(`Task Due Today: ${task.title}`, {
            body: `Just a reminder that this task is due today. You can do it!`,
            tag: `task-${task.id}` // Use task ID as tag to prevent duplicates
          });
        }, delay);
      }
    });
  }
};
