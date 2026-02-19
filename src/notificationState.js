// Global notification enable/disable state
let notificationEnabled = true;
let listeners = [];

export const setNotificationEnabled = (enabled) => {
  notificationEnabled = enabled;
  listeners.forEach((listener) => listener(notificationEnabled));
};

export const getNotificationEnabled = () => notificationEnabled;

export const subscribeToNotificationState = (callback) => {
  listeners.push(callback);
  callback(notificationEnabled);

  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
};
