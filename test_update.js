const id = 'ACouYmopY7WSyWYvsZRbzUiLnnq2';
const payload = { coverImageUrl: 'test-cover-url' };

fetch(`http://localhost:3000/users/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => console.log('Updated user:', data))
.catch(err => console.error(err));
