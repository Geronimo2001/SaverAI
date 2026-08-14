import { pool } from "./db.js"

const devWhatsappUserId = "whatsapp:+5493511234567"

async function main() {
  const user = await pool.query<{ id: string }>(
    `
      INSERT INTO app_users (whatsapp_user_id)
      VALUES ($1)
      ON CONFLICT (whatsapp_user_id) DO UPDATE SET whatsapp_user_id = EXCLUDED.whatsapp_user_id
      RETURNING id
    `,
    [devWhatsappUserId],
  )

  const userId = Number(user.rows[0]!.id)
  await seedPaymentMethod(userId, "Visa Galicia", "1042")
  await seedPaymentMethod(userId, "Master Santander", "7781")
  await seedPaymentMethod(userId, "Mercado Pago", "2209")

  await pool.end()
  console.log(`Seeded dev WhatsApp user ${devWhatsappUserId}.`)
}

async function seedPaymentMethod(userId: number, label: string, lastFour: string) {
  await pool.query(
    `
      INSERT INTO payment_methods (user_id, label, last_four)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, last_four) DO UPDATE
      SET label = EXCLUDED.label, active = true
    `,
    [userId, label, lastFour],
  )
}

main().catch(async (error) => {
  console.error(error)
  await pool.end()
  process.exit(1)
})
