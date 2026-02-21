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
        
        console.log('10000 операций set');
        const startSet = Date.now();
        
        const setPromises = [];
        for (let n = 1; n <= 10000; n++) {
            setPromises.push(client.set(n.toString(), 'set' + n));
        }
        const setResults = await Promise.all(setPromises);
        
        const endSet = Date.now();
        console.log(`set: ${endSet - startSet} мс`);
        console.log('результаты set:', setResults.slice(0, 5));
        console.log('все set операции успешны:', setResults.every(r => r === 'OK'));
        
        console.log('\n10000 операций get');
        const startGet = Date.now();
        
        const getPromises = [];
        for (let n = 1; n <= 10000; n++) {
            getPromises.push(client.get(n.toString()));
        }
        const getResults = await Promise.all(getPromises);
        
        const endGet = Date.now();
        console.log(`get: ${endGet - startGet} мс`);
        console.log('результаты get:', getResults.slice(0, 5));
        console.log('всего получено значений:', getResults.filter(r => r !== null).length);        
        
        console.log('\n10000 операций del');
        const startDel = Date.now();
        
        const delPromises = [];
        for (let n = 1; n <= 10000; n++) {
            delPromises.push(client.del(n.toString()));
        }
        const delResults = await Promise.all(delPromises);
        
        const endDel = Date.now();
        console.log(`del: ${endDel - startDel} мс`);
        console.log('результаты del:', delResults.slice(0, 5));
        console.log('всего удалено записей:', delResults.reduce((sum, val) => sum + val, 0));    
        
        console.log('\nзакрываем соединение');
        await client.quit();
    })    
    .catch((err) => {
        console.error('ошибка подключения:', err);
    });