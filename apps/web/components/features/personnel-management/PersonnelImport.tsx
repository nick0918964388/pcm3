'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react'

export interface Subcontractor {
  id: number
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
}

interface ImportResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    error: string
    data?: any
  }>
}

interface PersonnelImportProps {
  subcontractors: Subcontractor[]
  onBack: () => void
  onSuccess: () => void
}

export function PersonnelImport({ subcontractors, onBack, onSuccess }: PersonnelImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
        alert('請選擇 CSV 或 Excel 檔案')
        return
      }
      
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleDownloadTemplate = () => {
    const csvContent = 'name,position,phone,email,employeeId\n張三,工程師,0912345678,zhang@example.com,EMP001\n李四,技術員,0923456789,li@example.com,EMP002'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'personnel_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const parseCSV = (text: string): Array<Record<string, string>> => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []
    
    // Sanitize and validate headers
    const headers = lines[0].split(',').map(h => {
      const trimmed = h.trim()
      // Remove any non-alphanumeric characters except underscores
      return trimmed.replace(/[^a-zA-Z0-9_]/g, '')
    }).filter(h => h.length > 0)
    
    // Validate expected headers
    const expectedHeaders = ['name', 'position', 'phone', 'email', 'employeeId']
    const validHeaders = headers.filter(h => expectedHeaders.includes(h))
    
    if (validHeaders.length === 0 || !validHeaders.includes('name')) {
      throw new Error('Invalid CSV format: missing required "name" column')
    }
    
    const data = []
    
    for (let i = 1; i < lines.length; i++) {
      // Simple CSV parsing with escape handling for quoted values
      const values = []
      let current = ''
      let inQuotes = false
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      
      const row: Record<string, string> = {}
      validHeaders.forEach((header, index) => {
        const value = values[index] || ''
        // Sanitize cell values to prevent injection
        row[header] = value.replace(/[<>\"'&]/g, '').substring(0, 255)
      })
      
      // Only add rows with required data
      if (row.name && row.name.trim().length > 0) {
        data.push(row)
      }
    }
    
    return data
  }

  const validatePersonnelData = (data: Record<string, string>, rowIndex: number) => {
    const errors = []
    
    if (!data.name || data.name.trim() === '') {
      errors.push(`第 ${rowIndex + 2} 行：姓名為必填項目`)
    }
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push(`第 ${rowIndex + 2} 行：電子郵件格式不正確`)
    }
    
    return errors
  }

  const handleImport = async () => {
    if (!selectedFile || !selectedSubcontractor) {
      alert('請選擇檔案和協力廠商')
      return
    }

    setIsImporting(true)
    setImportProgress(0)
    setImportResult(null)

    try {
      const text = await selectedFile.text()
      const data = parseCSV(text)
      
      if (data.length === 0) {
        alert('檔案格式不正確或無資料')
        return
      }

      const subcontractorId = parseInt(selectedSubcontractor)
      const results: ImportResult = {
        success: 0,
        failed: 0,
        errors: []
      }

      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        setImportProgress(((i + 1) / data.length) * 100)

        const validationErrors = validatePersonnelData(row, i)
        if (validationErrors.length > 0) {
          results.failed++
          results.errors.push({
            row: i + 2,
            error: validationErrors.join(', '),
            data: row
          })
          continue
        }

        try {
          const response = await fetch('/api/personnel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subcontractorId,
              name: row.name.trim(),
              position: row.position?.trim() || null,
              phone: row.phone?.trim() || null,
              email: row.email?.trim() || null,
              employeeId: row.employeeId?.trim() || null,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            results.failed++
            results.errors.push({
              row: i + 2,
              error: errorData.error || '匯入失敗',
              data: row
            })
          } else {
            results.success++
          }
        } catch (error) {
          results.failed++
          results.errors.push({
            row: i + 2,
            error: '網路錯誤',
            data: row
          })
        }

        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setImportResult(results)
      
      if (results.success > 0) {
        setTimeout(() => {
          onSuccess()
        }, 3000)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('匯入過程發生錯誤')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">批量匯入人員</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>匯入設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>協力廠商 *</Label>
              <Select value={selectedSubcontractor} onValueChange={setSelectedSubcontractor}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇協力廠商" />
                </SelectTrigger>
                <SelectContent>
                  {subcontractors.map((subcontractor) => (
                    <SelectItem key={subcontractor.id} value={subcontractor.id.toString()}>
                      {subcontractor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>匯入檔案 *</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {selectedFile ? selectedFile.name : '選擇檔案'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                支援 CSV、Excel 格式檔案
              </p>
            </div>

            <Button
              onClick={handleImport}
              disabled={!selectedFile || !selectedSubcontractor || isImporting}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? '匯入中...' : '開始匯入'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>說明與範本</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">檔案格式要求：</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 必須包含標題行 (第一行)</li>
                <li>• 必填欄位：name (姓名)</li>
                <li>• 選填欄位：position, phone, email, employeeId</li>
                <li>• 檔案編碼：UTF-8</li>
              </ul>
            </div>

            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              下載範本檔案
            </Button>
          </CardContent>
        </Card>
      </div>

      {isImporting && (
        <Card>
          <CardHeader>
            <CardTitle>匯入進度</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={importProgress} className="mb-2" />
            <p className="text-sm text-center">{Math.round(importProgress)}%</p>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>匯入結果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">成功匯入</p>
                  <p className="text-sm text-green-600">{importResult.success} 筆資料</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">匯入失敗</p>
                  <p className="text-sm text-red-600">{importResult.failed} 筆資料</p>
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">錯誤詳情：</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">
                      {error.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}