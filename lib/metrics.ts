const counters = {
  anonymousBlocks: 0,
  planGateDenials: 0
};

export function incrementAnonymousBlocks() {
  counters.anonymousBlocks += 1;
}

export function incrementPlanGateDenials() {
  counters.planGateDenials += 1;
}

export function getRuntimeCounters() {
  return { ...counters };
}
