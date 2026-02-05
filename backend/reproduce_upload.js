import request from 'supertest';
import { app } from './server.js';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Need to handle DB connection if server.js connects
// server.js checks if (process.env.NODE_ENV !== 'test') { connectDB() }
// I should set NODE_ENV to test to avoid double connection or just let it connect if not set?
// If I import app, the top level code runs.
// server.js calls connectDB() if not test.
// So let's rely on that.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    try {
        // Wait a bit for DB connection if async
        console.log('Starting test...');

        // 1. Register/Login
        const userData = {
            name: 'Upload Tester',
            email: 'uploader@example.com',
            password: 'password123',
            role: 'admin'
        };

        let token;
        let userId;

        console.log('Attempting login...');
        let res = await request(app).post('/api/auth/login').send({
            email: userData.email,
            password: userData.password
        });

        if (res.status === 401) {
            console.log('Login failed, registering...');
            res = await request(app).post('/api/auth/register').send(userData);
        }

        if (res.status !== 200 && res.status !== 201) {
            console.error('Auth failed', res.status, res.body);
            process.exit(1);
        }

        token = res.body.token;
        userId = res.body._id;
        console.log('Authenticated as:', userId);

        // 2. Create Project
        const projectRes = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Upload Project',
                key: 'UP',
                description: 'Test'
            });

        if (projectRes.status !== 201 && projectRes.status !== 400) { // 400 if key exists
            console.error('Project creation failed', projectRes.status, projectRes.body);
            // Try to find if exists?
            if (projectRes.status !== 400) process.exit(1);
        }

        // If 400, assume existing project? Need an ID.
        let projectId;
        if (projectRes.status === 400) {
            // Fetch projects to find one
            const getProj = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);
            projectId = getProj.body.data[0]._id;
        } else {
            projectId = projectRes.body._id;
        }
        console.log('Project ID:', projectId);

        // 3. Create Issue
        const issueRes = await request(app)
            .post('/api/issues')
            .set('Authorization', `Bearer ${token}`)
            .send({
                projectId,
                title: 'Upload Issue',
                priority: 'medium',
                type: 'task'
            });

        const issueId = issueRes.body._id;
        console.log('Issue ID:', issueId);

        // 4. Upload File
        const filePath = path.join(__dirname, 'test_upload.txt');
        fs.writeFileSync(filePath, 'Test Content');

        console.log('Uploading file...');
        const uploadRes = await request(app)
            .post(`/api/issues/${issueId}/attachments`) // Note: Route in api.js is /attachments/issues/:issueId/attachments
            // Wait, api.js says: `/attachments/issues/${issueId}/attachments`
            // Routes file `routes/attachments.js` says:
            // router.route('/issues/:issueId/attachments').post(...)
            // And `server.js` mounts it at `/api/attachments`
            // SO THE URL IS `/api/attachments/issues/${issueId}/attachments`
            .set('Authorization', `Bearer ${token}`)
            .attach('file', filePath);

        console.log('Upload Status:', uploadRes.status);
        console.log('Upload Body:', uploadRes.body);

        if (uploadRes.status === 201) {
            console.log('VERIFICATION SUCCESS: Upload worked.');
        } else {
            console.log('VERIFICATION FAILURE: Upload failed.');
        }

        // Cleanup
        fs.unlinkSync(filePath);
        process.exit(0);

    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

run();
