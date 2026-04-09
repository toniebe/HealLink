import React from 'react';

export const StreamVideo = ({ children }) => children;
export const StreamCall = ({ children }) => children;
export const useStreamVideoClient = () => null;
export const useCallStateHooks = () => ({});
export const useCameraState = () => ({ camera: null, isMute: true });
export const useMicrophoneState = () => ({ microphone: null, isMute: true });
export const useCall = () => null;
export const StreamVideoClient = class {
  constructor() {}
  connectUser() { return Promise.resolve(); }
  disconnectUser() { return Promise.resolve(); }
  call() { return null; }
};

export default {};
