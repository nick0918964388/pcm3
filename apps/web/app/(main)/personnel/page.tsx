'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SubcontractorList } from '@/components/features/subcontractor-management/SubcontractorList'
import { PersonnelList } from '@/components/features/personnel-management/PersonnelList'

export default function PersonnelPage() {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="personnel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personnel">人員管理</TabsTrigger>
          <TabsTrigger value="subcontractors">協力廠商管理</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personnel" className="space-y-6">
          <PersonnelList />
        </TabsContent>
        
        <TabsContent value="subcontractors" className="space-y-6">
          <SubcontractorList />
        </TabsContent>
      </Tabs>
    </div>
  )
}