'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Phone, Mail, MapPin, User } from 'lucide-react'

export interface Subcontractor {
  id: number
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
}

interface SubcontractorCardProps {
  subcontractor: Subcontractor
  onEdit: (subcontractor: Subcontractor) => void
  onDelete: (id: number) => void
}

export function SubcontractorCard({ subcontractor, onEdit, onDelete }: SubcontractorCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{subcontractor.name}</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(subcontractor)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(subcontractor.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {subcontractor.contactPerson && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{subcontractor.contactPerson}</span>
          </div>
        )}
        
        {subcontractor.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{subcontractor.phone}</span>
          </div>
        )}
        
        {subcontractor.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{subcontractor.email}</span>
          </div>
        )}
        
        {subcontractor.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-wrap leading-relaxed">{subcontractor.address}</span>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          建立時間: {new Date(subcontractor.createdAt).toLocaleDateString('zh-TW')}
        </div>
      </CardContent>
    </Card>
  )
}