import fs from 'fs';
import csv from 'csv-parser';
import { User, Room, Booking } from './types';

function readCSV<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data as T))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

function writeCSV<T extends Record<string, unknown>>(filePath: string, data: T[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const headers = Object.keys(data[0]).join(',') + '\n';
    const csvData = data.map(item => Object.values(item).join(',')).join('\n') + '\n';
    fs.writeFile(filePath, headers + csvData, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function appendToCSV(filePath: string, data: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const csvLine = Object.values(data).join(',') + '\n';
    fs.appendFile(filePath, csvLine, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function convertToRecord<T>(obj: T): Record<string, unknown> {
  return { ...obj } as Record<string, unknown>;
}

export const readUsers = () => readCSV<User>('data/users.csv');
export const readRooms = () => readCSV<Room>('data/rooms.csv');
export const readBookings = () => readCSV<Booking>('data/bookings.csv');
export const appendUser = (user: User) => appendToCSV('data/users.csv', convertToRecord(user));
export const appendBooking = (booking: Booking) => appendToCSV('data/bookings.csv', convertToRecord(booking));
export const writeUsers = (users: User[]) => writeCSV('data/users.csv', users.map(convertToRecord));
export const writeBookings = (bookings: Booking[]) => writeCSV('data/bookings.csv', bookings.map(convertToRecord));