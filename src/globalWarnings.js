// Global warning state management
let globalWarnings = {};
let listeners = [];

export const updateGlobalWarning = (motorName, abnormalParams) => {
  if (abnormalParams.length > 0) {
    globalWarnings[motorName] = {
      parameters: abnormalParams,
      timestamp: Date.now(),
    };
  } else {
    delete globalWarnings[motorName];
  }

  // Notify all listeners
  listeners.forEach((listener) => listener(globalWarnings));
};

export const subscribeToWarnings = (callback) => {
  listeners.push(callback);
  // Immediately send current warnings
  callback(globalWarnings);

  // Return unsubscribe function
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
};

export const dismissWarning = (motorName) => {
  delete globalWarnings[motorName];
  listeners.forEach((listener) => listener(globalWarnings));
};

export const getGlobalWarnings = () => globalWarnings;
