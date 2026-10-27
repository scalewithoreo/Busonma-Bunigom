// Admin Security & PIN Management for Miracle & Marvin's Wedding

export type AdminRole = 'miracle' | 'marvin' | 'groomsfamily' | 'bridesfamily' | 'custom1964';

export interface AdminRoleConfig {
  role: AdminRole;
  label: string;
  defaultPin: string;
  isMaster: boolean;
}

export const PIN_SALT = 'MiracleMarvin_Wedding_2027_Salt_';

// Master recovery PIN that always grants Master Admin access (Miracle & Marvin)
export const MASTER_EMERGENCY_PIN = '0000';

export const INITIAL_ADMIN_ROLES: AdminRoleConfig[] = [
  { role: 'miracle', label: 'Miracle (Master Admin)', defaultPin: '1111', isMaster: true },
  { role: 'marvin', label: 'Marvin (Master Admin)', defaultPin: '2222', isMaster: true },
  { role: 'groomsfamily', label: "Groom's Family", defaultPin: '3333', isMaster: false },
  { role: 'bridesfamily', label: "Bride's Family", defaultPin: '4444', isMaster: false },
  { role: 'custom1964', label: 'Event Coordinator', defaultPin: '1964', isMaster: false },
];

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(PIN_SALT + pin.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get the current active PIN for a role (custom stored PIN or default)
export function getStoredPin(role: AdminRole): string {
  const stored = localStorage.getItem(`custom_pin_${role}`);
  if (stored && stored.length === 4) return stored;
  const found = INITIAL_ADMIN_ROLES.find(r => r.role === role);
  return found ? found.defaultPin : '1111';
}

// Change PIN for a role
export function saveCustomPin(role: AdminRole, newPin: string): boolean {
  if (!/^\d{4}$/.test(newPin)) return false;
  localStorage.setItem(`custom_pin_${role}`, newPin);
  return true;
}

// Reset PIN for a role back to default
export function resetRolePinToDefault(role: AdminRole): void {
  localStorage.removeItem(`custom_pin_${role}`);
}

// Verify entered 4-digit PIN against all active roles
export function verifyEnteredPin(enteredPin: string): { success: boolean; role?: AdminRole; label?: string } {
  const pin = enteredPin.trim();
  
  // Emergency master override
  if (pin === MASTER_EMERGENCY_PIN) {
    return { success: true, role: 'miracle', label: 'Miracle (Master Admin - Override)' };
  }

  for (const roleConfig of INITIAL_ADMIN_ROLES) {
    const activePin = getStoredPin(roleConfig.role);
    if (pin === activePin) {
      return { success: true, role: roleConfig.role, label: roleConfig.label };
    }
  }

  return { success: false };
}
