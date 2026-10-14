// npm run seed
// Clears all six collections and fills them with SAMPLE data for the demo (CLAUDE.md §10).
// Every date is relative to the day the seed runs, so the demo looks right on any date.
// Occupancies, bills and payments are created through the services, so they follow every business rule.
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Billing from '../models/Billing.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Occupancy from '../models/Occupancy.js';
import Payment from '../models/Payment.js';
import Room from '../models/Room.js';
import Tenant from '../models/Tenant.js';
import { createBilling, createPayment } from '../services/billingService.js';
import { cancelOccupancy, completeOccupancy, createOccupancy } from '../services/occupancyService.js';

const ONE_DAY = 24 * 60 * 60 * 1000;

// Today + offset days as "YYYY-MM-DD", the same format the forms send.
function day(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${dayOfMonth}`;
}

// This month + offset as a billing period "YYYY-MM".
function billingPeriod(monthOffset) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// The exact moment n days ago, for maintenance timestamps.
function daysAgo(n) {
  return new Date(Date.now() - n * ONE_DAY);
}

// ---------- Sample data ----------

// 10 rooms on 3 floors: 2 single, 3 double, 5 shared (capacity 4 to 6).
// 102 ends up in maintenance and 202 inactive (finalStatus), after their past stays are recorded.
const ROOMS = [
  { roomNumber: '101', floor: '1st Floor', roomType: 'single', capacity: 1, monthlyRate: 4500, amenities: ['Aircon', 'Private bathroom', 'Study desk'] },
  { roomNumber: '102', floor: '1st Floor', roomType: 'single', capacity: 1, monthlyRate: 4500, amenities: ['Aircon', 'Private bathroom'], finalStatus: 'maintenance' },
  { roomNumber: '103', floor: '1st Floor', roomType: 'double', capacity: 2, monthlyRate: 3500, amenities: ['Aircon', 'Study desk'] },
  { roomNumber: '201', floor: '2nd Floor', roomType: 'double', capacity: 2, monthlyRate: 3500, amenities: ['Aircon', 'Study desk'] },
  { roomNumber: '202', floor: '2nd Floor', roomType: 'double', capacity: 2, monthlyRate: 3200, amenities: ['Electric fan'], finalStatus: 'inactive' },
  { roomNumber: '203', floor: '2nd Floor', roomType: 'shared', capacity: 4, monthlyRate: 2500, amenities: ['Electric fan', 'Shared bathroom', 'Locker'] },
  { roomNumber: '204', floor: '2nd Floor', roomType: 'shared', capacity: 6, monthlyRate: 2200, amenities: ['Electric fan', 'Shared bathroom'] },
  { roomNumber: '301', floor: '3rd Floor', roomType: 'shared', capacity: 4, monthlyRate: 2600, amenities: ['Aircon', 'Shared bathroom', 'Locker'] },
  { roomNumber: '302', floor: '3rd Floor', roomType: 'shared', capacity: 5, monthlyRate: 2300, amenities: ['Electric fan', 'Locker'] },
  { roomNumber: '303', floor: '3rd Floor', roomType: 'shared', capacity: 6, monthlyRate: 2000, amenities: ['Electric fan'] },
];

// 18 tenants with sample names. Ramon and Liza end up inactive (they moved out).
const TENANTS = [
  { firstName: 'Juan', lastName: 'Dela Cruz', emergencyContactName: 'Rosa Dela Cruz', email: 'juan.delacruz@example.com' },
  { firstName: 'Maria', lastName: 'Santos', emergencyContactName: 'Pedro Santos', email: 'maria.santos@example.com' },
  { firstName: 'Jose', lastName: 'Reyes', emergencyContactName: 'Carmen Reyes' },
  { firstName: 'Ana', lastName: 'Garcia', emergencyContactName: 'Luis Garcia', email: 'ana.garcia@example.com' },
  { firstName: 'Mark', lastName: 'Bautista', emergencyContactName: 'Elena Bautista' },
  { firstName: 'Kristine', lastName: 'Mendoza', emergencyContactName: 'Roberto Mendoza', email: 'kristine.mendoza@example.com' },
  { firstName: 'Paolo', lastName: 'Villanueva', emergencyContactName: 'Teresa Villanueva' },
  { firstName: 'Angelica', lastName: 'Ramos', emergencyContactName: 'Manuel Ramos', email: 'angelica.ramos@example.com' },
  { firstName: 'Carlo', lastName: 'Aquino', emergencyContactName: 'Gloria Aquino' },
  { firstName: 'Patricia', lastName: 'Castillo', emergencyContactName: 'Ernesto Castillo', email: 'patricia.castillo@example.com' },
  { firstName: 'Andres', lastName: 'Torres', emergencyContactName: 'Lourdes Torres' },
  { firstName: 'Bea', lastName: 'Flores', emergencyContactName: 'Antonio Flores', email: 'bea.flores@example.com' },
  { firstName: 'Daniel', lastName: 'Navarro', emergencyContactName: 'Cecilia Navarro' },
  { firstName: 'Camille', lastName: 'Rivera', emergencyContactName: 'Ricardo Rivera', email: 'camille.rivera@example.com' },
  { firstName: 'Nico', lastName: 'Gonzales', emergencyContactName: 'Imelda Gonzales' },
  { firstName: 'Jasmine', lastName: 'Lopez', emergencyContactName: 'Fernando Lopez', email: 'jasmine.lopez@example.com' },
  { firstName: 'Ramon', lastName: 'Fernandez', emergencyContactName: 'Alma Fernandez', finalStatus: 'inactive' },
  { firstName: 'Liza', lastName: 'Morales', emergencyContactName: 'Victor Morales', email: 'liza.morales@example.com', finalStatus: 'inactive' },
];

const ADDRESSES = ['Sample St., Quezon City', 'Sample Ave., Manila', 'Sample Rd., Pasig City', 'Sample Blvd., Caloocan City'];

// Past stays: 4 completed and 1 cancelled. Day numbers are relative to today.
const PAST_STAYS = [
  { tenant: 'Ramon Fernandez', room: '202', moveIn: -420, moveOut: -200 },
  { tenant: 'Paolo Villanueva', room: '201', moveIn: -400, moveOut: -160 },
  { tenant: 'Liza Morales', room: '302', moveIn: -300, moveOut: -95 },
  { tenant: 'Camille Rivera', room: '102', moveIn: -250, moveOut: -60 },
  { tenant: 'Nico Gonzales', room: '303', moveIn: -10, cancelled: true },
];

// Current stays: 13 active. Rooms 101, 103 and 301 end up exactly full; 203 is 3 of 4 (75%).
// Camille, Nico and Jasmine stay unassigned, so the demo can try to assign them.
// plan = what happens to the bills of [2 months ago, last month, this month].
const CURRENT_STAYS = [
  { tenant: 'Juan Dela Cruz', room: '101', moveIn: -380, plan: ['paid', 'paid', 'paid'], discount: 200 },
  { tenant: 'Maria Santos', room: '103', moveIn: -330, bedLabel: 'Bed 1', plan: ['paid', 'paid', 'partial'] },
  { tenant: 'Jose Reyes', room: '103', moveIn: -300, bedLabel: 'Bed 2', plan: ['paid', 'unpaid', 'unpaid'] },
  { tenant: 'Ana Garcia', room: '201', moveIn: -280, bedLabel: 'Bed 1', plan: ['paid', 'paid', 'unpaid'], expectedMoveOut: 120 },
  { tenant: 'Mark Bautista', room: '203', moveIn: -260, bedLabel: 'Bed A', plan: ['paid', 'partial', 'unpaid'] },
  { tenant: 'Kristine Mendoza', room: '203', moveIn: -240, bedLabel: 'Bed B', plan: ['paid', 'paid', 'paid'], otherCharges: 150 },
  { tenant: 'Paolo Villanueva', room: '203', moveIn: -150, bedLabel: 'Bed C', plan: ['unpaid', 'unpaid', 'unpaid'] },
  { tenant: 'Angelica Ramos', room: '204', moveIn: -220, bedLabel: 'Bed A', plan: ['paid', 'paid', 'partial'] },
  { tenant: 'Carlo Aquino', room: '204', moveIn: -200, bedLabel: 'Bed B', plan: ['paid', 'paid', 'unpaid'], agreedMonthlyRate: 2000 },
  { tenant: 'Patricia Castillo', room: '301', moveIn: -190, bedLabel: 'Bed A', plan: ['paid', 'paid', 'paid'] },
  { tenant: 'Andres Torres', room: '301', moveIn: -170, bedLabel: 'Bed B', plan: ['paid', 'partial', 'partial'] },
  { tenant: 'Bea Flores', room: '301', moveIn: -140, bedLabel: 'Bed C', plan: ['paid', 'paid', 'unpaid'], expectedMoveOut: 200 },
  { tenant: 'Daniel Navarro', room: '301', moveIn: -110, bedLabel: 'Bed D', plan: ['paid', 'paid', 'unpaid'] },
];

// The last 3 billing months. Due dates are relative to today, so the two older months are always
// past due and this month is always not yet due. That gives paid, partial, unpaid and overdue bills.
const MONTHS = [
  { period: billingPeriod(-2), dueDate: day(-53), paidOn: day(-55), utilityAmount: 350 },
  { period: billingPeriod(-1), dueDate: day(-23), paidOn: day(-25), utilityAmount: 420 },
  { period: billingPeriod(0), dueDate: day(7), paidOn: day(0), utilityAmount: 380 },
];

const PAYMENT_METHODS = ['cash', 'gcash', 'bank_transfer', 'other'];

// 10 maintenance requests covering every status and every priority.
const MAINTENANCE = [
  { room: '102', category: 'plumbing', priority: 'urgent', status: 'in_progress', reported: 3, description: 'Burst pipe under the sink. Room closed until it is fixed.' },
  { room: '203', tenant: 'Mark Bautista', category: 'electrical', priority: 'high', status: 'open', reported: 1, description: 'Ceiling light keeps flickering.' },
  { room: '301', tenant: 'Patricia Castillo', category: 'appliance', priority: 'medium', status: 'open', reported: 2, description: 'Electric fan does not turn on.' },
  { room: '103', tenant: 'Maria Santos', category: 'furniture', priority: 'low', status: 'open', reported: 0, description: 'Cabinet door hinge is loose.' },
  { room: '301', tenant: 'Andres Torres', category: 'furniture', priority: 'medium', status: 'in_progress', reported: 4, description: 'Broken slat on the bed frame.' },
  { room: '204', category: 'cleaning', priority: 'medium', status: 'resolved', reported: 10, resolved: 8, description: 'Shared bathroom needs deep cleaning.', resolutionNotes: 'Bathroom deep-cleaned and drain unclogged.' },
  { room: '201', tenant: 'Ana Garcia', category: 'plumbing', priority: 'high', status: 'resolved', reported: 6, resolved: 5, description: 'Leaking faucet.', resolutionNotes: 'Replaced the faucet washer.' },
  { room: '101', tenant: 'Juan Dela Cruz', category: 'electrical', priority: 'urgent', status: 'resolved', reported: 20, resolved: 19, description: 'Wall outlet sparks when used.', resolutionNotes: 'Replaced the faulty outlet.' },
  { room: '303', category: 'other', priority: 'low', status: 'cancelled', reported: 15, description: 'Request for an extra shelf (sent twice by mistake).' },
  { room: '202', category: 'appliance', priority: 'low', status: 'cancelled', reported: 30, description: 'Aircon check before closing the room.' },
];

// ---------- Steps ----------

async function clearCollections() {
  for (const model of [Payment, Billing, MaintenanceRequest, Occupancy, Tenant, Room]) {
    await model.deleteMany({});
  }
}

// Every room starts active so its past stays can be recorded; finalStatus is applied later.
async function seedRooms() {
  const rooms = {};
  for (const { finalStatus, ...room } of ROOMS) {
    rooms[room.roomNumber] = await Room.create({ ...room, notes: 'Sample room (demo data)' });
  }
  return rooms;
}

// Every tenant starts active so their past stays can be recorded; finalStatus is applied later.
async function seedTenants() {
  const tenants = {};
  for (const [index, { finalStatus, ...tenant }] of TENANTS.entries()) {
    const number = String(index + 1).padStart(4, '0');
    const created = await Tenant.create({
      ...tenant,
      phone: `0917000${number}`,
      emergencyContactPhone: `0918000${number}`,
      address: ADDRESSES[index % ADDRESSES.length],
    });
    tenants[created.fullName] = created;
  }
  return tenants;
}

async function seedPastStays(rooms, tenants) {
  for (const stay of PAST_STAYS) {
    const occupancy = await createOccupancy({
      tenant: tenants[stay.tenant]._id,
      room: rooms[stay.room]._id,
      moveInDate: day(stay.moveIn),
      notes: 'Sample data',
    });
    if (stay.cancelled) await cancelOccupancy(occupancy._id);
    else await completeOccupancy(occupancy._id, day(stay.moveOut));
  }
}

async function applyFinalStatuses(rooms, tenants) {
  for (const room of ROOMS.filter((item) => item.finalStatus)) {
    rooms[room.roomNumber].conditionStatus = room.finalStatus;
    await rooms[room.roomNumber].save();
  }
  for (const tenant of TENANTS.filter((item) => item.finalStatus)) {
    const created = tenants[`${tenant.firstName} ${tenant.lastName}`];
    created.status = tenant.finalStatus;
    await created.save();
  }
}

async function seedCurrentStays(rooms, tenants) {
  const currentStays = [];
  for (const stay of CURRENT_STAYS) {
    const room = rooms[stay.room];
    const occupancy = await createOccupancy({
      tenant: tenants[stay.tenant]._id,
      room: room._id,
      moveInDate: day(stay.moveIn),
      expectedMoveOutDate: stay.expectedMoveOut === undefined ? undefined : day(stay.expectedMoveOut),
      bedLabel: stay.bedLabel,
      agreedMonthlyRate: stay.agreedMonthlyRate, // when missing, the service uses the room's rate
      depositAmount: room.monthlyRate,
      notes: 'Sample data',
    });
    currentStays.push({ occupancy, stay });
  }
  return currentStays;
}

async function seedBillsAndPayments(currentStays) {
  let paymentNumber = 0;
  for (const { occupancy, stay } of currentStays) {
    for (const [index, month] of MONTHS.entries()) {
      const bill = await createBilling({
        occupancy: occupancy._id,
        billingPeriod: month.period,
        dueDate: month.dueDate,
        utilityAmount: month.utilityAmount,
        otherCharges: stay.otherCharges ?? 0,
        discount: stay.discount ?? 0,
      });

      const outcome = stay.plan[index];
      if (outcome === 'unpaid') continue;

      // "paid" pays the whole bill; "partial" pays about half, rounded down to the nearest 100.
      const amount = outcome === 'paid' ? bill.total : Math.floor(bill.total / 2 / 100) * 100;
      paymentNumber += 1;
      const method = PAYMENT_METHODS[paymentNumber % PAYMENT_METHODS.length];
      const referenceNumber = { gcash: 'GC', bank_transfer: 'BT' }[method];

      await createPayment({
        billing: bill._id,
        amount,
        paymentDate: month.paidOn,
        method,
        referenceNumber: referenceNumber ? `${referenceNumber}-SAMPLE-${String(paymentNumber).padStart(4, '0')}` : undefined,
        notes: 'Sample payment',
      });
    }
  }
}

// Past maintenance history is inserted as it ended up. Live status changes go through the state machine.
async function seedMaintenance(rooms, tenants) {
  for (const request of MAINTENANCE) {
    await MaintenanceRequest.create({
      room: rooms[request.room]._id,
      tenant: request.tenant ? tenants[request.tenant]._id : undefined,
      category: request.category,
      description: request.description,
      priority: request.priority,
      status: request.status,
      dateReported: daysAgo(request.reported),
      resolvedAt: request.resolved === undefined ? undefined : daysAgo(request.resolved),
      resolutionNotes: request.resolutionNotes,
    });
  }
}

async function printCounts() {
  const count = (model, filter = {}) => model.countDocuments(filter);
  console.log('\nSample data inserted:');
  console.log(`  rooms:                ${await count(Room)}`);
  console.log(`  tenants:              ${await count(Tenant)} (${await count(Tenant, { status: 'inactive' })} inactive)`);
  console.log(
    `  occupancies:          ${await count(Occupancy)} (${await count(Occupancy, { status: 'active' })} active, ` +
      `${await count(Occupancy, { status: 'completed' })} completed, ${await count(Occupancy, { status: 'cancelled' })} cancelled)`
  );
  console.log(`  billings:             ${await count(Billing)}`);
  console.log(`  payments:             ${await count(Payment)}`);
  console.log(`  maintenance requests: ${await count(MaintenanceRequest)}`);
}

async function seed() {
  await connectDB(); // prints only the database name, never the connection string
  console.log('Clearing all six collections...');
  await clearCollections();

  console.log('Inserting sample data...');
  const rooms = await seedRooms();
  const tenants = await seedTenants();
  await seedPastStays(rooms, tenants);
  await applyFinalStatuses(rooms, tenants);
  const currentStays = await seedCurrentStays(rooms, tenants);
  await seedBillsAndPayments(currentStays);
  await seedMaintenance(rooms, tenants);
  await printCounts();
}

try {
  await seed();
} catch (error) {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
