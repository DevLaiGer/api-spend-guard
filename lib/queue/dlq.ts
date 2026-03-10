import type { QueueJob } from "@/lib/types";

const deadLetterQueue: QueueJob[] = [];

export function pushDlq(job: QueueJob) {
  deadLetterQueue.push(job);
}

export function listDlq() {
  return deadLetterQueue;
}

export function popDlq(jobId: string) {
  const index = deadLetterQueue.findIndex((job) => job.id === jobId);
  if (index === -1) return null;
  const [job] = deadLetterQueue.splice(index, 1);
  return job;
}
