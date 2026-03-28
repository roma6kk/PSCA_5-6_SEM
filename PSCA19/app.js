const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

const controllersTable = {
    user: require('./controllers/userController')
};

const routesTable = require('./routes');

routesTable.forEach(route => {
    const { path, method, controller: ctrlName, action: actionName } = route;

    if (!controllersTable[ctrlName] || !controllersTable[ctrlName][actionName]) {
        console.error(`Ошибка конфигурации: Контроллер '${ctrlName}' или акция '${actionName}' не найдены для пути ${path}`);
        return;
    }

    app[method](path, (req, res) => {
        controllersTable[ctrlName][actionName](req, res);
    });
});

app.listen(PORT, () => {
    console.log(`Сервер приложения 19-01 запущен на http://localhost:${PORT}`);
    console.log('Таблица маршрутов загружена:', routesTable.length, 'маршрутов.');
});