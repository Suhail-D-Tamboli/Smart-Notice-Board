// Push Notification Service

const PUBLIC_VAPID_KEY_URL = '/api/vapid-public-key';

// Convert base64 string to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Register Service Worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      console.log('PushService: Registering service worker');
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      console.log('PushService: Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('PushService: Service Worker registration failed:', error);
      return null;
    }
  }
  console.log('PushService: Service Worker not supported');
  return null;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  try {
    console.log('PushService: Subscribing to push notifications for user:', userId);
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Service Worker registration failed');
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('PushService: Notification permission denied');
      return false;
    }

    // Get VAPID public key from server
    console.log('PushService: Getting VAPID public key');
    const response = await fetch(PUBLIC_VAPID_KEY_URL);
    const { publicKey } = await response.json();
    console.log('PushService: Got VAPID public key:', publicKey);

    // Subscribe to push notifications
    console.log('PushService: Creating push subscription');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
    });

    console.log('PushService: Push subscription created:', subscription);

    // Send subscription to server
    console.log('PushService: Sending subscription to server');
    const subscribeResponse = await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription,
        userId
      })
    });

    const result = await subscribeResponse.json();
    console.log('PushService: Subscription saved:', result);

    return result.success;
  } catch (error) {
    console.error('PushService: Error subscribing to push notifications:', error);
    return false;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Remove subscription from server
      await fetch('/api/push-unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      console.log('Unsubscribed from push notifications');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

// Check if user is subscribed
export async function isSubscribedToPush(): Promise<boolean> {
  try {
    console.log('PushService: Checking if user is subscribed to push');
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.log('PushService: Service Worker not supported');
      return false;
    }

    // Check if there's a registration
    const registration = await navigator.serviceWorker.getRegistration();
    console.log('PushService: Service worker registration:', registration);
    if (!registration) {
      console.log('PushService: No service worker registration found');
      return false;
    }

    // Check for existing subscription
    const subscription = await registration.pushManager.getSubscription();
    console.log('PushService: Push subscription:', subscription);
    return subscription !== null;
  } catch (error) {
    console.error('PushService: Error checking push subscription:', error);
    return false;
  }
}
