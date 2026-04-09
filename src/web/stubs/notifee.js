export const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
  EPHEMERAL: 3,
};

export const AndroidImportance = {
  NONE: 0,
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
};

export const AndroidVisibility = {
  PRIVATE: 0,
  PUBLIC: 1,
  SECRET: -1,
};

export const EventType = {
  UNKNOWN: -1,
  DISMISSED: 0,
  PRESS: 1,
  ACTION_PRESS: 2,
  DELIVERED: 3,
};

const notifee = {
  requestPermission: () => Promise.resolve({ authorizationStatus: AuthorizationStatus.AUTHORIZED }),
  createChannel: () => Promise.resolve('default'),
  createChannelGroup: () => Promise.resolve('default'),
  displayNotification: () => Promise.resolve(),
  cancelNotification: () => Promise.resolve(),
  cancelAllNotifications: () => Promise.resolve(),
  setBadgeCount: () => Promise.resolve(),
  getBadgeCount: () => Promise.resolve(0),
  onForegroundEvent: () => () => {},
  onBackgroundEvent: () => {},
  getInitialNotification: () => Promise.resolve(null),
};

export default notifee;
