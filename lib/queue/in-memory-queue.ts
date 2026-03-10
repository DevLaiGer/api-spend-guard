import crypto from "node:crypto";
import type { QueueJob } from "@/lib/types";

const queue: QueueJob[] = [];

export function enqueueJob(job: Omit<QueueJob, "id">): QueueJob {
  const full: QueueJob = { ...job, id: crypto.randomUUID() };
  queue.push(full);
  return full;
}

export function dequeueReadyJob(type?: QueueJob["type"]): QueueJob | undefined {
  const now = new Date().toISOString();
  const index = queue.findIndex((job) => {
    if (type && job.type !== type) return false;
    return job.visibleAt <= now;
  });
  if (index === -1) return undefined;
  const [job] = queue.splice(index, 1);
  return job;
}

export function queueDepth() {
  return queue.length;
}
