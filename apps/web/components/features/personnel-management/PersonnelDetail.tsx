'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Phone, Mail, Building, IdCard, Briefcase, Calendar } from 'lucide-react'

export interface Personnel {
  id: number
  subcontractorId: number
  name: string
  position: string | null
  phone: string | null
  email: string | null
  employeeId: string | null
  createdAt: string
  subcontractorName?: string
}

interface PersonnelDetailProps {
  personnel: Personnel
  onBack: () => void
}

export function PersonnelDetail({ personnel, onBack }: PersonnelDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">人員詳細資訊</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{personnel.name}</span>
              {personnel.subcontractorName && (
                <Badge variant="secondary">
                  <Building className="mr-1 h-3 w-3" />
                  {personnel.subcontractorName}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {personnel.position && (
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">職位</p>
                  <p className="font-medium">{personnel.position}</p>
                </div>
              </div>
            )}
            
            {personnel.employeeId && (
              <div className="flex items-center gap-3">
                <IdCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">員工編號</p>
                  <p className="font-medium">{personnel.employeeId}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>聯絡資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {personnel.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">電話</p>
                  <p className="font-medium">{personnel.phone}</p>
                </div>
              </div>
            )}
            
            {personnel.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">電子郵件</p>
                  <p className="font-medium">{personnel.email}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">建立時間</p>
                <p className="font-medium">
                  {new Date(personnel.createdAt).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}