
type QueueJob = () => Promise<void>;

const queue: QueueJob[] = [];
let processing = false;

export async function enqueue(job: QueueJob) {
  queue.push(job);
  process();
}

async function process() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const job = queue.shift();
    if (job) await job();
  }
  processing = false;
}
