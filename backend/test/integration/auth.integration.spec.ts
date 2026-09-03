import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestDatabase } from '../src/test-utils/database.spec';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let prisma: any;

  beforeAll(async () => {
    // Connect to test database
    await TestDatabase.connect();
    prisma = TestDatabase.getPrisma();

    // Create NestJS application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await TestDatabase.cleanup();
    await TestDatabase.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await TestDatabase.cleanup();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'NewPassword123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(registerDto.email);
      expect(response.body.data.password).toBeUndefined(); // Password should not be returned
    });

    it('should not allow duplicate email registration', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'duplicate@test.com',
        password: 'TestPassword123',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Second registration with same email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should validate password requirements', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@test.com',
        password: 'weak', // Invalid password
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      const registerDto = {
        name: 'Login User',
        email: 'loginuser@test.com',
        password: 'LoginPassword123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Then login
      const loginDto = {
        email: 'loginuser@test.com',
        password: 'LoginPassword123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe(loginDto.email);
    });

    it('should reject invalid credentials', async () => {
      const loginDto = {
        email: 'nonexistent@test.com',
        password: 'WrongPassword123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile with valid token', async () => {
      // Register and login to get token
      const registerDto = {
        name: 'Profile User',
        email: 'profileuser@test.com',
        password: 'ProfilePassword123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const loginDto = {
        email: 'profileuser@test.com',
        password: 'ProfilePassword123',
      };

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201);

      const token = loginResponse.body.data.accessToken;

      // Get profile
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('profileuser@test.com');
    });

    it('should reject requests without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });
});