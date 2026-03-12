export type PlanEntitlements = {
  code: string;
  maxProviderAccounts: number;
  smsEnabled: boolean;
  telegramEnabled: boolean;
  discordEnabled: boolean;
};

export function maxKeysAllowed(plan: PlanEntitlements) {
  return plan.maxProviderAccounts;
}

export function canAddProviderKey(plan: PlanEntitlements, existingCount: number) {
  return existingCount < maxKeysAllowed(plan);
}

export function canUseSms(plan: PlanEntitlements) {
  return plan.smsEnabled;
}

export function canUseTelegram(plan: PlanEntitlements) {
  return plan.telegramEnabled;
}

export function canUseDiscord(plan: PlanEntitlements) {
  return plan.discordEnabled;
}
