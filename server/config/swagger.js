const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API EcoVigia',
      version: '1.0.0',
      description: 'API para gerenciamento de denúncias de descarte irregular de resíduos',
      contact: {
        name: 'Suporte da Equipe 11',
        email: 'inova-equipe11@gmail.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../index.js')
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 