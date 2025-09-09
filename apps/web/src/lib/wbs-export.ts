import { WBSItem } from '@shared/types'

export interface WBSExportOptions {
  format: 'excel' | 'pdf' | 'json'
  includeDescription?: boolean
  includeIds?: boolean
}

export class WBSExporter {
  static exportToJSON(items: WBSItem[], options: WBSExportOptions = { format: 'json' }): string {
    const cleanItems = this.cleanItemsForExport(items, options)
    return JSON.stringify(cleanItems, null, 2)
  }

  static exportToCSV(items: WBSItem[], options: WBSExportOptions = { format: 'excel' }): string {
    const flatItems = this.flattenItems(items)
    
    const headers = [
      'WBS代碼',
      '項目名稱',
      '層級',
      '排序'
    ]
    
    if (options.includeDescription) {
      headers.push('描述')
    }
    
    if (options.includeIds) {
      headers.push('ID', '父項目ID')
    }

    const csvRows = [headers.join(',')]
    
    flatItems.forEach(item => {
      const row = [
        `"${item.code}"`,
        `"${item.name}"`,
        item.levelNumber.toString(),
        item.sortOrder.toString()
      ]
      
      if (options.includeDescription) {
        row.push(`"${item.description || ''}"`)
      }
      
      if (options.includeIds) {
        row.push(item.id.toString(), (item.parentId || '').toString())
      }
      
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  }

  static exportToHTML(items: WBSItem[], options: WBSExportOptions = { format: 'pdf' }): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>WBS 工作分解結構</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .wbs-tree { list-style: none; padding: 0; }
        .wbs-item { margin: 5px 0; padding: 8px; border-left: 3px solid #007bff; background: #f8f9fa; }
        .wbs-code { font-family: monospace; font-weight: bold; color: #666; }
        .wbs-name { font-weight: bold; margin-left: 10px; }
        .wbs-description { margin-left: 10px; color: #666; font-style: italic; }
        .level-0 { margin-left: 0px; border-left-color: #007bff; }
        .level-1 { margin-left: 20px; border-left-color: #28a745; }
        .level-2 { margin-left: 40px; border-left-color: #ffc107; }
        .level-3 { margin-left: 60px; border-left-color: #6c757d; }
        .meta { font-size: 12px; color: #666; margin-top: 5px; }
    </style>
</head>
<body>
    <h1>WBS 工作分解結構</h1>
    <div class="export-info">
        <p>匯出時間：${new Date().toLocaleString('zh-TW')}</p>
    </div>
    <div class="wbs-tree">
        ${this.renderItemsToHTML(items, options)}
    </div>
</body>
</html>`
    
    return html
  }

  private static renderItemsToHTML(items: WBSItem[], options: WBSExportOptions, level = 0): string {
    return items.map(item => {
      const children = item.children ? this.renderItemsToHTML(item.children, options, level + 1) : ''
      
      return `
        <div class="wbs-item level-${level}">
            <span class="wbs-code">${item.code}</span>
            <span class="wbs-name">${item.name}</span>
            ${options.includeDescription && item.description ? 
              `<div class="wbs-description">${item.description}</div>` : ''}
            ${options.includeIds ? 
              `<div class="meta">ID: ${item.id} | 層級: ${item.levelNumber} | 排序: ${item.sortOrder}</div>` : ''}
            ${children}
        </div>`
    }).join('')
  }

  private static flattenItems(items: WBSItem[]): WBSItem[] {
    const flattened: WBSItem[] = []
    
    const flatten = (items: WBSItem[]) => {
      items.forEach(item => {
        flattened.push(item)
        if (item.children && item.children.length > 0) {
          flatten(item.children)
        }
      })
    }
    
    flatten(items)
    return flattened
  }

  private static cleanItemsForExport(items: WBSItem[], options: WBSExportOptions): any[] {
    return items.map(item => {
      const cleaned: any = {
        code: item.code,
        name: item.name,
        levelNumber: item.levelNumber,
        sortOrder: item.sortOrder
      }
      
      if (options.includeDescription) {
        cleaned.description = item.description
      }
      
      if (options.includeIds) {
        cleaned.id = item.id
        cleaned.parentId = item.parentId
        cleaned.projectId = item.projectId
        cleaned.createdAt = item.createdAt
      }
      
      if (item.children && item.children.length > 0) {
        cleaned.children = this.cleanItemsForExport(item.children, options)
      }
      
      return cleaned
    })
  }

  static downloadFile(content: string, filename: string, contentType: string) {
    const blob = new Blob([content], { type: contentType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}