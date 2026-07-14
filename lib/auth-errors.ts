export function getAuthErrorMessage(message: string) {
  const normalized = message.toLocaleLowerCase("en");
  if (normalized.includes("email rate limit")) {
    return "Supabase alcanzó temporalmente el límite de correos de confirmación. Espera unos minutos antes de volver a intentarlo o configura un servidor SMTP propio en Supabase.";
  }
  if (normalized.includes("user already registered") || normalized.includes("already been registered")) {
    return "Este correo ya está registrado. Inicia sesión o recupera tu contraseña.";
  }
  if (normalized.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (normalized.includes("password should be")) return "La contraseña debe tener al menos 8 caracteres.";
  if (normalized.includes("signup is disabled")) return "El registro de nuevas cuentas está deshabilitado temporalmente.";
  if (normalized.includes("email not confirmed")) return "Confirma tu correo electrónico antes de iniciar sesión.";
  return "No fue posible completar la operación. Verifica los datos e inténtalo nuevamente.";
}
