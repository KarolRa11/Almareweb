export function isAdminIdentity(email: string | null | undefined, role?: string | null) {
  if (role === "admin") return true;
  if (!email) return false;
  const allowedEmails = (process.env.ADMIN_EMAILS || "admin@almare.com")
    .split(",")
    .map((item) => item.trim().toLocaleLowerCase("es"))
    .filter(Boolean);
  return allowedEmails.includes(email.trim().toLocaleLowerCase("es"));
}

export function isCrmStaff(role?: string | null) {
  return ["administrador", "gerente", "vendedor", "soporte", "marketing", "lector"].includes(role || "");
}
