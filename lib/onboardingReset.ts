// Shared ref so any screen can trigger the onboarding overlay immediately.
// _layout.tsx assigns the real function; settings.tsx calls it.
export const onboardingResetRef = { reset: () => {} };
