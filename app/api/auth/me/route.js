import { currentUser, getPerms } from "@/lib/auth";
import { bad, route, ser } from "@/lib/util";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await currentUser();
  if (!user) return bad("Not signed in", 401);
  return Response.json({ user: ser(user), perms: await getPerms() });
});
