const http = require('http');
const url = require('url');
const fs = require('fs');
const { Faculty, Pulpit, Subject, AuditoriumType, Auditorium, sequelize } = require('./models');

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify(data, null, 2));
}

function sendError(res, statusCode, errorCode, message) {
  sendJsonResponse(res, statusCode, { 
    error: errorCode, 
    message: message,
    timestamp: new Date().toISOString()
  });
}

function sendSuccess(res, data) {
  sendJsonResponse(res, 200, data);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        if (!body) {
          resolve(null);
        } else {
          resolve(JSON.parse(body));
        }
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function handleGetRequests(req, res, pathname) {
  try {
    if (pathname === '/') {
      let html = fs.readFileSync('./18-01.html');
      res.writeHead(200, { 
        'Content-Type': 'text/html; charset=utf-8'
      });
      res.end(html);
      return;
    }

    let data;
    
    switch (pathname) {
      case '/api/faculties':
        const faculties = await Faculty.findAll({
          attributes: ['FACULTY', 'FACULTY_NAME']
        });
        data = faculties.map(f => ({
          faculty: f.FACULTY,
          faculty_name: f.FACULTY_NAME
        }));
        sendSuccess(res, { 
          count: data.length,
          data: data 
        });
        break;

      case '/api/pulpits':
        const pulpits = await Pulpit.findAll({
          attributes: ['PULPIT', 'PULPIT_NAME', 'FACULTY'],
          include: [{
            model: Subject,
            as: 'subjects',
            attributes: ['SUBJECT', 'SUBJECT_NAME', 'PULPIT']
          }]
        });
        data = pulpits.map(p => {
          const pulpitData = {
            pulpit: p.PULPIT,
            pulpit_name: p.PULPIT_NAME,
            faculty: p.FACULTY
          };
          
          if (p.subjects && p.subjects.length > 0) {
            pulpitData.subjects = p.subjects.map(s => ({
              subject: s.SUBJECT,
              subject_name: s.SUBJECT_NAME,
              pulpit: s.PULPIT
            }));
          } else {
            pulpitData.subjects = [];
          }
          
          return pulpitData;
        });

        sendSuccess(res, { 
          count: data.length,
          data: data 
        });
        break;

      case '/api/subjects':
        const subjects = await Subject.findAll({
          attributes: ['SUBJECT', 'SUBJECT_NAME', 'PULPIT']
        });
        data = subjects.map(s => ({
          subject: s.SUBJECT,
          subject_name: s.SUBJECT_NAME,
          pulpit: s.PULPIT
        }));
        sendSuccess(res, { 
          count: data.length,
          data: data 
        });
        break;

      case '/api/auditoriumstypes':
        const auditoriumTypes = await AuditoriumType.findAll({
          attributes: ['AUDITORIUM_TYPE', 'AUDITORIUM_TYPENAME']
        });
        data = auditoriumTypes.map(at => ({
          auditorium_type: at.AUDITORIUM_TYPE,
          auditorium_typename: at.AUDITORIUM_TYPENAME
        }));
        sendSuccess(res, { 
          count: data.length,
          data: data 
        });
        break;

      case '/api/auditoriums':
        const auditoriums = await Auditorium.findAll({
          attributes: ['AUDITORIUM', 'AUDITORIUM_NAME', 'AUDITORIUM_CAPACITY', 'AUDITORIUM_TYPE']
        });
        data = auditoriums.map(a => ({
          auditorium: a.AUDITORIUM,
          auditorium_name: a.AUDITORIUM_NAME,
          auditorium_capacity: a.AUDITORIUM_CAPACITY,
          auditorium_type: a.AUDITORIUM_TYPE
        }));
        sendSuccess(res, { 
          count: data.length,
          data: data 
        });
        break;

      default:
        sendError(res, 404, 'NOT_FOUND', 'Ресурс не найден');
    }
  } catch (err) {
    console.error('GET Error:', err);
    sendError(res, 500, 'GET_ERROR', 'Ошибка при получении данных: ' + err.message);
  }
}

async function handlePostRequests(req, res, pathname) {
  try {
    const data = await parseBody(req);
    
    if (!data) {
      sendError(res, 400, 'BAD_REQUEST', 'Тело запроса пустое');
      return;
    }

    let missingFields = [];
    let result;
    
    switch (pathname) {
      case '/api/faculties':
        if (!data.faculty) missingFields.push('faculty');
        if (!data.faculty_name) missingFields.push('faculty_name');
        
        if (missingFields.length > 0) {
          sendError(res, 400, 'VALIDATION_ERROR', `Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
          return;
        }
        
        try {
          result = await Faculty.create({
            FACULTY: data.faculty,
            FACULTY_NAME: data.faculty_name
          });
          sendJsonResponse(res, 201, {
            faculty: result.FACULTY,
            faculty_name: result.FACULTY_NAME,
            message: 'Факультет успешно создан'
          });
        } catch (err) {
          if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError') {
            sendError(res, 409, 'CONFLICT', 'Факультет с таким кодом уже существует');
          } else {
            throw err;
          }
        }
        break;

      case '/api/pulpits':
        if (!data.pulpit) missingFields.push('pulpit');
        if (!data.pulpit_name) missingFields.push('pulpit_name');
        if (!data.faculty) missingFields.push('faculty');
        
        if (missingFields.length > 0) {
          sendError(res, 400, 'VALIDATION_ERROR', `Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
          return;
        }
        
        const facultyExists = await Faculty.findByPk(data.faculty);
        if (!facultyExists) {
          sendError(res, 404, 'PARENT_NOT_FOUND', 'Указанный факультет не существует');
          return;
        }
        
        try {
          result = await Pulpit.create({
            PULPIT: data.pulpit,
            PULPIT_NAME: data.pulpit_name,
            FACULTY: data.faculty
          });
          sendJsonResponse(res, 201, {
            pulpit: result.PULPIT,
            pulpit_name: result.PULPIT_NAME,
            faculty: result.FACULTY,
            message: 'Кафедра успешно создана'
          });
        } catch (err) {
          if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError') {
            sendError(res, 409, 'CONFLICT', 'Кафедра с таким кодом уже существует');
          } else {
            throw err;
          }
        }
        break;

      case '/api/subjects':
        if (!data.subject) missingFields.push('subject');
        if (!data.subject_name) missingFields.push('subject_name');
        if (!data.pulpit) missingFields.push('pulpit');
        
        if (missingFields.length > 0) {
          sendError(res, 400, 'VALIDATION_ERROR', `Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
          return;
        }
        
        const pulpitExists = await Pulpit.findByPk(data.pulpit);
        if (!pulpitExists) {
          sendError(res, 404, 'PARENT_NOT_FOUND', 'Указанная кафедра не существует');
          return;
        }
        
        try {
          result = await Subject.create({
            SUBJECT: data.subject,
            SUBJECT_NAME: data.subject_name,
            PULPIT: data.pulpit
          });
          sendJsonResponse(res, 201, {
            subject: result.SUBJECT,
            subject_name: result.SUBJECT_NAME,
            pulpit: result.PULPIT,
            message: 'Дисциплина успешно создана'
          });
        } catch (err) {
          if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError') {
            sendError(res, 409, 'CONFLICT', 'Дисциплина с таким кодом уже существует');
          } else {
            throw err;
          }
        }
        break;

      case '/api/auditoriumstypes':
        if (!data.auditorium_type) missingFields.push('auditorium_type');
        if (!data.auditorium_typename) missingFields.push('auditorium_typename');
        
        if (missingFields.length > 0) {
          sendError(res, 400, 'VALIDATION_ERROR', `Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
          return;
        }
        
        try {
          result = await AuditoriumType.create({
            AUDITORIUM_TYPE: data.auditorium_type,
            AUDITORIUM_TYPENAME: data.auditorium_typename
          });
          sendJsonResponse(res, 201, {
            auditorium_type: result.AUDITORIUM_TYPE,
            auditorium_typename: result.AUDITORIUM_TYPENAME,
            message: 'Тип аудитории успешно создан'
          });
        } catch (err) {
          if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError') {
            sendError(res, 409, 'CONFLICT', 'Тип аудитории с таким кодом уже существует');
          } else {
            throw err;
          }
        }
        break;

      case '/api/auditoriums':
        if (!data.auditorium) missingFields.push('auditorium');
        if (!data.auditorium_name) missingFields.push('auditorium_name');
        if (!data.auditorium_capacity) missingFields.push('auditorium_capacity');
        if (!data.auditorium_type) missingFields.push('auditorium_type');
        
        if (missingFields.length > 0) {
          sendError(res, 400, 'VALIDATION_ERROR', `Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
          return;
        }
        
        const auditoriumTypeExists = await AuditoriumType.findByPk(data.auditorium_type);
        if (!auditoriumTypeExists) {
          sendError(res, 404, 'PARENT_NOT_FOUND', 'Указанный тип аудитории не существует');
          return;
        }
        
        try {
          result = await Auditorium.create({
            AUDITORIUM: data.auditorium,
            AUDITORIUM_NAME: data.auditorium_name,
            AUDITORIUM_CAPACITY: data.auditorium_capacity,
            AUDITORIUM_TYPE: data.auditorium_type
          });
          sendJsonResponse(res, 201, {
            auditorium: result.AUDITORIUM,
            auditorium_name: result.AUDITORIUM_NAME,
            auditorium_capacity: result.AUDITORIUM_CAPACITY,
            auditorium_type: result.AUDITORIUM_TYPE,
            message: 'Аудитория успешно создана'
          });
        } catch (err) {
          if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError') {
            sendError(res, 409, 'CONFLICT', 'Аудитория с таким кодом уже существует');
          } else {
            throw err;
          }
        }
        break;

      default:
        sendError(res, 404, 'NOT_FOUND', 'Ресурс не найден');
    }
  } catch (err) {
    console.error('POST Error:', err);
    
    if (err.name === 'SyntaxError') {
      sendError(res, 400, 'INVALID_JSON', 'Неверный формат JSON');
    } else if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError') {
      sendError(res, 409, 'CONFLICT', err.message || 'Конфликт данных');
    } else {
      sendError(res, 500, 'INTERNAL_ERROR', 'Ошибка при создании записи: ' + err.message);
    }
  }
}

async function handlePutRequests(req, res, pathname) {
  try {
    const data = await parseBody(req);
    
    if (!data) {
      sendError(res, 400, 'BAD_REQUEST', 'Тело запроса пустое');
      return;
    }

    let result;
    
    switch (pathname) {
      case '/api/faculties':
        if (!data.faculty) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Поле faculty обязательно');
          return;
        }
        
        const faculty = await Faculty.findByPk(data.faculty);
        if (!faculty) {
          sendError(res, 404, 'NOT_FOUND', 'Факультет не найден');
          return;
        }
        
        if (!data.faculty_name) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Поле faculty_name обязательно');
          return;
        }
        
        await faculty.update({
          FACULTY_NAME: data.faculty_name
        });
        
        sendSuccess(res, {
          faculty: faculty.FACULTY,
          faculty_name: faculty.FACULTY_NAME,
          message: 'Факультет успешно обновлен'
        });
        break;

      case '/api/pulpits':
        if (!data.pulpit) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Поле pulpit обязательно');
          return;
        }
        
        const pulpit = await Pulpit.findByPk(data.pulpit);
        if (!pulpit) {
          sendError(res, 404, 'NOT_FOUND', 'Кафедра не найдена');
          return;
        }
        
        if (data.faculty) {
          const newFacultyExists = await Faculty.findByPk(data.faculty);
          if (!newFacultyExists) {
            sendError(res, 404, 'PARENT_NOT_FOUND', 'Указанный факультет не существует');
            return;
          }
        }
        
        const pulpitUpdates = {};
        if (data.pulpit_name) pulpitUpdates.PULPIT_NAME = data.pulpit_name;
        if (data.faculty) pulpitUpdates.FACULTY = data.faculty;
        
        if (Object.keys(pulpitUpdates).length === 0) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Нет данных для обновления');
          return;
        }
        
        await pulpit.update(pulpitUpdates);
        
        sendSuccess(res, {
          pulpit: pulpit.PULPIT,
          pulpit_name: pulpit.PULPIT_NAME,
          faculty: pulpit.FACULTY,
          message: 'Кафедра успешно обновлена'
        });
        break;

      case '/api/subjects':
        if (!data.subject) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Поле subject обязательно');
          return;
        }
        
        const subject = await Subject.findByPk(data.subject);
        if (!subject) {
          sendError(res, 404, 'NOT_FOUND', 'Предмет не найден');
          return;
        }
        
        if (data.pulpit) {
          const newPulpitExists = await Pulpit.findByPk(data.pulpit);
          if (!newPulpitExists) {
            sendError(res, 404, 'PARENT_NOT_FOUND', 'Указанная кафедра не существует');
            return;
          }
        }
        
        const subjectUpdates = {};
        if (data.subject_name) subjectUpdates.SUBJECT_NAME = data.subject_name;
        if (data.pulpit) subjectUpdates.PULPIT = data.pulpit;
        
        if (Object.keys(subjectUpdates).length === 0) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Нет данных для обновления');
          return;
        }
        
        await subject.update(subjectUpdates);
        
        sendSuccess(res, {
          subject: subject.SUBJECT,
          subject_name: subject.SUBJECT_NAME,
          pulpit: subject.PULPIT,
          message: 'Предмет успешно обновлен'
        });
        break;

      case '/api/auditoriumstypes':
        if (!data.auditorium_type) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Поле auditorium_type обязательно');
          return;
        }
        
        const auditoriumType = await AuditoriumType.findByPk(data.auditorium_type);
        if (!auditoriumType) {
          sendError(res, 404, 'NOT_FOUND', 'Тип аудитории не найден');
          return;
        }
        
        if (!data.auditorium_typename) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Поле auditorium_typename обязательно');
          return;
        }
        
        await auditoriumType.update({
          AUDITORIUM_TYPENAME: data.auditorium_typename
        });
        
        sendSuccess(res, {
          auditorium_type: auditoriumType.AUDITORIUM_TYPE,
          auditorium_typename: auditoriumType.AUDITORIUM_TYPENAME,
          message: 'Тип аудитории успешно обновлен'
        });
        break;

      case '/api/auditoriums':
        if (!data.auditorium) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Поле auditorium обязательно');
          return;
        }
        
        const auditorium = await Auditorium.findByPk(data.auditorium);
        if (!auditorium) {
          sendError(res, 404, 'NOT_FOUND', 'Аудитория не найдена');
          return;
        }
        
        if (data.auditorium_type) {
          const newTypeExists = await AuditoriumType.findByPk(data.auditorium_type);
          if (!newTypeExists) {
            sendError(res, 404, 'PARENT_NOT_FOUND', 'Указанный тип аудитории не существует');
            return;
          }
        }
        
        const auditoriumUpdates = {};
        if (data.auditorium_name) auditoriumUpdates.AUDITORIUM_NAME = data.auditorium_name;
        if (data.auditorium_capacity !== undefined) auditoriumUpdates.AUDITORIUM_CAPACITY = data.auditorium_capacity;
        if (data.auditorium_type) auditoriumUpdates.AUDITORIUM_TYPE = data.auditorium_type;
        
        if (Object.keys(auditoriumUpdates).length === 0) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Нет данных для обновления');
          return;
        }
        
        await auditorium.update(auditoriumUpdates);
        
        sendSuccess(res, {
          auditorium: auditorium.AUDITORIUM,
          auditorium_name: auditorium.AUDITORIUM_NAME,
          auditorium_capacity: auditorium.AUDITORIUM_CAPACITY,
          auditorium_type: auditorium.AUDITORIUM_TYPE,
          message: 'Аудитория успешно обновлена'
        });
        break;

      default:
        sendError(res, 404, 'NOT_FOUND', 'Ресурс не найден');
    }
  } catch (err) {
    console.error('PUT Error:', err);
    
    if (err.name === 'SyntaxError') {
      sendError(res, 400, 'INVALID_JSON', 'Неверный формат JSON');
    } else {
      sendError(res, 500, 'INTERNAL_ERROR', 'Ошибка при обновлении записи: ' + err.message);
    }
  }
}

async function handleDeleteRequests(req, res, pathname) {
  try {
    const pathParts = pathname.split('/');
    const id = decodeURIComponent(pathParts[pathParts.length - 1]);
    
    if (!id || id === 'api') {
      sendError(res, 400, 'BAD_REQUEST', 'Не указан идентификатор для удаления');
      return;
    }

    let entity, entityName;
    
    if (pathname.startsWith('/api/faculties/')) {
      entity = await Faculty.findByPk(id);
      entityName = 'факультет';
    } 
    else if (pathname.startsWith('/api/pulpits/')) {
      entity = await Pulpit.findByPk(id);
      entityName = 'кафедра';
    } 
    else if (pathname.startsWith('/api/subjects/')) {
      entity = await Subject.findByPk(id);
      entityName = 'предмет';
    } 
    else if (pathname.startsWith('/api/auditoriumstypes/')) {
      entity = await AuditoriumType.findByPk(id);
      entityName = 'тип аудитории';
    } 
    else if (pathname.startsWith('/api/auditoriums/')) {
      entity = await Auditorium.findByPk(id);
      entityName = 'аудитория';
    } 
    else {
      sendError(res, 404, 'NOT_FOUND', 'Ресурс не найден');
      return;
    }

    if (!entity) {
      sendError(res, 404, 'NOT_FOUND', `${entityName} не найден`);
      return;
    }

    try {
      const entityData = entity.toJSON();
      await entity.destroy();
      
      sendSuccess(res, {
        ...entityData,
        message: `${entityName} успешно удален`
      });
    } catch (deleteErr) {
      if (deleteErr.name === 'SequelizeForeignKeyConstraintError') {
        sendError(res, 409, 'CONFLICT', `Нельзя удалить ${entityName}, так как на него есть ссылки`);
      } else {
        throw deleteErr;
      }
    }

  } catch (err) {
    console.error('DELETE Error:', err);
    
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      sendError(res, 409, 'CONFLICT', err.message);
    } else {
      sendError(res, 500, 'INTERNAL_ERROR', 'Ошибка при удалении записи: ' + err.message);
    }
  }
}

async function http_handler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`${req.method} ${pathname}`);

  try {
    if (req.method === 'GET') {
      await handleGetRequests(req, res, pathname);
    }
    else if (req.method === 'POST') {
      await handlePostRequests(req, res, pathname);
    }
    else if (req.method === 'PUT') {
      await handlePutRequests(req, res, pathname);
    }
    else if (req.method === 'DELETE') {
      await handleDeleteRequests(req, res, pathname);
    }
    else {
      sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Метод не поддерживается');
    }
  } catch (err) {
    console.error('Unhandled error:', err);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Внутренняя ошибка сервера');
  }
}

async function init() {
  try {
    await sequelize.authenticate();
    console.log('SQL Server connection established via Sequelize');
    
    const server = http.createServer(http_handler);
    
    server.listen(3000, () => {
      console.log('Server running at http://localhost:3000/');
      console.log('Available endpoints:');
      console.log('  GET    /');
      console.log('  GET    /api/faculties');
      console.log('  GET    /api/pulpits');
      console.log('  GET    /api/subjects');
      console.log('  GET    /api/auditoriumstypes');
      console.log('  GET    /api/auditoriums');
      console.log('  POST   /api/faculties');
      console.log('  POST   /api/pulpits');
      console.log('  POST   /api/subjects');
      console.log('  POST   /api/auditoriumstypes');
      console.log('  POST   /api/auditoriums');
      console.log('  PUT    /api/faculties');
      console.log('  PUT    /api/pulpits');
      console.log('  PUT    /api/subjects');
      console.log('  PUT    /api/auditoriumstypes');
      console.log('  PUT    /api/auditoriums');
      console.log('  DELETE /api/faculties/:id');
      console.log('  DELETE /api/pulpits/:id');
      console.log('  DELETE /api/subjects/:id');
      console.log('  DELETE /api/auditoriumstypes/:id');
      console.log('  DELETE /api/auditoriums/:id');
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error('Port 3000 is already in use');
      }
    });

    process.once('SIGTERM', async () => {
      await sequelize.close();
      process.exit(0);
    });
    process.once('SIGINT', async () => {
      await sequelize.close();
      process.exit(0);
    });

  } catch (err) {
    console.error('init() error: ' + err.message);
    process.exit(1);
  }
}

init();
