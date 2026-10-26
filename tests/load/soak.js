import { cycle, settings, handleSummary } from "./workflow.js"
export const options = settings({ executor: "constant-vus", vus: 2, duration: "120s", gracefulStop: "10s" })
export default cycle
export { handleSummary }
