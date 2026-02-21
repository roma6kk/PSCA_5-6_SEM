import redis from 'redis';

const publisher = redis.createClient({
  socket: {
    host: 'redis-17276.c283.us-east-1-4.ec2.cloud.redislabs.com',
    port: 17276
  },
  password: '2yRr1zrDX1qqeLYJfdFu6ORRc6PpMreo'
});

const subscriber = redis.createClient({
  socket: {
    host: 'redis-17276.c283.us-east-1-4.ec2.cloud.redislabs.com',
    port: 17276
  },
  password: '2yRr1zrDX1qqeLYJfdFu6ORRc6PpMreo'
});

async function pubSubDemo() {
  await publisher.connect();
  await subscriber.connect();
  
  await subscriber.subscribe('news', (message) => {
    console.log(`Received: ${message}`);
  });
  
  console.log('Subscriber ready. Publishing messages...');
  
  setTimeout(() => publisher.publish('news', 'Hello World!'), 1000);
  setTimeout(() => publisher.publish('news', 'Redis PubSub works!'), 2000);
  setTimeout(() => publisher.publish('news', 'Final message'), 3000);
  
  setTimeout(async () => {
    await subscriber.unsubscribe('news');
    await publisher.quit();
    await subscriber.quit();
    console.log('Demo completed');
  }, 5000);
}

pubSubDemo().catch(console.error);

// getset - возвращает старое значение
// incr инициализировать не обязательно, если ключа нет, редис создаст, если есть - создает 0 и инкрементирует
// RDB(Redis Database File) - снапшоты, AOF(Append Of File) - журналирование операций 