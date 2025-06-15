
import express from "express";
import bodyParser from "body-parser";
import {
  syncRisksAndEnqueueJobs,
  getJob,
  getAllJobs,
  approveJob,
} from "./orchestration-service";
import { getAuditLog } from "./audit-log";

const app = express();
app.use(bodyParser.json());

/** GET /jobs - list all jobs */
app.get("/jobs", async (req, res) => {
  const jobs = getAllJobs();
  res.json(jobs);
});

/** POST /sync - fetch from Risk Assessment API and enqueue jobs */
app.post("/sync", async (req, res) => {
  const jobs = await syncRisksAndEnqueueJobs();
  res.json({ synced: jobs.length });
});

/** GET /jobs/:id - get job details */
app.get("/jobs/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "Not found" });
  res.json(job);
});

/** POST /jobs/:id/approve - approve a job */
app.post("/jobs/:id/approve", async (req, res) => {
  try {
    await approveJob(req.params.id);
    res.json({ message: "Approved", jobId: req.params.id });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/** GET /audit - get audit logs */
app.get("/audit", (req, res) => {
  res.json(getAuditLog());
});

/** GET /audit/:id - get audit logs for job */
app.get("/audit/:id", (req, res) => {
  res.json(getAuditLog(req.params.id));
});

// To use this controller, wire it into your server framework (e.g. import this file in main.ts/server)
export default app;
