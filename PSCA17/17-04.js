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
    
    console.log('10000 операций hset');
    const startHset = Date.now();
    
    const hsetPromises = [];
    for (let n = 1; n <= 10000; n++) {
      hsetPromises.push(client.hSet(n.toString(), 'data', JSON.stringify({id: n, val: `val-${n}`})));
    }
    await Promise.all(hsetPromises);
    
    const endHset = Date.now();
    console.log(`hset: ${endHset - startHset} мс`);
    
    console.log('\n10000 операций hget');
    const startHget = Date.now();
    
    const hgetPromises = [];
    for (let n = 1; n <= 10000; n++) {
      hgetPromises.push(client.hGet(n.toString(), 'data'));
    }
    await Promise.all(hgetPromises);
    
    const endHget = Date.now();
    console.log(`hget: ${endHget - startHget} мс`);
    
    console.log('\nзакрываем соединение');
    await client.quit();
  })
  .catch((err) => {
    console.error('ошибка подключения:', err);
  });