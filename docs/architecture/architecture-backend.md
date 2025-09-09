# 後端架構 (Backend Architecture)

## 11. 後端架構 (Backend Architecture)

### 服務架構 (Service Architecture)

#### 1. 函式組織結構 (Function Organization)
所有後端 API 邏輯存放在 app/api/ 目錄下，並根據資源分子目錄：
```plaintext
apps/web/src/app/api/
├── auth/
│   └── [...nextauth]/route.ts
├── projects/
│   └── route.ts
├── subcontractors/
│   ├── route.ts
│   └── [id]/route.ts
├── personnel/
│   ├── route.ts
│   └── [id]/route.ts
├── roles/
│   └── route.ts
├── duty-rosters/
│   └── route.ts
├── attendance/
│   └── route.ts
├── wbs/
│   ├── [projectId]/route.ts
│   └── items/
│       └── [id]/route.ts
├── reports/
│   └── daily/
│       ├── route.ts
│       └── [id]/route.ts
└── announcements/
    └── route.ts
```

#### 2. 函式範本 (Function Template)
每個 API 路由都遵循標準範本，包含身份驗證、業務邏輯分離、統一錯誤處理。
```typescript
// 檔案路徑: apps/web/src/app/api/projects/route.ts
import { NextResponse } from 'next/server';
import { getProjectsForUser } from '@/services/projectService';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const projects = await getProjectsForUser(session.user.id);
    return NextResponse.json(projects);
  } catch (error) {
    console.error('[PROJECTS_GET] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const body = await request.json();
    const project = await createProject(body, session.user.id);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('[PROJECTS_POST] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
```

### 資料庫架構 (Database Architecture)

#### 1. 資料庫結構設計 (Schema Design)
遵循先前在「資料庫結構 (Database Schema)」章節中定義的 CREATE TABLE SQL 語句。

#### 2. 資料存取層 (Data Access Layer)
採用倉儲模式 (Repository Pattern)，將所有 SQL 查詢封裝在 Repository 檔案中，業務邏輯層 (Service) 只呼叫 Repository。

```typescript
// 檔案路徑: apps/web/src/repositories/projectRepository.ts
import { db } from '@/lib/db';
import { Project } from '@/lib/types';

export const projectRepository = {
  async findByUserId(userId: number): Promise<Project[]> {
    const result = await db.query(
      'SELECT * FROM PROJECTS p JOIN USER_PROJECTS up ON p.id = up.project_id WHERE up.user_id = :userId',
      { userId }
    );
    return result.rows as Project[];
  },

  async findById(id: number): Promise<Project | null> {
    const result = await db.query(
      'SELECT * FROM PROJECTS WHERE id = :id',
      { id }
    );
    return result.rows[0] as Project || null;
  },

  async create(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const result = await db.query(
      `INSERT INTO PROJECTS (name, code, status, start_date, planned_submission_date, total_duration_days) 
       VALUES (:name, :code, :status, :start_date, :planned_submission_date, :total_duration_days) 
       RETURNING *`,
      project
    );
    return result.rows[0] as Project;
  },

  async update(id: number, updates: Partial<Project>): Promise<Project | null> {
    const setClauses = Object.keys(updates).map(key => `${key} = :${key}`).join(', ');
    const result = await db.query(
      `UPDATE PROJECTS SET ${setClauses} WHERE id = :id RETURNING *`,
      { ...updates, id }
    );
    return result.rows[0] as Project || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM PROJECTS WHERE id = :id',
      { id }
    );
    return result.rowsAffected > 0;
  }
};
```

#### 3. 業務邏輯層 (Service Layer)
```typescript
// 檔案路徑: apps/web/src/services/projectService.ts
import { projectRepository } from '@/repositories/projectRepository';
import { userRepository } from '@/repositories/userRepository';
import { Project } from '@/lib/types';

export const getProjectsForUser = async (userId: number): Promise<Project[]> => {
  return await projectRepository.findByUserId(userId);
};

export const createProject = async (
  projectData: Omit<Project, 'id' | 'created_at'>, 
  createdBy: number
): Promise<Project> => {
  // 業務邏輯驗證
  if (!projectData.name || projectData.name.trim().length === 0) {
    throw new Error('專案名稱不能為空');
  }

  // 建立專案
  const project = await projectRepository.create(projectData);
  
  // 指派建立者為專案經理
  await userRepository.assignUserToProject(createdBy, project.id, 'PROJECT_MANAGER');
  
  return project;
};
```

### 認證與授權架構 (Authentication & Authorization Architecture)
使用 NextAuth.js 處理認證，並透過 Callbacks 將使用者角色資訊注入 Session Token，以供後端進行授權判斷。

```typescript
// 檔案路徑: apps/web/src/lib/auth.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { userRepository } from '@/repositories/userRepository';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await userRepository.findByUsername(credentials.username as string);
        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string, 
          user.hashed_password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id.toString(),
          name: user.full_name,
          email: user.email,
          username: user.username
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.username = token.username;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  }
});
```