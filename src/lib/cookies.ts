// src/lib/cookies.ts
'use client'; // Cookies are a client-side concept for direct manipulation

export function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  // Ensure SameSite=Lax is set for better security defaults
  document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax";
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  // Set Max-Age to a past date to delete the cookie
  document.cookie = name + '=; Max-Age=-99999999; path=/; SameSite=Lax';
}
