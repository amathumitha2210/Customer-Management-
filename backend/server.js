const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const bodyParser = require('body-parser');

const Customer = require('./models/Customer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(bodyParser.json());

// Connect MongoDB
mongoose.connect('mongodb://localhost:27017/customerdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(console.error);

// --- API Routes ---
app.get('/api/customers', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { nic: { $regex: search, $options: 'i' } },
            { "addresses.city": { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const customers = await Customer.find(query)
      .populate({
        path: 'familyMembers',
        select: 'name nic addresses',
      })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Customer.countDocuments(query);

    res.json({ total, page: Number(page), limit: Number(limit), customers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get a single customer with family members
// Example GET /api/customers route (with pagination)
app.get('/api/customers', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const customers = await Customer.find()
      .populate('familyMembers', 'name nic')  // <-- populate familyMembers with only name and nic fields
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .exec();

    const total = await Customer.countDocuments();

    res.json({ total, page: Number(page), limit: Number(limit), customers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Create a new customer
app.post('/api/customers', async (req, res) => {
  try {
    const { name, dob, nic, mobiles, addresses, familyMembers = [] } = req.body;

    if (!name || !dob || !nic) {
      return res.status(400).json({ error: "Missing mandatory fields" });
    }

    const exists = await Customer.findOne({ nic });
    if (exists) {
      return res.status(400).json({ error: "NIC already exists" });
    }

    const customer = new Customer({
      name,
      dob,
      nic,
      mobiles,
      addresses,
      familyMembers
    });

    await customer.save();

    // Populate family members after save
    await customer.populate('familyMembers', 'name nic');

    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, dob, nic, mobiles, addresses, familyMembers = [] } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    if (nic && nic !== customer.nic) {
      const exists = await Customer.findOne({ nic });
      if (exists) return res.status(400).json({ error: "NIC already exists" });
    }

    customer.name = name || customer.name;
    customer.dob = dob || customer.dob;
    customer.nic = nic || customer.nic;
    customer.mobiles = mobiles || [];
    customer.addresses = addresses || [];
    customer.familyMembers = familyMembers || [];

    await customer.save();

    // Populate family members before sending back
    await customer.populate('familyMembers', 'name nic');

    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk upload customers via Excel
app.post('/api/customers/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) return res.status(400).json({ error: "Excel file empty" });

    const batchSize = 1000;
    let createdCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      const bulkOps = batch.map(row => {
        if (!row.Name || !row.DOB || !row.NIC) {
          throw new Error(`Missing mandatory fields in row: ${JSON.stringify(row)}`);
        }

        const dob = new Date(row.DOB);
        if (isNaN(dob)) throw new Error(`Invalid DOB in row: ${JSON.stringify(row)}`);

        const mobiles = row.Mobiles ? row.Mobiles.split(',').map(m => m.trim()) : [];

        // Extract and format familyMembers from Excel cell (expected: "Name1:NIC1,Name2:NIC2")
        let familyMembers = [];
        if (row.FamilyMembers) {
          familyMembers = row.FamilyMembers.split(',').map(entry => {
            const [name, nic] = entry.split(':').map(x => x.trim());
            if (name && nic) {
              return { name, nic };
            }
            return null;
          }).filter(fm => fm); // remove invalid ones
        }

        return {
          updateOne: {
            filter: { nic: row.NIC },
            update: {
              $set: {
                name: row.Name,
                dob,
                mobiles,
                familyMembers,
                addresses: [{
                  addressLine1: row.AddressLine1 || '',
                  addressLine2: row.AddressLine2 || '',
                  city: row.City || '',
                  country: row.Country || ''
                }]
              }
            },
            upsert: true
          }
        };
      });

      const result = await Customer.bulkWrite(bulkOps);
      createdCount += result.upsertedCount || 0;
      updatedCount += result.modifiedCount || 0;
    }

    res.json({ message: `Bulk upload successful. Created: ${createdCount}, Updated: ${updatedCount}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
