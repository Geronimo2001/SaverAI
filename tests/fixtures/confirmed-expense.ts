export const referenceDate = new Date(2026, 9, 25)

export function validExpense() {
  return {
    userId: "quality-user",
    messageId: "quality-message",
    sourceMessageIds: ["quality-source"],
    expense: {
      amount: 1500 as unknown,
      merchant: "Comercio de prueba",
      category: "super",
      card: "1042",
      date: "2026-10-25",
      description: undefined as unknown,
    },
  }
}
