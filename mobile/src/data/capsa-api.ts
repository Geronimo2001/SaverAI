import { CapsaDashboardData, CreateBudgetInput, CreateTransactionInput } from "./capsa-data"

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000"

async function requestDashboard(path: string, init?: RequestInit): Promise<CapsaDashboardData> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error ?? "No se pudo conectar con CapsaAI.")
  }

  return payload as CapsaDashboardData
}

export function fetchCapsaDashboard(periodKey?: string) {
  const query = periodKey ? `?period=${encodeURIComponent(periodKey)}` : ""
  return requestDashboard(`/api/capsa/dashboard${query}`)
}

export function createCapsaTransaction(input: CreateTransactionInput) {
  return requestDashboard("/api/capsa/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function createCapsaBudget(input: CreateBudgetInput) {
  return requestDashboard("/api/capsa/budgets", {
    method: "POST",
    body: JSON.stringify(input),
  })
}
