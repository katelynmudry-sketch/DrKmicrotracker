// Master kill switch for the doctor/admin side of the app (patient list,
// review/annotation, rubric upload, doctor-role granting). Disabled by
// default — the doctor side stays fully in place in code, just unreachable,
// until DOCTOR_FEATURE_ENABLED=true is set in the deployment env (see
// docs/OWNER-TODO.md — that flip should wait for HIPAA compliance work).
export function isDoctorFeatureEnabledServer(): boolean {
  return process.env.DOCTOR_FEATURE_ENABLED === "true";
}
