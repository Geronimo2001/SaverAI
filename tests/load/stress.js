import { cycle, settings, handleSummary } from "./workflow.js"
export const options = settings({ executor: "ramping-vus", startVUs: 1, stages: [
  { duration: "10s", target: 5 }, { duration: "10s", target: 10 },
  { duration: "10s", target: 20 }, { duration: "10s", target: 20 }, { duration: "10s", target: 0 },
], gracefulRampDown: "10s", gracefulStop: "10s" })
export default cycle
export { handleSummary }
