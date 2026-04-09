export const PERMISSIONS = {};

export const RESULTS = {
  UNAVAILABLE: 'unavailable',
  DENIED: 'denied',
  LIMITED: 'limited',
  GRANTED: 'granted',
  BLOCKED: 'blocked',
};

export const check = () => Promise.resolve(RESULTS.GRANTED);
export const request = () => Promise.resolve(RESULTS.GRANTED);
export const checkMultiple = (perms) =>
  Promise.resolve(Object.fromEntries(perms.map(p => [p, RESULTS.GRANTED])));
export const requestMultiple = (perms) =>
  Promise.resolve(Object.fromEntries(perms.map(p => [p, RESULTS.GRANTED])));

export default { check, request, checkMultiple, requestMultiple, PERMISSIONS, RESULTS };
