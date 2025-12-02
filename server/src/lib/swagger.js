/**
 * Swagger API Documentation Configuration
 * Automatically generates OpenAPI documentation from JSDoc comments
 * 
 * Access documentation at: http://localhost:3001/api-docs
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AWAKE Connect API',
      version: '1.0.0',
      description: 'Student sponsorship platform REST API documentation',
      contact: {
        name: 'AWAKE Connect Team',
        email: 'support@awakeconnect.com',
      },
      license: {
        name: 'Private',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.awakeconnect.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from /api/auth/login',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'integer', example: 401 },
                      message: { type: 'string', example: 'Unauthorized' },
                    },
                  },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'integer', example: 400 },
                      message: { type: 'string', example: 'Validation failed' },
                      details: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            field: { type: 'string', example: 'email' },
                            message: { type: 'string', example: 'Must be a valid email' },
                          },
                        },
                      },
                    },
                  },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            role: {
              type: 'string',
              enum: ['STUDENT', 'DONOR', 'ADMIN', 'SUB_ADMIN', 'CASE_WORKER', 'SUPER_ADMIN'],
              example: 'STUDENT',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            university: { type: 'string', example: 'University of Example' },
            field: { type: 'string', example: 'Computer Science' },
            degreeLevel: { type: 'string', example: 'BACHELORS' },
            gpa: { type: 'number', format: 'float', example: 3.8 },
            sponsored: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Donor: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Jane Smith' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            country: { type: 'string', example: 'United States' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Application: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            studentId: { type: 'string', example: 'clx1234567890' },
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED', 'INTERVIEW'],
              example: 'PENDING',
            },
            tuitionAmount: { type: 'number', format: 'float', example: 5000.0 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger documentation
 * @param {Express.Application} app - Express app instance
 */
export function setupSwagger(app) {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AWAKE Connect API Documentation',
  }));
  
  // Swagger JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log(' API Documentation available at /api-docs');
}

export default { setupSwagger, swaggerSpec };
