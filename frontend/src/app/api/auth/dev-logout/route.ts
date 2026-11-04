import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("mindspace_session");
  cookieStore.delete("dev_token");

  const response = NextResponse.json({ success: true });
  response.cookies.delete("mindspace_session");
  response.cookies.delete("dev_token");

  return response;
}
