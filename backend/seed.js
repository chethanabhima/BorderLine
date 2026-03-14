async function seed() {
  try {
    const r1 = await fetch('http://127.0.0.1:5000/api/auth/register', { 
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'officer1', password: 'password123', role: 'border_control' })
    });
    console.log('Created Border Control user: officer1 / password123');
  } catch (e) {
    console.error(e.message);
  }

  try {
    const r2 = await fetch('http://127.0.0.1:5000/api/auth/register', { 
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'staff1', password: 'password123', role: 'humanitarian' })
    });
    console.log('Created Humanitarian staff: staff1 / password123');
  } catch(e) {
    console.error(e.message);
  }
}
seed();
