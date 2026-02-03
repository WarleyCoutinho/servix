import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
  barbershop: ["create", "read", "update", "delete"],
  professional: ["create", "read", "update", "delete", "block"],
  booking: ["create", "read", "update", "cancel"],
  service: ["create", "read", "update", "delete"],
  schedule: ["read", "update"],
  subscription: ["read", "manage"],
} as const;

export const ac = createAccessControl(statement);

export const ownerRole = ac.newRole({
  barbershop: ["read", "update"],
  professional: ["create", "read", "update", "delete", "block"],
  booking: ["read"],
  service: ["create", "read", "update", "delete"],
  schedule: ["read"],
  subscription: ["read", "manage"],
});

export const professionalRole = ac.newRole({
  barbershop: ["read"],
  professional: ["read"],
  booking: ["read", "update"],
  service: ["read"],
  schedule: ["read", "update"],
});

export const clientRole = ac.newRole({
  barbershop: ["read"],
  professional: ["read"],
  booking: ["create", "read", "cancel"],
  service: ["read"],
  schedule: ["read"],
});
