import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

/**
 * Tests d'intégration : nécessitent un .env valide (DATABASE_URL vers la base
 * `opqual`, JWT_SECRET) et PostgreSQL démarré. Aucun test ne modifie les données.
 */
describe('Application (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  it('/ (GET) est public', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('une route protégée sans token répond 401', () => {
    return request(app.getHttpServer()).get('/taches').expect(401);
  });

  it('une route protégée avec un faux token répond 401', () => {
    return request(app.getHttpServer())
      .get('/taches')
      .set('Authorization', 'Bearer faux.token.ici')
      .expect(401);
  });

  it('POST /auth/logout sans token répond 401', () => {
    return request(app.getHttpServer()).post('/auth/logout').expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
