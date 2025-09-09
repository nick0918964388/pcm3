import db from '@/lib/db';

describe('Database Connection Tests', () => {
  beforeAll(async () => {
    // Initialize database connection
    await db.initialize();
  });

  afterAll(async () => {
    // Close database connection
    await db.close();
  });

  describe('Database Health Check', () => {
    test('should connect to Oracle database successfully', async () => {
      const isHealthy = await db.checkHealth();
      expect(isHealthy).toBe(true);
    });

    test('should execute basic query', async () => {
      const result = await db.executeQuery('SELECT 1 as test_value FROM DUAL');
      expect(result.rows).toBeDefined();
      expect(result.rows).toHaveLength(1);
      expect((result.rows as any)[0].TEST_VALUE).toBe(1);
    });
  });

  describe('Schema Validation', () => {
    test('should have all required tables', async () => {
      const expectedTables = [
        'USERS',
        'PROJECTS', 
        'ROLES',
        'USER_ROLES',
        'SUBCONTRACTORS',
        'PERSONNEL',
        'WBS_ITEMS',
        'WBS_CHANGE_LOGS',
        'DAILY_REPORTS',
        'REPORT_ATTACHMENTS',
        'ANNOUNCEMENTS',
        'DUTY_ROSTERS',
        'ATTENDANCE'
      ];

      const result = await db.executeQuery(`
        SELECT table_name 
        FROM user_tables 
        WHERE table_name IN (${expectedTables.map(() => '?').join(',')})
        ORDER BY table_name
      `, expectedTables);

      expect(result.rows).toBeDefined();
      expect(result.rows).toHaveLength(expectedTables.length);
    });

    test('should have proper indexes', async () => {
      const result = await db.executeQuery(`
        SELECT index_name, table_name 
        FROM user_indexes 
        WHERE table_name IN ('USERS', 'PROJECTS', 'USER_ROLES')
        AND index_name LIKE 'IDX_%'
        ORDER BY table_name, index_name
      `);

      expect(result.rows).toBeDefined();
      expect((result.rows as any[]).length).toBeGreaterThan(0);
    });
  });

  describe('Seed Data Validation', () => {
    test('should have test users', async () => {
      const result = await db.executeQuery(`
        SELECT COUNT(*) as user_count 
        FROM USERS 
        WHERE username IN ('pm.chen', 'qc.wang', 'sup.lin', 'admin')
      `);

      expect(result.rows).toBeDefined();
      expect((result.rows as any)[0].USER_COUNT).toBeGreaterThanOrEqual(4);
    });

    test('should have test projects', async () => {
      const result = await db.executeQuery(`
        SELECT COUNT(*) as project_count 
        FROM PROJECTS
      `);

      expect(result.rows).toBeDefined();
      expect((result.rows as any)[0].PROJECT_COUNT).toBeGreaterThanOrEqual(3);
    });

    test('should have proper role assignments', async () => {
      const result = await db.executeQuery(`
        SELECT COUNT(*) as role_assignment_count 
        FROM USER_ROLES ur
        JOIN USERS u ON ur.user_id = u.id
        JOIN ROLES r ON ur.role_id = r.id
      `);

      expect(result.rows).toBeDefined();
      expect((result.rows as any)[0].ROLE_ASSIGNMENT_COUNT).toBeGreaterThan(0);
    });

    test('should have valid login credentials for test users', async () => {
      const testUsers = ['pm.chen', 'qc.wang', 'sup.lin', 'admin'];
      
      for (const username of testUsers) {
        const result = await db.executeQuery(`
          SELECT id, username, hashed_password, full_name 
          FROM USERS 
          WHERE username = ?
        `, [username]);

        expect(result.rows).toBeDefined();
        expect(result.rows).toHaveLength(1);
        
        const user = (result.rows as any)[0];
        expect(user.USERNAME).toBe(username);
        expect(user.HASHED_PASSWORD).toBeDefined();
        expect(user.HASHED_PASSWORD).not.toBe('');
        expect(user.FULL_NAME).toBeDefined();
      }
    });

    test('should have project data integrity', async () => {
      const result = await db.executeQuery(`
        SELECT p.id, p.code, p.name, p.status,
               COUNT(ur.id) as assigned_users
        FROM PROJECTS p
        LEFT JOIN USER_ROLES ur ON p.id = ur.project_id
        GROUP BY p.id, p.code, p.name, p.status
        HAVING COUNT(ur.id) > 0
        ORDER BY p.id
      `);

      expect(result.rows).toBeDefined();
      expect((result.rows as any[]).length).toBeGreaterThan(0);
      
      // Each project should have at least one assigned user
      (result.rows as any[]).forEach(project => {
        expect(project.ASSIGNED_USERS).toBeGreaterThan(0);
        expect(project.CODE).toBeDefined();
        expect(project.NAME).toBeDefined();
      });
    });

    test('should have hierarchical WBS structure', async () => {
      const result = await db.executeQuery(`
        SELECT 
          parent.code as parent_code,
          child.code as child_code,
          child.level_number
        FROM WBS_ITEMS parent
        JOIN WBS_ITEMS child ON parent.id = child.parent_id
        ORDER BY parent.code, child.sort_order
      `);

      expect(result.rows).toBeDefined();
      expect((result.rows as any[]).length).toBeGreaterThan(0);
      
      // Verify hierarchy levels
      (result.rows as any[]).forEach(item => {
        expect(item.LEVEL_NUMBER).toBeGreaterThan(1);
        expect(item.PARENT_CODE).toBeDefined();
        expect(item.CHILD_CODE).toBeDefined();
      });
    });

    test('should have personnel associated with subcontractors', async () => {
      const result = await db.executeQuery(`
        SELECT s.name as subcontractor_name,
               COUNT(p.id) as personnel_count
        FROM SUBCONTRACTORS s
        JOIN PERSONNEL p ON s.id = p.subcontractor_id
        GROUP BY s.id, s.name
        ORDER BY s.name
      `);

      expect(result.rows).toBeDefined();
      expect((result.rows as any[]).length).toBeGreaterThan(0);
      
      // Each subcontractor should have at least one personnel
      (result.rows as any[]).forEach(contractor => {
        expect(contractor.PERSONNEL_COUNT).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Relationships', () => {
    test('should maintain referential integrity for user roles', async () => {
      const result = await db.executeQuery(`
        SELECT ur.id
        FROM USER_ROLES ur
        LEFT JOIN USERS u ON ur.user_id = u.id
        LEFT JOIN ROLES r ON ur.role_id = r.id
        LEFT JOIN PROJECTS p ON ur.project_id = p.id
        WHERE u.id IS NULL OR r.id IS NULL OR (ur.project_id IS NOT NULL AND p.id IS NULL)
      `);

      expect(result.rows).toBeDefined();
      expect(result.rows).toHaveLength(0); // No orphaned records
    });

    test('should maintain referential integrity for personnel', async () => {
      const result = await db.executeQuery(`
        SELECT p.id
        FROM PERSONNEL p
        LEFT JOIN SUBCONTRACTORS s ON p.subcontractor_id = s.id
        WHERE s.id IS NULL
      `);

      expect(result.rows).toBeDefined();
      expect(result.rows).toHaveLength(0); // No orphaned personnel
    });

    test('should maintain referential integrity for WBS items', async () => {
      const result = await db.executeQuery(`
        SELECT w.id
        FROM WBS_ITEMS w
        LEFT JOIN PROJECTS p ON w.project_id = p.id
        WHERE p.id IS NULL
      `);

      expect(result.rows).toBeDefined();
      expect(result.rows).toHaveLength(0); // No orphaned WBS items
    });
  });
});