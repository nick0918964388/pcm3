# 專案結構與部署 (Project Structure & Deployment)

## 6. 元件 (Components)
將系統劃分為五大邏輯元件：
* **前端應用程式**: 處理所有使用者介面的渲染與互動。
* **後端服務 (API)**: 處理所有業務邏輯、資料庫互動與外部系統整合。
* **認證服務**: 專責處理使用者登入、登出、會話管理。
* **資料庫**: 持久化儲存所有應用程式資料。
* **檔案儲存體**: 儲存使用者上傳的檔案。

## 8. 核心工作流程 (Core Workflows)
使用者登入時，前端會將帳號密碼發送至後端服務。後端服務會查詢 Oracle 資料庫來驗證憑證，驗證成功後會建立一個安全的 Session 並回傳給前端，前端接著將使用者導向至專案選擇頁面。

## 12. 統一專案結構 (Unified Project Structure)
```plaintext
/pcm-project/
├── apps/
│   └── web/                    # 核心 Next.js 應用程式 (含前後端)
│       ├── src/
│       │   ├── app/              # 頁面與 API 路由
│       │   │   ├── (auth)/       # 認證相關頁面
│       │   │   ├── (main)/       # 主應用程式頁面
│       │   │   └── api/          # API 路由
│       │   ├── components/       # 前端 React 元件
│       │   │   ├── ui/           # shadcn/ui 基礎元件
│       │   │   ├── common/       # 共用元件
│       │   │   └── features/     # 功能特定元件
│       │   ├── lib/              # 共用函式庫
│       │   ├── repositories/     # 後端倉儲層
│       │   ├── services/         # 業務邏輯服務層
│       │   └── stores/           # 前端狀態管理
│       ├── public/               # 靜態資源
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── tsconfig.json
├── packages/                   # 共享套件
│   └── shared/                 # 共享的 TypeScript 型別
│       ├── types/
│       │   ├── user.ts
│       │   ├── project.ts
│       │   └── index.ts
│       └── package.json
├── infrastructure/             # 基礎設施設定
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── Dockerfile
│   └── nginx.conf
├── scripts/                    # 工具腳本
│   ├── seed-data.sql
│   └── backup-db.sh
├── docs/                       # 文件
│   ├── prd/
│   ├── architecture/
│   └── api/
├── .env.example
├── .gitignore
├── package.json                # Root package.json for monorepo
└── README.md
```

## 13. 開發流程 (Development Workflow)

### 環境前置需求
* Node.js (18.x 或更高版本)
* Docker & Docker Compose
* Git

### 初次設定步驟
1. `git clone <repository-url>`
2. `npm install` (安裝根目錄與所有工作空間的依賴)
3. `cp .env.example .env` (複製並設定環境變數)
4. `docker-compose up -d` (啟動 Oracle 資料庫)
5. `npm run db:seed` (植入測試資料)

### 開發常用指令
* `npm run dev` - 啟動開發伺服器
* `npm run build` - 建置生產版本
* `npm run test` - 執行所有測試
* `npm run test:unit` - 執行單元測試
* `npm run test:e2e` - 執行端對端測試
* `npm run lint` - 程式碼檢查
* `npm run type-check` - TypeScript 型別檢查

### 環境變數
```env
# 資料庫設定
DATABASE_URL=oracle://username:password@localhost:1521/xe
DATABASE_SCHEMA=PCM

# NextAuth 設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# 檔案上傳設定
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760

# 外部 API 設定
TIMECARD_API_URL=https://api.timecard.example.com
TIMECARD_API_KEY=your-api-key
```

## 14. 部署架構 (Deployment Architecture)

### 部署策略
採用「藍綠部署 (Blue-Green Deployment)」以實現零停機時間的回滾。

### CI/CD 管線
使用 Jenkins，包含以下階段：
1. **build** - 建置 Docker 映像檔
2. **test** - 執行自動化測試
3. **deploy_to_staging** - 部署至測試環境
4. **deploy_to_production** - 部署至生產環境

### 環境設定
#### Development 環境
* 本地開發環境
* 使用 Docker Compose 啟動服務
* 包含熱重載與開發工具

#### Staging 環境
* 模擬生產環境的測試環境
* 用於使用者驗收測試 (UAT)
* 與生產環境相同的基礎設施

#### Production 環境
* 正式生產環境
* 高可用性配置
* 完整的監控與備份機制

### Docker 配置
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 監控與日誌
* **監控工具**: Netdata
* **日誌管理**: 系統內建日誌 + 檔案日誌
* **健康檢查**: API 端點 `/api/health`
* **效能監控**: 回應時間、資料庫查詢效能