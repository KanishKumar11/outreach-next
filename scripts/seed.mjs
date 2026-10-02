// Creates indexes and the first Super Admin. Run once: npm run seed
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const { MONGODB_URI, MONGODB_DB = "outreach", SEED_ADMIN_NAME = "Super Admin", SEED_ADMIN_USERNAME = "superadmin", SEED_ADMIN_PASSWORD } = process.env;
if (!MONGODB_URI || !SEED_ADMIN_PASSWORD || SEED_ADMIN_PASSWORD.length < 8) {
  console.error("Set MONGODB_URI and SEED_ADMIN_PASSWORD (min 8 characters) in .env.local");
  process.exit(1);
}
const client = await new MongoClient(MONGODB_URI).connect();
const db = client.db(MONGODB_DB);
await db.collection("users").createIndex({ username: 1 }, { unique: true });
await db.collection("prospects").createIndex({ createdAt: -1 });
await db.collection("events").createIndex({ start: 1 });
const username = SEED_ADMIN_USERNAME.toLowerCase();
if (await db.collection("users").findOne({ username })) console.log("Super Admin already exists: " + username);
else {
  await db.collection("users").insertOne({
    username, name: SEED_ADMIN_NAME, role: "Super Admin", status: "active",
    passHash: await bcrypt.hash(SEED_ADMIN_PASSWORD, 12), createdAt: new Date().toISOString().slice(0, 10),
  });
  console.log("Created Super Admin: " + username);
}
await client.close();
