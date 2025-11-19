const fetch = require('node-fetch');

async function addTestNotice() {
  try {
    const response = await fetch('http://localhost:5011/api/notices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Library Maintenance',
        description: 'The library will be closed tomorrow for maintenance work. Please make alternative arrangements for your study needs.',
        date: '2025-11-18',
        semester: ['5'],
        department: ['CS'],
        createdBy: 'Admin'
      })
    });

    const result = await response.json();
    console.log('Test notice creation result:', result);
  } catch (error) {
    console.error('Error creating test notice:', error);
  }
}

addTestNotice();