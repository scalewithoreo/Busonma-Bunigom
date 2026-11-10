// Admin Security & PIN Management for Wedding Core Engine
import { AdminRoleConfig } from '../types/wedding';

export type { AdminRoleConfig };
export type AdminRole = string;

export const PIN_SALT = 'Wedding_Core_Salt_2026_';

// Master recovery PIN that always grants Master Admin access
export const MASTER_EMERGENCY_PIN = '0000';

export const INITIAL_ADMIN_ROLES: AdminRoleConfig[] = [
  { role: 'miracle', label: 'Miracle (Master Admin)', defaultPin: '1111', isMaster: true, relationFilter: 'miracle' },
  { role: 'malvin', label: 'Malvin (Master Admin)', defaultPin: '2222', isMaster: true, relationFilter: 'malvin' },
  { role: 'busonma', label: 'Chimbusonma (Bride & Master Admin)', defaultPin: '2703', isMaster: true, relationFilter: 'busonma' },
  { role: 'bunigom', label: 'Chukwuebunigom (Groom & Master Admin)', defaultPin: '2703', isMaster: true, relationFilter: 'bunigom' },
  { role: 'mummy_bride', label: 'Mummy of Bride (Mother of Bride)', defaultPin: '2703', isMaster: false, relationFilter: 'Mummy of Bride' },
  { role: 'mama_groom', label: 'Mama of groom (Mother of Groom)', defaultPin: '2703', isMaster: false, relationFilter: 'Mama of groom' },
  { role: 'dulcet', label: 'Dulcet (Wedding Planner / Coordinator)', defaultPin: '2703', isMaster: false, relationFilter: 'dulcet' },
  { role: 'groomsfamily', label: "Groom's Family", defaultPin: '3333', isMaster: false, relationFilter: "Groom's Family" },
  { role: 'bridesfamily', label: "Bride's Family", defaultPin: '4444', isMaster: false, relationFilter: "Bride's Family" },
];

export async function hashPin(pin: string, salt: string = PIN_SALT): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + pin.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get the current active PIN for a role (custom stored PIN or default)
export function getStoredPin(role: AdminRole, defaultPin?: string): string {
  const stored = localStorage.getItem(`custom_pin_${role}`);
  if (stored && stored.length === 4) return stored;
  if (defaultPin) return defaultPin;
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

// Verify entered 4-digit PIN against active roles
export function verifyEnteredPin(
  enteredPin: string,
  roles: AdminRoleConfig[] = INITIAL_ADMIN_ROLES,
  emergencyPin: string = MASTER_EMERGENCY_PIN,
  targetRole?: string
): { success: boolean; role?: AdminRole; label?: string } {
  const pin = enteredPin.trim();
  
  // Emergency master override
  if (pin === emergencyPin) {
    const firstMaster = roles.find(r => r.isMaster) || roles[0];
    return { success: true, role: firstMaster.role, label: `${firstMaster.label} (Emergency Override)` };
  }

  // If a specific target role is selected to log into:
  if (targetRole && targetRole !== 'auto') {
    const targetConfig = roles.find(r => r.role === targetRole);
    if (targetConfig) {
      const activePin = getStoredPin(targetConfig.role, targetConfig.defaultPin);
      if (pin === activePin) {
        return { success: true, role: targetConfig.role, label: targetConfig.label };
      }
      return { success: false };
    }
  }

  for (const roleConfig of roles) {
    const activePin = getStoredPin(roleConfig.role, roleConfig.defaultPin);
    if (pin === activePin) {
      return { success: true, role: roleConfig.role, label: roleConfig.label };
    }
  }

  return { success: false };
}
