const mongoose = require("mongoose")



const complaintSchema = new mongoose.Schema({
  flatNumber:  { type: String, required: true },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  status:      { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },
  createdAt:   { type: Date, default: Date.now }
})
const Complaint = mongoose.model("Complaint", complaintSchema)

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

const complaints = [
  { flatNumber: "101", title: "Water leakage",          description: "Water leaking from the ceiling near the kitchen since this morning.",        status: "Open",        createdAt: daysAgo(1) },
  { flatNumber: "203", title: "Lift not working",        description: "Lift in block B has been stuck on the 3rd floor since last night.",            status: "In Progress", createdAt: daysAgo(2) },
  { flatNumber: "304", title: "Parking issue",           description: "Another car is parked in my allotted parking spot repeatedly.",                status: "Open",        createdAt: daysAgo(3) },
  { flatNumber: "402", title: "Power fluctuation",       description: "Frequent power fluctuations damaging appliances in the flat.",                 status: "Resolved",    createdAt: daysAgo(6) },
  { flatNumber: "501", title: "Garbage not collected",   description: "Garbage from our floor hasn't been collected for the past 3 days.",            status: "Resolved",    createdAt: daysAgo(8) },
  { flatNumber: "104", title: "Noisy water pump",        description: "The common water pump makes a loud noise every morning around 6 AM.",          status: "In Progress", createdAt: daysAgo(4) },
  { flatNumber: "302", title: "Broken intercom",         description: "Intercom in the flat has not been working for over a week.",                   status: "Open",        createdAt: daysAgo(0) },
  { flatNumber: "204", title: "Pest control needed",     description: "Cockroach infestation near the stairwell on the 2nd floor.",                   status: "Resolved",    createdAt: daysAgo(10) },
]

const seed = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/apartmentiq")
    console.log("Connected to MongoDB")
    await Complaint.deleteMany({})
    console.log("Old complaints deleted")
    await Complaint.insertMany(complaints)
    console.log(`${complaints.length} complaints seeded successfully!`)
    process.exit(0)
  } catch (e) {
    console.error("Seeding failed:", e)
    process.exit(1)
  }
}

seed()
