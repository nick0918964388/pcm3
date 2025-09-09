#!/usr/bin/env node

const DatabaseSeeder = require('./seed-runner');

class DataValidator extends DatabaseSeeder {
  constructor() {
    super();
  }

  async validateLoginAccounts() {
    console.log('\n🔐 Validating Login Accounts...');
    
    let connection;
    try {
      connection = await require('oracledb').getConnection(this.config);
      
      const testAccounts = [
        'pm.chen',
        'qc.wang', 
        'sup.lin',
        'eng.lee',
        'safety.huang',
        'pm.wu',
        'qc.chou',
        'admin'
      ];

      let validAccounts = 0;
      
      for (const username of testAccounts) {
        const result = await connection.execute(`
          SELECT u.id, u.username, u.full_name, u.email, u.hashed_password
          FROM USERS u 
          WHERE u.username = :username
        `, [username]);

        if (result.rows && result.rows.length > 0) {
          const user = result.rows[0];
          console.log(`  ✅ ${user[1]} (${user[2]}) - ${user[3]}`);
          
          // Validate password hash exists
          if (user[4] && user[4].length > 20) {
            console.log(`    🔑 Password hash valid`);
          } else {
            console.log(`    ❌ Invalid password hash`);
          }
          
          validAccounts++;
        } else {
          console.log(`  ❌ Account not found: ${username}`);
        }
      }

      console.log(`\n📊 Login Validation Summary: ${validAccounts}/${testAccounts.length} accounts valid`);
      return validAccounts === testAccounts.length;
      
    } catch (error) {
      console.error('❌ Login validation failed:', error.message);
      return false;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  async validateProjectData() {
    console.log('\n🏗️ Validating Project Data...');
    
    let connection;
    try {
      connection = await require('oracledb').getConnection(this.config);
      
      // Check project completeness
      const projectResult = await connection.execute(`
        SELECT p.id, p.code, p.name, p.status,
               COUNT(ur.id) as assigned_users,
               COUNT(wi.id) as wbs_items
        FROM PROJECTS p
        LEFT JOIN USER_ROLES ur ON p.id = ur.project_id
        LEFT JOIN WBS_ITEMS wi ON p.id = wi.project_id
        GROUP BY p.id, p.code, p.name, p.status
        ORDER BY p.id
      `);

      let validProjects = 0;
      
      if (projectResult.rows) {
        for (const project of projectResult.rows) {
          const [id, code, name, status, assignedUsers, wbsItems] = project;
          console.log(`  📋 Project: ${code} - ${name}`);
          console.log(`    Status: ${status}`);
          console.log(`    Assigned Users: ${assignedUsers}`);
          console.log(`    WBS Items: ${wbsItems}`);
          
          if (assignedUsers > 0 && wbsItems > 0) {
            console.log(`    ✅ Project data complete`);
            validProjects++;
          } else {
            console.log(`    ⚠️ Missing assigned users or WBS items`);
          }
        }
      }

      console.log(`\n📊 Project Validation Summary: ${validProjects} projects with complete data`);
      return validProjects > 0;
      
    } catch (error) {
      console.error('❌ Project validation failed:', error.message);
      return false;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  async validateDataIntegrity() {
    console.log('\n🔍 Validating Data Integrity...');
    
    let connection;
    try {
      connection = await require('oracledb').getConnection(this.config);
      
      const checks = [
        {
          name: 'User Role Integrity',
          query: `
            SELECT COUNT(*) as orphaned_count
            FROM USER_ROLES ur
            LEFT JOIN USERS u ON ur.user_id = u.id
            LEFT JOIN ROLES r ON ur.role_id = r.id
            WHERE u.id IS NULL OR r.id IS NULL
          `
        },
        {
          name: 'Personnel Integrity',
          query: `
            SELECT COUNT(*) as orphaned_count
            FROM PERSONNEL p
            LEFT JOIN SUBCONTRACTORS s ON p.subcontractor_id = s.id
            WHERE s.id IS NULL
          `
        },
        {
          name: 'WBS Items Integrity',
          query: `
            SELECT COUNT(*) as orphaned_count
            FROM WBS_ITEMS w
            LEFT JOIN PROJECTS p ON w.project_id = p.id
            WHERE p.id IS NULL
          `
        },
        {
          name: 'Daily Reports Integrity', 
          query: `
            SELECT COUNT(*) as orphaned_count
            FROM DAILY_REPORTS dr
            LEFT JOIN PROJECTS p ON dr.project_id = p.id
            LEFT JOIN USERS u ON dr.reported_by = u.id
            WHERE p.id IS NULL OR u.id IS NULL
          `
        }
      ];

      let allIntegrityChecksPass = true;
      
      for (const check of checks) {
        const result = await connection.execute(check.query);
        const orphanedCount = result.rows ? result.rows[0][0] : 0;
        
        if (orphanedCount === 0) {
          console.log(`  ✅ ${check.name}: PASS`);
        } else {
          console.log(`  ❌ ${check.name}: FAIL (${orphanedCount} orphaned records)`);
          allIntegrityChecksPass = false;
        }
      }

      console.log(`\n📊 Data Integrity Summary: ${allIntegrityChecksPass ? 'ALL CHECKS PASS' : 'SOME CHECKS FAILED'}`);
      return allIntegrityChecksPass;
      
    } catch (error) {
      console.error('❌ Data integrity validation failed:', error.message);
      return false;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  async validateBusinessRules() {
    console.log('\n📝 Validating Business Rules...');
    
    let connection;
    try {
      connection = await require('oracledb').getConnection(this.config);
      
      // Check that each project has at least one PM
      const pmResult = await connection.execute(`
        SELECT p.code, p.name,
               COUNT(ur.id) as pm_count
        FROM PROJECTS p
        LEFT JOIN USER_ROLES ur ON p.id = ur.project_id AND ur.role_id = (
          SELECT id FROM ROLES WHERE name = 'PM'
        )
        GROUP BY p.id, p.code, p.name
        HAVING COUNT(ur.id) = 0
      `);

      if (pmResult.rows && pmResult.rows.length > 0) {
        console.log(`  ⚠️ Projects without PM:`);
        pmResult.rows.forEach(row => {
          console.log(`    - ${row[0]}: ${row[1]}`);
        });
      } else {
        console.log(`  ✅ All projects have assigned PMs`);
      }

      // Check WBS hierarchy consistency
      const wbsResult = await connection.execute(`
        SELECT child.code, child.level_number, parent.level_number as parent_level
        FROM WBS_ITEMS child
        JOIN WBS_ITEMS parent ON child.parent_id = parent.id
        WHERE child.level_number <= parent.level_number
      `);

      if (wbsResult.rows && wbsResult.rows.length > 0) {
        console.log(`  ❌ WBS hierarchy inconsistency found:`);
        wbsResult.rows.forEach(row => {
          console.log(`    - ${row[0]}: level ${row[1]} should be > parent level ${row[2]}`);
        });
      } else {
        console.log(`  ✅ WBS hierarchy is consistent`);
      }

      // Check attendance hours are reasonable
      const attendanceResult = await connection.execute(`
        SELECT COUNT(*) as invalid_hours
        FROM ATTENDANCE
        WHERE hours_worked < 0 OR hours_worked > 24
      `);

      const invalidHours = attendanceResult.rows ? attendanceResult.rows[0][0] : 0;
      if (invalidHours === 0) {
        console.log(`  ✅ All attendance hours are valid`);
      } else {
        console.log(`  ❌ Found ${invalidHours} invalid attendance records`);
      }

      console.log(`\n📊 Business Rules Summary: Validation completed`);
      return true;
      
    } catch (error) {
      console.error('❌ Business rules validation failed:', error.message);
      return false;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  async runAllValidations() {
    console.log('🔬 Starting Comprehensive Data Validation...');
    console.log(`Database: ${this.config.connectString}`);
    console.log(`User: ${this.config.user}`);
    
    try {
      const results = {
        loginAccounts: await this.validateLoginAccounts(),
        projectData: await this.validateProjectData(), 
        dataIntegrity: await this.validateDataIntegrity(),
        businessRules: await this.validateBusinessRules()
      };

      console.log('\n📈 Final Validation Report:');
      console.log(`  Login Accounts: ${results.loginAccounts ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`  Project Data: ${results.projectData ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`  Data Integrity: ${results.dataIntegrity ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`  Business Rules: ${results.businessRules ? '✅ PASS' : '❌ FAIL'}`);

      const allPass = Object.values(results).every(result => result);
      
      if (allPass) {
        console.log('\n🎉 All validations passed! Seed data is ready for use.');
        console.log('\n💡 Next Steps:');
        console.log('  1. Test login functionality with the test accounts');
        console.log('  2. Verify project selection functionality');
        console.log('  3. Test role-based access permissions');
      } else {
        console.log('\n⚠️ Some validations failed. Please review the issues above.');
      }

      return allPass;
      
    } catch (error) {
      console.error('\n💥 Validation failed:', error.message);
      return false;
    }
  }
}

// Handle command line execution
if (require.main === module) {
  const validator = new DataValidator();
  
  validator.runAllValidations().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Validation script failed:', error.message);
    process.exit(1);
  });
}

module.exports = DataValidator;