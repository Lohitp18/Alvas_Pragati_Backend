const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const Candidate = require("../models/Candidate");

// MongoDB URI
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://alvaswebsites_db_user:cKORxzTh2d4JGF2C@alvaspragati.auzwfz.mongodb.net/?appName=AlvasPragati";

async function runSmsUrlReport() {
  console.log("====================================================");
  console.log("Generating SMS URL Report...");
  console.log("====================================================");

  try {
    console.log("[DB] Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("[DB] Connected successfully.");

    // Fetch candidates whose SMS has not been sent
    const filter = {
      $or: [
        { registration_sms_sent: false },
        { registration_sms_sent: null },
        { registration_sms_sent: { $exists: false } },
      ],
    };

    const candidates = await Candidate.find(filter).sort({ createdAt: 1 });

    console.log(`Found ${candidates.length} candidate(s).`);

    if (candidates.length === 0) {
      console.log("No pending candidates found.");
      return;
    }

    const smsUrls = [];

    for (let i = 0; i < candidates.length; i++) {
      const { fullName, phone, serialNumber } = candidates[i];

      console.log(
        `[${i + 1}/${candidates.length}] ${fullName} (${phone})`
      );

      if (!phone || !serialNumber) {
        console.log("Skipping...");
        continue;
      }

      const message =
        `Dear ${fullName}, ` +
        `Thank you for registering for Alva's Pragati 2026. ` +
        `Your registration is confirmed and your registration number is ${serialNumber}. ` +
        `Best wishes from Team Alva's Pragati. ` +
        `Visit: www.alvaspragati.com -Alvas`;

      const smsUrl =
        `https://sms.dosnet.in/sms-panel/api/http/index.php?` +
        `username=alvaspragati` +
        `&apikey=14BDF-9F270` +
        `&apirequest=Text` +
        `&sender=ALVASF` +
        `&mobile=91${phone}` +
        `&message=${encodeURIComponent(message)}` +
        `&route=TRANS` +
        `&TemplateID=1107178046810394672` +
        `&format=JSON`;

      smsUrls.push(smsUrl);

      console.log("✓ URL Generated");
    }

    const reportPath = path.join(__dirname, "sms_urls_report.txt");

    // Store only URLs separated by commas
fs.writeFileSync(
  reportPath,
  smsUrls.map(url => `"${url}"`).join(",\n"),
  "utf8"
);
    console.log("\n====================================================");
    console.log("Report Generated Successfully");
    console.log(`Total URLs : ${smsUrls.length}`);
    console.log(`Saved To   : ${reportPath}`);
    console.log("====================================================");
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log("[DB] Connection Closed.");
    process.exit(0);
  }
}

runSmsUrlReport();