// Service Worker for Push Notifications
// Version: 1.6

self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);
  
  // Check if event.data exists
  if (!event.data) {
    console.log('No data in push event');
    return;
  }
  
  const data = event.data.json();
  console.log('Push data:', data);
  
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/',
      noticeId: data.noticeId,
      eventId: data.eventId,
      tag: data.tag
    },
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification',
    requireInteraction: false
  };
  
  console.log('Notification options:', options);
  
  // Send message to client to refresh data
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function(clients) {
      if (clients && clients.length) {
        console.log('Sending message to', clients.length, 'clients');
        // Send message to all clients
        clients.forEach(function(client) {
          console.log('Sending message to client:', client.url);
          client.postMessage(JSON.stringify(data)).then(function() {
            console.log('Message sent successfully to client');
          }).catch(function(error) {
            console.error('Error sending message to client:', error);
          });
        });
      } else {
        console.log('No clients found to send message to');
      }
    }).catch(function(error) {
      console.error('Error getting clients:', error);
    })
  );
  
  // Show notification
  console.log('Attempting to show notification with title:', title);
  event.waitUntil(
    self.registration.showNotification(title, options).then(function() {
      console.log('Notification shown successfully');
    }).catch(function(error) {
      console.error('Error showing notification:', error);
      // Try to show a simpler notification
      return self.registration.showNotification('New Notification', {
        body: 'You have a new notification',
        icon: '/favicon.ico'
      }).then(function() {
        console.log('Fallback notification shown successfully');
      }).catch(function(fallbackError) {
        console.error('Error showing fallback notification:', fallbackError);
      });
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  console.log('Opening URL:', urlToOpen);
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        console.log('Found', clientList.length, 'clients');
        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          console.log('Checking client:', client.url);
          if (client.url === urlToOpen && 'focus' in client) {
            console.log('Focusing existing client');
            return client.focus();
          }
        }
        // If not, open a new window/tab
        console.log('Opening new window for:', urlToOpen);
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }).catch(function(error) {
        console.error('Error handling notification click:', error);
        // Fallback: try to open in a new window
        if (event.notification.data && event.notification.data.url) {
          window.open(event.notification.data.url, '_blank');
        }
      })
  );
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');
  // Claim all clients to ensure the service worker controls them
  event.waitUntil(
    self.clients.claim().then(function() {
      console.log('Service Worker claimed all clients');
    }).catch(function(error) {
      console.error('Error claiming clients:', error);
    })
  );
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
  self.skipWaiting();
});
