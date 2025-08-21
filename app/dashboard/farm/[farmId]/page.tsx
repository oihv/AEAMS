import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import FarmDetails from "@/components/FarmDetails"

interface FarmPageProps {
  params: Promise<{ farmId: string }>
}

export default async function FarmPage({ params }: FarmPageProps) {
  const session = await auth()
  const { farmId } = await params
  
  if (!session?.user?.email) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    redirect("/auth/signin")
  }

  const farm = await prisma.farm.findFirst({
    where: {
      id: farmId,
      userId: user.id
    },
    include: {
      mainRod: {
        include: {
          secondaryRods: {
            include: {
              readings: {
                orderBy: { timestamp: 'desc' },
                take: 10
              }
            }
          }
        }
      }
    }
  })

  if (!farm) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FarmDetails farm={farm} />
      </div>
    </div>
  )
}