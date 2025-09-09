# API 規格與外部整合 (API Specification & External Integrations)

## 5. API 規格 (API Specification)
採用 OpenAPI 3.0 標準定義了第一階段所需的 REST API 端點。

### 認證 API (Authentication APIs)
* `POST /api/auth/login` - 使用者登入
* `POST /api/auth/logout` - 使用者登出
* `GET /api/auth/session` - 取得目前會話狀態

### 專案 API (Project APIs)
* `GET /api/projects` - 取得使用者可存取的專案列表
* `GET /api/projects/{id}` - 取得特定專案詳細資訊
* `POST /api/projects` - 建立新專案
* `PUT /api/projects/{id}` - 更新專案資訊
* `DELETE /api/projects/{id}` - 刪除專案

### 協力廠商與人員 API (Subcontractors & Personnel APIs)
* `GET /api/subcontractors` - 取得協力廠商列表
* `POST /api/subcontractors` - 新增協力廠商
* `PUT /api/subcontractors/{id}` - 更新協力廠商資訊
* `DELETE /api/subcontractors/{id}` - 刪除協力廠商
* `GET /api/personnel` - 取得人員列表
* `POST /api/personnel` - 新增人員
* `PUT /api/personnel/{id}` - 更新人員資訊
* `DELETE /api/personnel/{id}` - 刪除人員

### 角色與權限 API (Roles & Permissions APIs)
* `GET /api/roles` - 取得角色列表
* `POST /api/roles` - 建立新角色
* `GET /api/users/{id}/roles` - 取得使用者角色
* `POST /api/users/{id}/roles` - 指派角色給使用者
* `DELETE /api/users/{id}/roles/{roleId}` - 移除使用者角色

### 值班表 API (Duty Roster APIs)
* `GET /api/duty-rosters` - 取得值班表
* `POST /api/duty-rosters` - 建立值班安排
* `PUT /api/duty-rosters/{id}` - 更新值班安排
* `DELETE /api/duty-rosters/{id}` - 刪除值班安排

### 出勤 API (Attendance APIs)
* `POST /api/attendance` - 接收出勤數據
* `GET /api/attendance` - 查詢出勤記錄
* `GET /api/attendance/reports` - 產生出勤統計報表

### WBS API (Work Breakdown Structure APIs)
* `GET /api/wbs/{projectId}` - 取得專案 WBS 結構
* `POST /api/wbs/{projectId}/items` - 新增 WBS 項目
* `PUT /api/wbs/items/{id}` - 更新 WBS 項目
* `DELETE /api/wbs/items/{id}` - 刪除 WBS 項目
* `GET /api/wbs/items/{id}/changes` - 取得 WBS 變更記錄

### 報告 API (Reports APIs)
* `GET /api/reports/daily` - 取得每日報告列表
* `POST /api/reports/daily` - 提交每日報告
* `PUT /api/reports/daily/{id}` - 更新每日報告
* `DELETE /api/reports/daily/{id}` - 刪除每日報告
* `POST /api/reports/daily/{id}/attachments` - 上傳報告附件

### 公告 API (Announcements APIs)
* `GET /api/announcements` - 取得公告列表
* `POST /api/announcements` - 建立新公告
* `PUT /api/announcements/{id}` - 更新公告
* `DELETE /api/announcements/{id}` - 刪除公告

## 7. 外部 API (External APIs)

### 刷卡機系統 API
* **目的**: 用於接收每日人員出勤打卡紀錄
* **狀態**: 細節待確認
* **預期格式**: JSON 格式的出勤數據，包含人員 ID、打卡時間、工作類型等資訊
* **安全性**: 需要 API 金鑰認證
* **頻率**: 即時或定時批次傳送

### PowerBI 整合
* **目的**: 提供進階數據分析與報表功能
* **整合方式**: 
  - 透過資料庫直接連線
  - 定時匯出資料至指定格式
* **資料範圍**: 專案進度、出勤統計、品質指標等
* **更新頻率**: 每日或即時更新

### 檔案儲存 API
* **目的**: 處理報告附件與文件上傳
* **支援格式**: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, MP4 等
* **儲存位置**: 本地檔案系統或雲端儲存
* **安全性**: 檔案類型驗證、大小限制、病毒掃描