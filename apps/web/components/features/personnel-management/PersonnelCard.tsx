'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Phone, Mail, Building, IdCard, Briefcase } from 'lucide-react'

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

interface PersonnelCardProps {
  personnel: Personnel
  onEdit: (personnel: Personnel) => void
  onDelete: (id: number) => void
}

export function PersonnelCard({ personnel, onEdit, onDelete }: PersonnelCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{personnel.name}</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(personnel)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(personnel.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        {personnel.subcontractorName && (
          <Badge variant="secondary" className="w-fit">
            <Building className="mr-1 h-3 w-3" />
            {personnel.subcontractorName}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {personnel.position && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{personnel.position}</span>
          </div>
        )}
        
        {personnel.employeeId && (
          <div className="flex items-center gap-2 text-sm">
            <IdCard className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{personnel.employeeId}</span>
          </div>
        )}
        
        {personnel.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{personnel.phone}</span>
          </div>
        )}
        
        {personnel.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{personnel.email}</span>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          建立時間: {new Date(personnel.createdAt).toLocaleDateString('zh-TW')}
        </div>
      </CardContent>
    </Card>
  )
}