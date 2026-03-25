fetch('http://localhost:3030/api/chat?role=employee', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { id: '1', role: 'user', parts: [{ type: 'text', text: '我要申请打车报销，大概85块钱，事由是拜访客户' }] }
    ]
  })
}).then(async res => {
  console.log('STATUS:', res.status);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    process.stdout.write(decoder.decode(value));
  }
}).catch(err => console.error(err));
