import http from "k6/http"
import crypto from "k6/crypto"
import { check, sleep } from "k6"
import { Counter } from "k6/metrics"

const baseUrl = __ENV.LOAD_BASE_URL
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(baseUrl || "")) throw new Error("Solo backend local temporal")
const users = JSON.parse(__ENV.LOAD_USERS || "[]")
const profile = __ENV.LOAD_PROFILE
const secret = __ENV.LOAD_SECRET
const runId = __ENV.LOAD_RUN_ID
const completed = new Counter("completed_cycles")
const attempted = new Counter("attempted_cycles")

export function settings(scenario) {
  return {
    scenarios: { workflow: scenario },
    thresholds: {
      http_req_failed: ["rate==0"],
      checks: ["rate==1"],
      completed_cycles: ["count>0"],
      http_req_duration: ["p(95)<500", "p(99)<1000"],
      ...(__ENV.LOAD_PROBE_FAILURE === "1" ? { http_reqs: ["count<0"] } : {}),
    },
    summaryTrendStats: ["avg", "min", "med", "max", "p(95)", "p(99)"],
    systemTags: ["method", "status", "name", "expected_response", "scenario"],
    userAgent: "CapsaAI-TP-quality-k6",
  }
}

function send(method, path, name, payload) {
  const body = payload === undefined ? null : JSON.stringify(payload)
  const headers = body === null ? {} : { "content-type": "application/json",
    "x-capsa-signature": "sha256=" + crypto.hmac("sha256", secret, body, "hex") }
  return http.request(method, baseUrl + path, body, { headers, timeout: "5s", redirects: 0, tags: { name } })
}
function json(response) {
  try { return response.json() } catch { return null }
}

export function cycle() {
  const userId = users[__VU - 1]
  if (!userId) throw new Error("Falta usuario sintetico para VU " + __VU)
  const messageId = runId + "-" + profile + "-" + __VU + "-" + __ITER
  const payload = { userId, messageId, sourceMessageIds: [messageId],
    expense: { amount: 1500, merchant: "Comercio de carga", category: "super", card: "9999", date: "2026-01-01" } }
  attempted.add(1)
  const create = send("POST", "/webhooks/whatsapp/expenses/confirmed", "create", payload)
  const createdBody = json(create)
  const created = check(create, {
    "alta 201 y monto correcto": r => r.status === 201 && createdBody?.status === "created" && createdBody?.expense?.amount === 1500,
  })
  const path = "/expenses?userId=" + encodeURIComponent(userId) + "&period=2026-01"
  const list = send("GET", path, "read")
  const listBody = json(list)
  const listed = check(list, {
    "consulta encuentra solo el gasto creado": r => r.status === 200 && listBody?.expenses?.length === 1 &&
      listBody.expenses[0].externalMessageId === messageId && listBody.expenses[0].amount === 1500,
  })
  const remove = send("POST", "/webhooks/whatsapp/expenses/deleted", "delete", { userId, externalMessageId: messageId })
  const removed = check(remove, {
    "borrado 200": r => r.status === 200 && json(r)?.status === "deleted",
  })
  const empty = send("GET", path, "read-after-delete")
  const cleared = check(empty, {
    "consulta posterior vacia": r => r.status === 200 && json(r)?.expenses?.length === 0,
  })
  sleep(0.25)
  if (created && listed && removed && cleared) completed.add(1)
}

export function handleSummary(data) {
  return { [__ENV.LOAD_REPORT]: JSON.stringify(data, null, 2) + "\n" }
}
