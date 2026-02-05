import request from 'supertest';
import { app } from '../server.js';
import User from '../models/User.js';

describe('Auth API', () => {
    const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'developer'
    };

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(userData);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.name).toEqual(userData.name);
    });

    it('should login the user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: userData.email,
                password: userData.password
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should fail login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: userData.email,
                password: 'WrongPassword123!'
            });

        expect(res.statusCode).toEqual(401);
    });
});
