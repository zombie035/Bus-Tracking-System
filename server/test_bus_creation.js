// Test script to diagnose bus creation issue
require('dotenv').config();
const { pool } = require('./config/db');
const Bus = require('./models/Bus');

async function testBusCreation() {
    console.log('\n🔍 DIAGNOSTIC TEST FOR BUS CREATION');
    console.log('=====================================\n');

    try {
        // Test 1: Database Connection
        console.log('1️⃣ Testing database connection...');
        const dbTest = await pool.query('SELECT NOW() as time, current_database() as db');
        console.log('✅ Connected to database:', dbTest.rows[0].db);
        console.log('   Server time:', dbTest.rows[0].time);

        // Test 2: Check buses table exists
        console.log('\n2️⃣ Checking if buses table exists...');
        const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'buses'
      );
    `);
        console.log('✅ Buses table exists:', tableCheck.rows[0].exists);

        // Test 3: Check current buses count
        console.log('\n3️⃣ Counting existing buses...');
        const countResult = await pool.query('SELECT COUNT(*) FROM buses');
        console.log('   Current buses in database:', countResult.rows[0].count);

        // Test 4: List existing buses
        console.log('\n4️⃣ Listing existing buses...');
        const buses = await Bus.find();
        console.log(`   Found ${buses.length} buses`);
        if (buses.length > 0) {
            buses.forEach(bus => {
                console.log(`   - ${bus.busNumber} (${bus.routeName})`);
            });
        }

        // Test 5: Create test bus
        console.log('\n5️⃣ Attempting to create test bus...');
        const testBusData = {
            busNumber: 'TEST-DIAG-' + Date.now(),
            routeName: 'Test Route',
            capacity: 50,
            status: 'active',
            driverId: null,
            latitude: 20.5937,
            longitude: 78.9629
        };

        console.log('   Test data:', testBusData);

        try {
            const createdBus = await Bus.create(testBusData);
            console.log('✅ Bus created successfully!');
            console.log('   Created bus:', createdBus);

            // Verify in database
            const verifyResult = await pool.query(
                'SELECT * FROM buses WHERE id = $1',
                [createdBus.id]
            );
            console.log('   Verified in database:', verifyResult.rows[0] ? 'YES' : 'NO');

        } catch (createError) {
            console.error('❌ Failed to create bus:', createError.message);
            console.error('   Error code:', createError.code);
            console.error('   Error detail:', createError.detail);
        }

        // Test 6: Check routes table (bus creation needs valid route)
        console.log('\n6️⃣ Checking routes table...');
        try {
            const routesCount = await pool.query('SELECT COUNT(*) FROM routes');
            console.log('   Routes in database:', routesCount.rows[0].count);

            if (parseInt(routesCount.rows[0].count) === 0) {
                console.log('   ⚠️  WARNING: No routes found! Bus creation may require valid routes.');
            }
        } catch (err) {
            console.log('   ⚠️  Routes table might not exist');
        }

    } catch (error) {
        console.error('\n❌ DIAGNOSTIC TEST FAILED');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        console.log('\n=====================================');
        console.log('Diagnostic test complete.\n');
        process.exit(0);
    }
}

testBusCreation();
