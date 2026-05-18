import { prisma } from "@/lib/prisma";

export async function logEvent(input: {
  type: string;
  message: string;
  licensePlate?: string | null;
  parkingSpotName?: string | null;
}) {
  return prisma.eventLog.create({
    data: {
      type: input.type,
      message: input.message,
      licensePlate: input.licensePlate,
      parkingSpotName: input.parkingSpotName
    }
  });
}
