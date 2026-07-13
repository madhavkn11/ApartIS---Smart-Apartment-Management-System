const express = require("express")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const JWT_SECRET = "jebfyuervf"

// ─── Socket.io Setup ──────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
})

// Listen for connections
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id)

  // Join the admins room
  socket.on("join-admins", () => {
    socket.join("admins")
    console.log(`Socket ${socket.id} joined admins room`)
  })

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id)
  })
})

app.use(cors())
app.use(express.json())

mongoose.connect("mongodb://localhost:27017/apartmentiq")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err))

// ═══════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════

// ─── User Schema ──────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  role:       { type: String, enum: ["admin", "resident"], default: "resident" },
  flatNumber: { type: String, default: "" }
})
const User = mongoose.model("User", userSchema)

// ─── Flat Schema ──────────────────────────────────────────────
const flatSchema = new mongoose.Schema({
  flatNumber:  { type: String, required: true },
  floor:       { type: Number, required: true },
  type:        { type: String, required: true }, // 1BHK / 2BHK / 3BHK
  ownerName:   { type: String, required: true },
  phone:       { type: String, required: true },
  maintenance: { type: Number, required: true },
})
const Flat = mongoose.model("Flat", flatSchema)

// ─── Payment Schema ──────────────────────────────────────────
const paymentSchema = new mongoose.Schema({
  flatId:     { type: mongoose.Schema.Types.ObjectId, ref: "Flat", required: true },
  flatNumber: { type: String, required: true },
  month:      { type: Number, required: true },  // 1-12
  year:       { type: Number, required: true },
  amount:     { type: Number, default: 3000 },
  status:     { type: String, enum: ["Paid", "Pending", "Pending Approval"], default: "Pending" },
  paidOn:     { type: Date }
})
const Payment = mongoose.model("Payment", paymentSchema)

// ─── Complaint Schema ─────────────────────────────────────────
const complaintSchema = new mongoose.Schema({
  flatNumber:  { type: String, required: true },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  status:      { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },
  createdAt:   { type: Date, default: Date.now }
})
const Complaint = mongoose.model("Complaint", complaintSchema)

// ─── Notification Schema ──────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  message:     { type: String, required: true },
  flatNumber:  { type: String, required: true },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint" },
  read:        { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now }
})
const Notification = mongoose.model("Notification", notificationSchema)

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ error: "No token" })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.id
    req.userRole = decoded.role           
    req.userFlat = decoded.flatNumber     
    next()
  } catch (err) {
    res.status(401).json({ error: "Invalid token" })
  }
}

function adminOnly(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." })
  }
  next()
}

// ═══════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════

app.post("/register", async (req, res) => {
  try {
    const { email, password, role, flatNumber } = req.body
    const validRoles = ["admin", "resident"]
    const assignedRole = validRoles.includes(role) ? role : "resident"

    const hpwd = await bcrypt.hash(password, 10)
    const u = new User({ email, password: hpwd, role: assignedRole, flatNumber })
    await u.save()
    res.json({ message: "Signed up successfully" })
  } catch (err) {
    res.status(400).json({ error: "Email already exists" })
  }
})

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    const u = await User.findOne({ email })
    if (!u) return res.status(401).json({ error: "Invalid credentials" })
    const match = await bcrypt.compare(password, u.password)
    if (!match) return res.status(401).json({ error: "Invalid credentials" })

    const token = jwt.sign(
      { id: u._id, role: u.role, flatNumber: u.flatNumber }, 
      JWT_SECRET,
      { expiresIn: "1d" }
    )
    res.json({ token, role: u.role, flatNumber: u.flatNumber }) 
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.get("/dashboard", verifyToken, (req, res) => {
  res.json({ message: "Welcome!", userId: req.userId })
})

// ═══════════════════════════════════════════════════════════════
// FLAT ROUTES
// ═══════════════════════════════════════════════════════════════

app.get("/flats", verifyToken, async (req, res) => {
  try {
    const flats = await Flat.find()
    res.json(flats)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.get("/flats/byNumber/:flatNumber", verifyToken, async (req, res) => {
  try {
    const flat = await Flat.findOne({ flatNumber: req.params.flatNumber })
    if (!flat) return res.status(404).json({ error: "Flat not found" })
    res.json(flat)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.post("/flats", verifyToken, async (req, res) => {
  try {
    const { flatNumber, floor, type, ownerName, phone, maintenance } = req.body

    if (!flatNumber || flatNumber.length > 5) {
      return res.status(400).json({ error: "Flat number must be 1-5 characters" })
    }
    if (!floor || floor < 1 || floor > 50) {
      return res.status(400).json({ error: "Floor must be between 1 and 50" })
    }
    const validTypes = ["1BHK", "2BHK", "3BHK"]
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Type must be 1BHK, 2BHK or 3BHK" })
    }
    if (!ownerName || ownerName.length > 50) {
      return res.status(400).json({ error: "Owner name must be 1-50 characters" })
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ error: "Phone must be exactly 10 digits" })
    }
    if (!maintenance || maintenance < 500 || maintenance > 50000) {
      return res.status(400).json({ error: "Maintenance must be between 500 and 50000" })
    }

    const flat = new Flat({ flatNumber, floor, type, ownerName, phone, maintenance })
    await flat.save()
    res.json({ message: "Flat added", flat })
  } catch (err) {
    res.status(400).json({ error: "Could not add flat" })
  }
})

app.put("/flats/:id", verifyToken, async (req, res) => {
  try {
    const updated = await Flat.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    res.json({ message: "Flat updated", flat: updated })
  } catch (err) {
    res.status(500).json({ error: "Could not update flat" })
  }
})

app.delete("/flats/:id", verifyToken, async (req, res) => {
  try {
    await Flat.findByIdAndDelete(req.params.id)
    res.json({ message: "Flat deleted" })
  } catch (err) {
    res.status(500).json({ error: "Could not delete flat" })
  }
})

// ═══════════════════════════════════════════════════════════════
// PAYMENT ROUTES
// ═══════════════════════════════════════════════════════════════

app.post("/payments/generate", verifyToken, async (req, res) => {
  try {
    const { month, year } = req.body
    const flats = await Flat.find()
    const existing = await Payment.find({ month, year })
    const existingFlatIds = existing.map(p => p.flatId.toString())

    const newPayments = flats
      .filter(f => !existingFlatIds.includes(f._id.toString()))
      .map(f => ({
        flatId: f._id,
        flatNumber: f.flatNumber,
        month,
        year,
        amount: f.maintenance || 3000,
        status: "Pending"
      }))

    if (newPayments.length > 0) {
      await Payment.insertMany(newPayments)
    }
    res.json({ message: "Payments generated", count: newPayments.length })
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.get("/payments", verifyToken, async (req, res) => {
  try {
    const { month, year } = req.query
    const payments = await Payment.find({ month: parseInt(month), year: parseInt(year) })
    res.json(payments)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.get("/payments/resident/:flatNumber", verifyToken, async (req, res) => {
  try {
    const payments = await Payment.find({ flatNumber: req.params.flatNumber }).sort({ year: -1, month: -1 })
    res.json(payments)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.put("/payments/:id/pay", verifyToken, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: "Paid", paidOn: new Date() },
      { new: true }
    )
    res.json(payment)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.put("/payments/:id/unpay", verifyToken, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: "Pending", paidOn: null },
      { new: true }
    )
    res.json(payment)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.put("/payments/:id/request-pay", verifyToken, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: "Pending Approval" },
      { new: true }
    )
    if (!payment) return res.status(404).json({ error: "Payment not found" })

    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    const monthName = MONTHS[payment.month - 1]

    // Create a live notification
    const notification = new Notification({
      message: `Flat ${payment.flatNumber} marked payment for ${monthName} ${payment.year} as Paid (Accept?)`,
      flatNumber: payment.flatNumber,
      complaintId: null
    })
    await notification.save()

    // Emit live to all connected admin sockets
    io.to("admins").emit("new-complaint", notification)

    res.json(payment)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// ═══════════════════════════════════════════════════════════════
// COMPLAINT ROUTES
// ═══════════════════════════════════════════════════════════════

app.get("/complaints", verifyToken, async (req, res) => {
  try {
    let complaints
    if (req.userRole === "admin") {
      complaints = await Complaint.find().sort({ createdAt: -1 })
    } else {
      complaints = await Complaint.find({ flatNumber: req.userFlat }).sort({ createdAt: -1 })
    }
    res.json(complaints)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.post("/complaints", verifyToken, async (req, res) => {
  try {
    const { flatNumber, title, description } = req.body
    if (!flatNumber || !title || !description) {
      return res.status(400).json({ error: "All fields are required" })
    }
    const complaint = new Complaint({ flatNumber, title, description })
    await complaint.save()

    // Create a live notification
    const notification = new Notification({
      message: `New complaint from Flat ${flatNumber}: ${title}`,
      flatNumber,
      complaintId: complaint._id
    })
    await notification.save()

    // Emit live to all connected admin sockets
    io.to("admins").emit("new-complaint", notification)

    res.json({ message: "Complaint submitted", complaint })
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.put("/complaints/:id/status", verifyToken, adminOnly, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ["Open", "In Progress", "Resolved"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    res.json(complaint)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.delete("/complaints/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id)
    res.json({ message: "Complaint deleted" })
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION ROUTES
// ═══════════════════════════════════════════════════════════════

app.get("/notifications", verifyToken, adminOnly, async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(30)
    res.json(notifications)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.put("/notifications/:id/read", verifyToken, adminOnly, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    )
    res.json(notification)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

app.put("/notifications/read-all", verifyToken, adminOnly, async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true })
    res.json({ message: "All marked read" })
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// Start server using the http server instance
server.listen(5000, () => console.log("Server running on port 5000"))