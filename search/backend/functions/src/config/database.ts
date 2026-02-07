/**
 * Database configuration and connection
 * Placeholder for database setup
 */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connected: boolean = false;

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<void> {
    try {
      await prisma.$connect();
      this.connected = true;
      console.log('Successfully connected to RDS via Prisma');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
