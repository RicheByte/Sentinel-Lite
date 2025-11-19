import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook for managing browser notifications and audio alerts
 * Supports desktop push notifications and severity-based sound effects
 */
export const useNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Auto-request permission if not yet determined
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          setPermission(perm);
        });
      }
    }
  }, []);

  /**
   * Play alert sound based on severity
   * @param {string} severity - Alert severity level (critical, high, medium, low)
   */
  const playSound = useCallback((severity) => {
    if (!soundEnabled) return;

    try {
      const soundMap = {
        critical: '/sounds/critical.mp3',
        high: '/sounds/high.mp3',
        medium: '/sounds/medium.mp3',
        low: '/sounds/low.mp3'
      };

      const soundFile = soundMap[severity?.toLowerCase()] || soundMap.medium;
      const audio = new Audio(soundFile);
      audio.volume = 0.7;
      audio.play().catch(err => console.log('Audio playback failed:', err));
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [soundEnabled]);

  /**
   * Send a desktop notification
   * @param {string} title - Notification title
   * @param {string} body - Notification body/message
   * @param {string} severity - Alert severity for icon and persistence
   * @param {function} onClick - Optional callback when notification is clicked
   */
  const sendNotification = useCallback((title, body, severity = 'medium', onClick = null) => {
    // Play sound first
    playSound(severity);

    // Check if notifications are supported and permitted
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.log('Notifications not available or not permitted');
      return;
    }

    try {
      const iconMap = {
        critical: '/icons/critical.png',
        high: '/icons/high.png',
        medium: '/icons/medium.png',
        low: '/icons/low.png'
      };

      const notification = new Notification(title, {
        body,
        icon: iconMap[severity?.toLowerCase()] || '/icons/sentinel.png',
        badge: '/icons/badge.png',
        tag: `sentinel-alert-${severity}`,
        requireInteraction: severity === 'critical', // Critical alerts stay until clicked
        vibrate: severity === 'critical' ? [200, 100, 200] : [100],
        silent: false,
        timestamp: Date.now()
      });

      // Handle notification click
      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }

      // Auto-close non-critical notifications after 8 seconds
      if (severity !== 'critical') {
        setTimeout(() => notification.close(), 8000);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [playSound]);

  /**
   * Request notification permission if not already granted
   */
  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm;
    }
    return permission;
  };

  /**
   * Toggle sound alerts on/off
   */
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  return {
    permission,
    soundEnabled,
    sendNotification,
    requestPermission,
    toggleSound,
    playSound
  };
};

export default useNotifications;
