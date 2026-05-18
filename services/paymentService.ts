import { prisma } from "@/lib/prisma";
import { currentFee } from "@/lib/utils";
import { logEvent } from "@/services/logService";

export async function paySession(sessionId: string) {
  const session = await prisma.parkingSession.findUnique({
    where: { id: sessionId },
    include: { vehicle: true, parkingSpot: true }
  });
  if (!session) throw new Error("Session not found");

  const totalCost = currentFee(session.entryTime, session.totalCost);
  const paid = await prisma.parkingSession.update({
    where: { id: sessionId },
    data: { isPaid: true, totalCost },
    include: { vehicle: true, parkingSpot: true }
  });

  await logEvent({
    type: "payment_completed",
    message: `${session.vehicle.licensePlate} paid ${totalCost.toFixed(2)} EUR.`,
    licensePlate: session.vehicle.licensePlate,
    parkingSpotName: session.parkingSpot?.name
  });
  return paid;
}
