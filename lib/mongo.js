import { MongoClient, ObjectId } from "mongodb";
export { ObjectId };
export const oid = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  const g = globalThis;
  if (!g._mongoP) {
    g._mongoP = new MongoClient(uri).connect();
    g._mongoP.catch(() => { g._mongoP = null; });
  }
  return (await g._mongoP).db(process.env.MONGODB_DB || "outreach");
}
