const crypto = require('crypto');
const id = 'ACouYmopY7WSyWYvsZRbzUiLnnq2';
// 150kb base64 string
const base64String = 'data:image/jpeg;base64,' + crypto.randomBytes(150 * 1024).toString('base64');
const payload = { coverImageUrl: base64String };

fetch(`http://localhost:3000/users/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(async res => {
  if (!res.ok) {
    console.error('Failed!', res.status, await res.text());
  } else {
    console.log('Success!', (await res.json()).coverImageUrl.substring(0, 50));
  }
})
.catch(err => console.error(err));
