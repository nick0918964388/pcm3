# 前端架構 (Frontend Architecture)

## 10. 前端架構 (Frontend Architecture)

### 元件架構 (Component Architecture)

#### 1. 元件組織結構 (Component Organization)
為了保持程式碼的整潔與可維護性，我們採用以下的分層目錄結構來組織我們的 React 元件：
```plaintext
apps/web/src/
├── app/                  # Next.js App Router: 放置所有頁面與路由。
├── components/
│   ├── ui/               # 放置由 shadcn/ui 產生的基礎 UI 元件 (如 Button, Card)。
│   ├── common/           # 放置由基礎元件組合而成、可在全站共用的通用元件 (例如頁首 PageHeader)。
│   └── features/         # 放置與特定功能相關的複雜元件 (例如專案列表 ProjectList, WBS 樹狀圖 WBS-Tree)。
├── lib/                  # 放置共用的工具函式 (utils)。
└── services/             # 放置所有與後端 API 溝通的程式碼。
```

#### 2. 元件範本 (Component Template)
所有新的 React 元件都應遵循以下使用 TypeScript 的標準範本。這是一個 ProjectCard 元件範例：
```typescript
// 檔案路徑: apps/web/src/components/features/ProjectCard.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Project } from '@/lib/types'; // 假設我們將共用型別放在 lib/types.ts

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>狀態：{project.status}</p>
        <Progress value={/* 計算進度 */} className="w-full" />
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
```

### 狀態管理架構 (State Management Architecture)
我們將「伺服器狀態」與「客戶端狀態」分開管理：

**伺服器狀態 (Server State)**: 從後端 API 取得的資料，使用 TanStack Query (React Query) 來管理，它能自動處理快取、背景更新與資料同步。

**客戶端狀態 (Client State)**: 存活於 UI 中的狀態（如表單內容），使用 Zustand 來進行管理。

### 狀態儲存結構 (Store Structure)
```plaintext
apps/web/src/
├── stores/
│   ├── userStore.ts       # 管理使用者登入狀態、個人資料。
│   ├── projectStore.ts    # 管理專案列表、當前選擇的專案等。
│   └── uiStore.ts         # 管理全域 UI 狀態 (例如：載入中、通知訊息)。
```

### 路由架構 (Routing Architecture)

#### 1. 路由組織結構 (Route Organization)
採用 Next.js App Router 以目錄為基礎的路由系統，並使用「路由群組 (Route Groups)」來組織：
```plaintext
apps/web/src/app/
├── (auth)/             # 放置「不需」登入即可存取的頁面
│   └── login/
│       └── page.tsx
├── (main)/             # 放置「需要」登入才能存取的主應用程式頁面
│   ├── layout.tsx
│   ├── projects/
│   │   └── page.tsx
│   └── (project)/
│       └── [projectId]/
│           ├── dashboard/page.tsx
│           └── ...
└── page.tsx
```

#### 2. 受保護路由模式 (Protected Route Pattern)
使用 middleware.ts 檔案來保護在 (main) 群組下的所有路由。此 middleware 會檢查使用者的 Session，若未登入，則自動重新導向至 /login 頁面。

### 前端服務層 (Frontend Services Layer)

#### 1. API 客戶端設定 (API Client Setup)
建立一個中央化的 API 客戶端實例 (axios)，並設定「攔截器 (Interceptors)」來統一處理認證與錯誤。
```typescript
// 檔案路徑: apps/web/src/lib/api.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 2. 服務層範例 (Service Example)
將所有與特定資料相關的 API 請求，封裝在對應的 "service" 檔案中。
```typescript
// 檔案路徑: apps/web/src/services/projectService.ts
import apiClient from '@/lib/api';
import { Project } from '@/lib/types';

export const getProjects = async (): Promise<Project[]> => {
  try {
    const response = await apiClient.get('/projects');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
};
```