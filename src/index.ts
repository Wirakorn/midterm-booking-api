import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// เปิดใช้งาน CORS สำหรับให้ Frontend / API Tester เรียกใช้งาน
app.use('*', cors())

// 1. GET /equipment — ดึงรายการอุปกรณ์ทั้งหมด
app.get('/equipment', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM equipment').all()
  return c.json(results, 200)
})

// 2. GET /bookings — ดึงรายการการจองทั้งหมด
app.get('/bookings', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM bookings').all()
  return c.json(results, 200)
})

// 3. GET /bookings/:id — ดึงข้อมูลการจองตาม ID
app.get('/bookings/:id', async (c) => {
  const id = c.req.param('id')
  const booking = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first()

  if (!booking) {
    return c.json({ error: 'Booking not found' }, 404)
  }

  return c.json(booking, 200)
})

// 4. POST /bookings — สร้างการจองใหม่
app.post('/bookings', async (c) => {
  try {
    const body = await c.req.json()
    const { equipmentId, borrowerName, startAt, endAt, purpose } = body

    // 4.1 Validate: เช็กว่าส่งข้อมูลครบไหม
    if (!equipmentId || !borrowerName || !startAt || !endAt || !purpose) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    // 4.2 Validate: เช็กรูปแบบเวลา และ startAt ต้องอยู่ก่อน endAt
    const startDate = new Date(startAt)
    const endDate = new Date(endAt)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
      return c.json({ error: 'startAt must be before endAt and valid ISO date' }, 400)
    }

    // 4.3 Validate: เช็กว่ามี equipmentId นี้ในระบบไหม
    const eq = await c.env.DB.prepare('SELECT id FROM equipment WHERE id = ?').bind(equipmentId).first()
    if (!eq) {
      return c.json({ error: 'Equipment not found' }, 404)
    }

    // 4.4 Check Overlapping: เช็กว่าเวลางานซ้อนทับกับการจองเดิมหรือไม่
    const overlap = await c.env.DB.prepare(
      'SELECT id FROM bookings WHERE equipmentId = ? AND startAt < ? AND endAt > ?'
    ).bind(equipmentId, endAt, startAt).first()

    if (overlap) {
      return c.json({ error: 'Equipment is already booked for the selected time range' }, 409)
    }

    // 4.5 Insert ข้อมูลใหม่
    const id = `bk-${Date.now()}`
    await c.env.DB.prepare(
      'INSERT INTO bookings (id, equipmentId, borrowerName, startAt, endAt, purpose) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, equipmentId, borrowerName, startAt, endAt, purpose).run()

    const newBooking = { id, equipmentId, borrowerName, startAt, endAt, purpose }
    return c.json(newBooking, 201)
  } catch (e) {
    return c.json({ error: 'Invalid JSON request format' }, 400)
  }
})

// 5. PATCH /bookings/:id — แก้ไขข้อมูลการจอง
app.patch('/bookings/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first()

  if (!existing) {
    return c.json({ error: 'Booking not found' }, 404)
  }

  try {
    const body = await c.req.json()
    const equipmentId = body.equipmentId ?? existing.equipmentId
    const borrowerName = body.borrowerName ?? existing.borrowerName
    const startAt = body.startAt ?? existing.startAt
    const endAt = body.endAt ?? existing.endAt
    const purpose = body.purpose ?? existing.purpose

    // Validate เวลา
    const startDate = new Date(startAt)
    const endDate = new Date(endAt)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
      return c.json({ error: 'startAt must be before endAt and valid ISO date' }, 400)
    }

    // Validate อุปกรณ์
    const eq = await c.env.DB.prepare('SELECT id FROM equipment WHERE id = ?').bind(equipmentId).first()
    if (!eq) {
      return c.json({ error: 'Equipment not found' }, 404)
    }

    // Check Overlapping (เว้น ID ของตัวเอง)
    const overlap = await c.env.DB.prepare(
      'SELECT id FROM bookings WHERE equipmentId = ? AND startAt < ? AND endAt > ? AND id != ?'
    ).bind(equipmentId, endAt, startAt, id).first()

    if (overlap) {
      return c.json({ error: 'Equipment is already booked for the selected time range' }, 409)
    }

    // Update ข้อมูล
    await c.env.DB.prepare(
      'UPDATE bookings SET equipmentId = ?, borrowerName = ?, startAt = ?, endAt = ?, purpose = ? WHERE id = ?'
    ).bind(equipmentId, borrowerName, startAt, endAt, purpose, id).run()

    const updatedBooking = { id, equipmentId, borrowerName, startAt, endAt, purpose }
    return c.json(updatedBooking, 200)
  } catch (e) {
    return c.json({ error: 'Invalid JSON request format' }, 400)
  }
})

// 6. DELETE /bookings/:id — ลบการจอง
app.delete('/bookings/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first()

  if (!existing) {
    return c.json({ error: 'Booking not found' }, 404)
  }

  await c.env.DB.prepare('DELETE FROM bookings WHERE id = ?').bind(id).run()
  return c.body(null, 204)
})

export default app