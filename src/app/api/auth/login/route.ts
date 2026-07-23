import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create JWT payload (omitting sensitive info like password_hash)
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
      designation: user.designation
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    const response = NextResponse.json({ token, user: payload }, { status: 200 });
    
    // Set cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
