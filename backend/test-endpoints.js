async function runTests() {
  const baseUrl = 'http://localhost:43000/api';
  console.log('🚀 Starting integration tests for Smile Saviours REST APIs...');

  try {
    // 1. Test Login
    console.log('\n--- 1. Testing Auth Login ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@smile.com',
        password: 'password'
      })
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}`);
    }

    const loginData = await loginRes.json();
    console.log('✅ Login Successful!');
    console.log(`User: ${loginData.user.firstName} ${loginData.user.lastName} (${loginData.user.role})`);
    console.log(`Clinic: ${loginData.tenantName}`);
    
    const token = loginData.accessToken;

    // 2. Test Get Me Profile
    console.log('\n--- 2. Testing Get Profile (/auth/me) ---');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!meRes.ok) {
      throw new Error(`Get Profile failed with status ${meRes.status}`);
    }

    const meData = await meRes.json();
    console.log('✅ Get Profile Successful!');
    console.log(`Verified Email: ${meData.user.email}`);

    // 3. Test Patients Listing
    console.log('\n--- 3. Testing Patient Listing (/patients) ---');
    const patientsRes = await fetch(`${baseUrl}/patients`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!patientsRes.ok) {
      throw new Error(`Get Patients failed with status ${patientsRes.status}`);
    }

    const patients = await patientsRes.json();
    console.log('✅ Patients List Retrieved Successfully!');
    console.log(`Count: ${patients.length} patients found.`);
    patients.forEach((p, i) => {
      console.log(`  Patient ${i + 1}: ${p.firstName} ${p.lastName} (Phone: ${p.phone})`);
    });

    // 4. Test Appointments Listing
    console.log('\n--- 4. Testing Appointments Listing (/appointments) ---');
    const apptsRes = await fetch(`${baseUrl}/appointments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!apptsRes.ok) {
      throw new Error(`Get Appointments failed with status ${apptsRes.status}`);
    }

    const appts = await apptsRes.json();
    console.log('✅ Appointments List Retrieved Successfully!');
    console.log(`Count: ${appts.length} bookings found.`);
    appts.forEach((a, i) => {
      console.log(`  Booking ${i + 1}: ${a.patientFirstName} ${a.patientLastName} with Dr. ${a.dentistLastName} at ${a.startTime} (${a.status})`);
    });

    // 5. Test Dashboard Stats
    console.log('\n--- 5. Testing Dashboard Stats (/dashboard/stats) ---');
    const statsRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!statsRes.ok) {
      throw new Error(`Get Dashboard Stats failed with status ${statsRes.status}`);
    }

    const stats = await statsRes.json();
    console.log('✅ Dashboard Stats Retrieved Successfully!');
    console.log(`Total Patients: ${stats.totalPatients}`);
    console.log(`Today's Appointments: ${stats.todayAppointments}`);
    console.log(`Total Paid Revenue: $${stats.totalRevenue}`);
    console.log(`Outstanding Balance: $${stats.outstandingBills}`);

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! No bugs detected.');
  } catch (error) {
    console.error('❌ Integration test failed with error:', error.message);
    process.exit(1);
  }
}

runTests();
