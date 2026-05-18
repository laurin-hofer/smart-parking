import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.eventLog.deleteMany();
  await prisma.parkingSession.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.parkingSpot.deleteMany();
  await prisma.vehicle.deleteMany();

  const vehicles = await Promise.all([
    prisma.vehicle.create({ data: { licensePlate: "W-123AB", ownerName: "Anna Berger", note: "Monthly pass", isAllowed: true } }),
    prisma.vehicle.create({ data: { licensePlate: "I-404CD", ownerName: "Markus Leitner", note: "Disabled for overdue payment", isAllowed: false } }),
    prisma.vehicle.create({ data: { licensePlate: "KU-77EF", ownerName: "Sofia Steiner", note: "VIP customer", isAllowed: true } }),
    prisma.vehicle.create({ data: { licensePlate: "SZ-808GP", ownerName: "Noah Huber", note: "Resident access", isAllowed: true } })
  ]);

  const spots = await Promise.all(
    Array.from({ length: 8 }, (_, index) =>
      prisma.parkingSpot.create({
        data: {
          name: `A-${index + 1}`,
          status: index === 0 || index === 1 ? "OCCUPIED" : index === 2 ? "RESERVED" : index === 7 ? "MAINTENANCE" : "FREE",
          assignedVehicleId: index === 0 ? vehicles[0].id : index === 1 ? vehicles[2].id : null
        }
      })
    )
  );

  await prisma.reservation.create({
    data: {
      vehicleId: vehicles[3].id,
      parkingSpotId: spots[2].id,
      status: "ACTIVE",
      validUntil: new Date(Date.now() + 90 * 60 * 1000)
    }
  });

  await prisma.parkingSession.create({
    data: {
      vehicleId: vehicles[0].id,
      parkingSpotId: spots[0].id,
      entryTime: new Date(Date.now() - 42 * 60 * 1000),
      status: "ACTIVE",
      isPaid: false,
      totalCost: 0
    }
  });

  await prisma.parkingSession.create({
    data: {
      vehicleId: vehicles[2].id,
      parkingSpotId: spots[1].id,
      entryTime: new Date(Date.now() - 126 * 60 * 1000),
      status: "ACTIVE",
      isPaid: true,
      totalCost: 5.04
    }
  });

  await prisma.parkingSession.create({
    data: {
      vehicleId: vehicles[3].id,
      parkingSpotId: spots[3].id,
      entryTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
      exitTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: "FINISHED",
      isPaid: true,
      totalCost: 4.8
    }
  });

  await prisma.eventLog.createMany({
    data: [
      {
        type: "license_plate_added",
        message: "W-123AB was registered for Anna Berger.",
        licensePlate: "W-123AB"
      },
      {
        type: "reservation_created",
        message: "SZ-808GP reserved A-3.",
        licensePlate: "SZ-808GP",
        parkingSpotName: "A-3"
      },
      {
        type: "car_entered",
        message: "W-123AB entered and was assigned to A-1.",
        licensePlate: "W-123AB",
        parkingSpotName: "A-1"
      },
      {
        type: "barrier_denied",
        message: "I-404CD was denied at the entry barrier.",
        licensePlate: "I-404CD"
      },
      {
        type: "payment_completed",
        message: "KU-77EF paid 5.04 EUR.",
        licensePlate: "KU-77EF",
        parkingSpotName: "A-2"
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
