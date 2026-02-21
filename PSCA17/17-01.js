const redis = require('redis');

const client = redis.createClient({
  socket: {
    host: 'redis-17276.c283.us-east-1-4.ec2.cloud.redislabs.com',
    port: 17276
  },
  password: '2yRr1zrDX1qqeLYJfdFu6ORRc6PpMreo'
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

client.on('error', (err) => {
  console.error('Redis connection error:', err);
});

async function testRedisDB() {
  try {
    await client.connect();
    
    await client.set('test_key', 'test_value');
    console.log('SET operation successful');
    
    const value = await client.get('test_key');
    console.log('GET operation result:', value);
    
    const exists = await client.exists('test_key');
    console.log('Key exists:', exists === 1);
    
    await client.del('test_key');
    console.log('DELETE operation successful');
    
    const deletedValue = await client.get('test_key');
    console.log('Value after deletion:', deletedValue);
    
    console.log('All Redis tests completed successfully');
    
  } catch (error) {
    console.error('Redis test error:', error);
  } finally {
    await client.quit();
    console.log('Redis connection closed');
  }
}

testRedisDB();