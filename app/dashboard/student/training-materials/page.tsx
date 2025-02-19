'use client'
import { DashboardLayout } from "@/components/DashboardLayout"
import StudentTrainingMaterials from "@/components/StudentTrainingMaterials"

export default function TrainingMaterialsPage() {
  return (
    <DashboardLayout userType="student">
      <StudentTrainingMaterials />
    </DashboardLayout>
  )
}

