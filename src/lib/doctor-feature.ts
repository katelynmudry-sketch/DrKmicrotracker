// Client-side twin of doctor-feature.server.ts's flag — see that file for
// why this exists. Both must be set to "true" together to re-enable the
// doctor side; this one alone only controls what the UI shows.
export const isDoctorFeatureEnabled = import.meta.env.VITE_DOCTOR_FEATURE_ENABLED === "true";
