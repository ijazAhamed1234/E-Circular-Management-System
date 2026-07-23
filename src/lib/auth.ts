import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

export async function getCurrentUser() {
  let token: string | undefined = undefined;

  // Check cookies first
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_token');
  if (authCookie) {
    token = authCookie.value;
  }

  // Fallback to Authorization header
  if (!token) {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as any; // Type according to payload
  } catch (error) {
    return null;
  }
}
