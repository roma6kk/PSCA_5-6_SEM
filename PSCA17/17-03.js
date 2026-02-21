import redis from 'redis';

const client = redis.createClient({
  socket: {
    host: 'redis-17276.c283.us-east-1-4.ec2.cloud.redislabs.com',
    port: 17276
  },
  password: '2yRr1zrDX1qqeLYJfdFu6ORRc6PpMreo'
});

client.on('connect', () => {
  console.log('connect');
});

client.on('ready', () => {
  console.log('ready');
});

client.on('error', (err) => {
  console.log('error: ', err.message);
});

client.on('end', () => {
  console.log('end');
});

client.connect()
  .then(async () => {
    console.log('успешное подключение');
    
    await client.set('incr', 0);
    
    console.log('10000 операций incr');
    const startIncr = Date.now();
    
    const incrPromises = [];
    for (let i = 0; i < 10000; i++) {
      incrPromises.push(client.incr('incr'));
    }
    await Promise.all(incrPromises);
    
    const endIncr = Date.now();
    console.log(`incr: ${endIncr - startIncr} мс`);
    
    console.log('\n10000 операций decr');
    const startDecr = Date.now();
    
    const decrPromises = [];
    for (let i = 0; i < 10000; i++) {
      decrPromises.push(client.decr('incr'));
    }
    await Promise.all(decrPromises);
    
    const endDecr = Date.now();
    console.log(`decr: ${endDecr - startDecr} мс`);
    
    console.log('\nзакрываем соединение');
    await client.quit();
  })
  .catch((err) => {
    console.error('ошибка подключения:', err);
  });