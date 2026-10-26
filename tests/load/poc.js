import { cycle, settings, handleSummary } from "./workflow.js"
export const options = settings({ executor: "shared-iterations", vus: 1, iterations: 1, maxDuration: "15s" })
export default cycle
export { handleSummary }
