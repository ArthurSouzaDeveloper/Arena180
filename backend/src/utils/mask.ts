/** Mascara um e-mail para uso seguro em logs (ex: "fu***@dominio.com"). */
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.slice(0, 2)}***@${domain}`;
}
