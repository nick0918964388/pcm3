#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

class DatabaseSeeder {
  constructor() {
    this.config = {
      user: process.env.DB_USER || 'pcm_user',
      password: process.env.DB_PASSWORD || 'pcm_password',
      connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/xe',
    };
  }

  async executeSqlFile(connection, filePath) {
    console.log(`Executing SQL file: ${filePath}`);
    
    try {
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Split SQL content by statements (simple approach - may need refinement for complex SQL)
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'COMMIT');

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        if (statement.toUpperCase().includes('SELECT') && statement.toUpperCase().includes('UNION ALL')) {
          // This is the verification query at the end
          try {
            const result = await connection.execute(statement);
            console.log('\n=== Database Verification Results ===');
            if (result.rows) {
              result.rows.forEach(row => {
                console.log(`${row[0]}: ${row[1]} records`);
              });
            }
            successCount++;
          } catch (error) {
            console.warn(`Verification query failed (this may be normal): ${error.message}`);
          }
          continue;
        }

        try {
          await connection.execute(statement);
          successCount++;
        } catch (error) {
          if (error.message.includes('ORA-00942') || error.message.includes('does not exist')) {
            // Table doesn't exist - this is expected for DROP statements
            console.log(`Skipping DROP statement for non-existent object`);
          } else if (error.message.includes('ORA-00001') || error.message.includes('unique constraint')) {
            // Unique constraint violation - data might already exist
            console.warn(`Skipping duplicate data: ${error.message.split('\n')[0]}`);
          } else {
            console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
            console.error(`Error: ${error.message}`);
            errorCount++;
          }
        }
      }

      await connection.commit();
      console.log(`\nFile execution completed: ${successCount} successful, ${errorCount} errors`);
      
      return { successCount, errorCount };
      
    } catch (error) {
      console.error(`Failed to read or execute SQL file: ${error.message}`);
      throw error;
    }
  }

  async createSchema() {
    const schemaPath = path.join(__dirname, 'create-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    let connection;
    try {
      connection = await oracledb.getConnection(this.config);
      console.log('Connected to Oracle database for schema creation');
      
      const result = await this.executeSqlFile(connection, schemaPath);
      console.log('✅ Database schema created successfully');
      
      return result;
      
    } catch (error) {
      console.error('❌ Failed to create database schema:', error.message);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('Error closing connection:', closeError.message);
        }
      }
    }
  }

  async seedData() {
    const seedPath = path.join(__dirname, 'seed-data.sql');
    
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found: ${seedPath}`);
    }

    let connection;
    try {
      connection = await oracledb.getConnection(this.config);
      console.log('Connected to Oracle database for data seeding');
      
      const result = await this.executeSqlFile(connection, seedPath);
      console.log('✅ Database seeded successfully');
      
      return result;
      
    } catch (error) {
      console.error('❌ Failed to seed database:', error.message);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('Error closing connection:', closeError.message);
        }
      }
    }
  }

  async verifyData() {
    let connection;
    try {
      connection = await oracledb.getConnection(this.config);
      console.log('\n=== Verifying Test User Accounts ===');
      
      // Check test users
      const userResult = await connection.execute(`
        SELECT u.username, u.full_name, u.email 
        FROM USERS u 
        ORDER BY u.id
      `);
      
      console.log('Test User Accounts:');
      userResult.rows.forEach(row => {
        console.log(`  - ${row[0]} (${row[1]}) - ${row[2]}`);
      });

      // Check projects
      const projectResult = await connection.execute(`
        SELECT p.code, p.name, p.status 
        FROM PROJECTS p 
        ORDER BY p.id
      `);
      
      console.log('\nTest Projects:');
      projectResult.rows.forEach(row => {
        console.log(`  - ${row[0]}: ${row[1]} (${row[2]})`);
      });

      // Check user-role assignments
      const roleResult = await connection.execute(`
        SELECT u.username, r.name as role_name, p.code as project_code
        FROM USER_ROLES ur
        JOIN USERS u ON ur.user_id = u.id
        JOIN ROLES r ON ur.role_id = r.id
        LEFT JOIN PROJECTS p ON ur.project_id = p.id
        ORDER BY u.username, r.name
      `);
      
      console.log('\nUser Role Assignments:');
      roleResult.rows.forEach(row => {
        const project = row[2] ? ` (Project: ${row[2]})` : ' (Global)';
        console.log(`  - ${row[0]}: ${row[1]}${project}`);
      });

      console.log('\n✅ Data verification completed');
      
    } catch (error) {
      console.error('❌ Data verification failed:', error.message);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('Error closing connection:', closeError.message);
        }
      }
    }
  }

  async run() {
    console.log('🚀 Starting PCM Database Setup...');
    console.log(`Database: ${this.config.connectString}`);
    console.log(`User: ${this.config.user}`);
    
    try {
      // Step 1: Create schema
      console.log('\n📋 Step 1: Creating database schema...');
      await this.createSchema();
      
      // Step 2: Seed data
      console.log('\n🌱 Step 2: Seeding database...');
      await this.seedData();
      
      // Step 3: Verify data
      console.log('\n🔍 Step 3: Verifying seeded data...');
      await this.verifyData();
      
      console.log('\n🎉 Database setup completed successfully!');
      console.log('\n📝 Test Accounts (password: password123):');
      console.log('  - pm.chen (專案經理)');
      console.log('  - qc.wang (品管人員)');
      console.log('  - sup.lin (工地主任)');
      console.log('  - eng.lee (工程師)');
      console.log('  - safety.huang (安全管理員)');
      console.log('  - admin (系統管理員)');
      
    } catch (error) {
      console.error('\n💥 Database setup failed:', error.message);
      process.exit(1);
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  const seeder = new DatabaseSeeder();
  
  switch (command) {
    case 'schema':
      await seeder.createSchema();
      break;
    case 'seed':
      await seeder.seedData();
      break;
    case 'verify':
      await seeder.verifyData();
      break;
    case 'reset':
    case 'all':
    default:
      await seeder.run();
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = DatabaseSeeder;