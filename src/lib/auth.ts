import { NextRequest, NextResponse } from 'next/server';
const bcrypt = require('bcrypt');
import jwt from 'jsonwebtoken';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Compare a password with a hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate a JWT token
export function generateToken(user: Omit<User, 'password'>): string {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      username: user.username
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
}

// Verify a JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export async function authenticate(req: NextRequest) {
  // Get token from cookies
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  // Verify token
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return null;
  }

  return decoded;
}

// Set authentication cookie
export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });

  return res;
} 