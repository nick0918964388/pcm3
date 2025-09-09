# 安全性、效能與編碼標準 (Security, Performance & Coding Standards)

## 15. 安全性與效能 (Security and Performance)

### 安全性需求 (Security Requirements)

#### 前端安全性
* **輸入驗證**: 所有使用者輸入都必須在前端進行基本驗證
* **XSS 防範**: 使用 React 的內建 XSS 防護，避免使用 `dangerouslySetInnerHTML`
* **CSRF 防範**: 使用 NextAuth.js 內建的 CSRF 保護
* **敏感資料處理**: 避免在前端儲存敏感資料，使用安全的 Session 管理

#### 後端安全性
* **輸入驗證**: 使用 Zod 或類似函式庫驗證所有 API 輸入
* **SQL 注入防範**: 使用參數化查詢，避免字串拼接 SQL
* **認證與授權**: 每個 API 端點都必須檢查使用者權限
* **API 速率限制**: 實作 Rate Limiting 防止 API 濫用
* **安全的密碼儲存**: 使用 bcrypt 雜湊密碼，加鹽強度至少 10

#### Session 管理
* **安全的 Session**: 使用 HTTPOnly、Secure、SameSite 屬性
* **Session 過期**: 設定合理的 Session 過期時間
* **登出處理**: 確保登出時完全清除 Session

### 效能優化 (Performance Optimization)

#### 前端效能
* **程式碼分割**: 使用 Next.js 動態導入進行路由層級的程式碼分割
* **圖片優化**: 使用 Next.js Image 元件進行自動圖片優化
* **快取策略**: 合理使用瀏覽器快取與 Service Worker
* **延遲載入**: 對非關鍵元件實作延遲載入

#### 後端效能
* **資料庫索引**: 為常用查詢欄位建立適當的索引
* **分頁查詢**: 對大量資料實作分頁，避免一次載入過多資料
* **查詢優化**: 使用適當的 JOIN 和 WHERE 條件優化 SQL 查詢
* **快取策略**: 對頻繁存取的資料實作快取機制

## 16. 測試策略 (Testing Strategy)

### 測試金字塔 (Testing Pyramid)
採用單元測試、整合測試、端對端測試結合的策略：

* **單元測試 (70%)**: 測試個別函式與元件
* **整合測試 (20%)**: 測試 API 端點與資料庫互動
* **端對端測試 (10%)**: 測試完整的使用者流程

### 測試組織 (Test Organization)
```plaintext
apps/web/
├── __tests__/              # 單元測試
│   ├── components/
│   ├── services/
│   └── utils/
├── tests/
│   ├── integration/        # API 整合測試
│   └── e2e/               # 端對端測試
└── src/
```

### 測試範例
```typescript
// 單元測試範例 (Jest + React Testing Library)
import { render, screen } from '@testing-library/react';
import ProjectCard from '@/components/features/ProjectCard';

describe('ProjectCard', () => {
  const mockProject = {
    id: 1,
    name: '測試專案',
    status: '進行中',
    progress: 75
  };

  it('應顯示專案名稱', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('測試專案')).toBeInTheDocument();
  });
});

// API 整合測試範例
import { GET } from '@/app/api/projects/route';
import { auth } from '@/lib/auth';

jest.mock('@/lib/auth');

describe('/api/projects', () => {
  it('應返回使用者的專案列表', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '1' } });
    
    const request = new Request('http://localhost:3000/api/projects');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

// E2E 測試範例 (使用 Playwright)
import { test, expect } from '@playwright/test';

test('使用者應能成功登入並看到專案選擇頁', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/projects');
  await expect(page.getByText('選擇專案')).toBeVisible();
});
```

## 17. 編碼標準 (Coding Standards)

### 核心編碼規則

#### 服務層與倉儲層分離
業務邏輯與資料庫操作分離：
```typescript
// ❌ 錯誤：在 API 路由中直接寫 SQL
export async function GET() {
  const result = await db.query('SELECT * FROM PROJECTS');
  return NextResponse.json(result.rows);
}

// ✅ 正確：透過服務層與倉儲層
export async function GET() {
  const projects = await projectService.getAllProjects();
  return NextResponse.json(projects);
}
```

#### 型別共享
共用型別需定義在 `packages/shared/` 中：
```typescript
// packages/shared/types/project.ts
export interface Project {
  id: number;
  name: string;
  status: string;
  created_at: Date;
}

// apps/web/src/services/projectService.ts
import { Project } from '@shared/types';
```

#### 環境變數存取
需透過集中的設定檔讀取：
```typescript
// apps/web/src/lib/config.ts
export const config = {
  database: {
    url: process.env.DATABASE_URL!,
    schema: process.env.DATABASE_SCHEMA || 'PCM'
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL!
  }
};
```

#### API 錯誤處理
需使用統一的錯誤處理機制：
```typescript
// apps/web/src/lib/errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// 在 API 路由中使用
export async function GET() {
  try {
    // ... 業務邏輯
  } catch (error) {
    if (error instanceof APIError) {
      return new NextResponse(error.message, { status: error.statusCode });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
```

#### 元件狀態管理
需區分伺服器狀態與客戶端狀態：
```typescript
// ✅ 正確：使用 React Query 管理伺服器狀態
const { data: projects, isLoading } = useQuery({
  queryKey: ['projects'],
  queryFn: getProjects
});

// ✅ 正確：使用 Zustand 管理客戶端狀態
const { selectedProject, setSelectedProject } = useProjectStore();
```

### 命名慣例 (Naming Conventions)
| 元素 | 慣例 | 範例 |
| :--- | :--- | :--- |
| React 元件檔 | 大駝峰 (PascalCase) | `ProjectCard.tsx` |
| Hook 函式 | 小駝峰 + use 前綴 | `useProjectStore.ts` |
| 工具函式 | 小駝峰 (camelCase) | `formatDate.ts` |
| API 路由檔 | 固定名稱 | `route.ts` |
| 型別定義 | 大駝峰 (PascalCase) | `Project`, `UserRole` |
| 變數與函式 | 小駝峰 (camelCase) | `getUserProjects` |
| 常數 | 全大寫蛇形 | `MAX_FILE_SIZE` |
| Oracle 資料表 | 全大寫蛇形 | `PROJECTS`, `USER_ROLES` |
| Oracle 欄位 | 全小寫蛇形 | `created_at`, `user_id` |

### 檔案組織慣例
* 每個元件檔案應只包含一個主要元件
* 相關的型別定義可以放在同一檔案中
* 大型元件應拆分為子元件
* 共用邏輯應提取為自訂 Hook

### 註解與文件化
```typescript
/**
 * 取得使用者可存取的專案列表
 * @param userId - 使用者 ID
 * @returns Promise<Project[]> - 專案列表
 */
export async function getProjectsForUser(userId: number): Promise<Project[]> {
  return await projectRepository.findByUserId(userId);
}
```

### Git 提交慣例
使用 Conventional Commits 格式：
* `feat: 新增專案建立功能`
* `fix: 修正登入驗證問題`
* `docs: 更新 API 文件`
* `style: 修正程式碼格式`
* `refactor: 重構使用者服務層`
* `test: 新增專案服務測試`