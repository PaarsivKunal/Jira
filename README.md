# Jira-like Project Management System

A full-stack project management application built with MERN stack (MongoDB, Express, React, Node.js) using Vite and Tailwind CSS.

## ✨ Features

### Core Features
- ✅ **User Authentication** - Secure JWT-based authentication with password hashing
- ✅ **Project Management** - Create, edit, delete, and manage projects
- ✅ **Issue/Ticket Management** - Full CRUD operations for issues
- ✅ **Kanban Board** - Drag & drop interface for issue management
- ✅ **Issue Types** - Bug, Task, Story, Epic
- ✅ **Priority Levels** - Low, Medium, High, Critical
- ✅ **Status Workflow** - To Do, In Progress, In Review, Done
- ✅ **Comments** - Threaded comments on issues
- ✅ **User Roles** - Admin, Project Manager, Developer, Viewer
- ✅ **Real-time Updates** - Socket.io integration
- ✅ **File Attachments** - Upload and manage attachments
- ✅ **Forms** - Dynamic form builder
- ✅ **Reports** - Custom report generation
- ✅ **Work Logs** - Time tracking for issues
- ✅ **Activity Feed** - Track all changes
- ✅ **Issue Linking** - Link related issues
- ✅ **Child Issues** - Create sub-tasks

### Security & Quality Features
- ✅ **Input Validation** - Comprehensive validation using express-validator
- ✅ **Authorization** - Project-level access control
- ✅ **File Type Validation** - Secure file uploads with type restrictions
- ✅ **Error Handling** - Enhanced error handling with proper logging
- ✅ **Pagination** - Efficient data loading with pagination
- ✅ **Environment Validation** - Startup validation for required env vars
- ✅ **Error Boundaries** - React error boundaries for graceful error handling

## Tech Stack

### Backend
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication
- Socket.io (for real-time features)
- bcryptjs (password hashing)

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router DOM
- React Query (TanStack Query)
- React Beautiful DnD (for drag & drop)
- Axios
- Socket.io Client
- React Hot Toast (notifications)

## Project Structure

```
Jira/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & error middleware
│   ├── utils/           # Utility functions
│   └── server.js        # Express server
│
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   ├── services/    # API services
│   │   └── App.jsx      # Main app component
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd Jira
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up Environment Variables**

   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/jira?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.6.0
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

   Optionally, create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - Or use MongoDB Atlas connection string in `.env`

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on `http://localhost:5000`

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

4. **Open Browser**
   Navigate to `http://localhost:5173`

## API Endpoints

All endpoints require authentication unless specified otherwise. Use `Authorization: Bearer <token>` header.

### Authentication
- `POST /api/auth/register` - Register new user
  - Body: `{ name, email, password, role? }`
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
- `GET /api/auth/me` - Get current user (protected)

### Projects
- `GET /api/projects` - Get all projects (paginated)
  - Query params: `page`, `limit`
- `POST /api/projects` - Create project
  - Body: `{ name, key, description?, members? }`
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id` - Update project (project lead/admin only)
- `DELETE /api/projects/:id` - Delete project (project lead/admin only)
- `GET /api/projects/:id/stats` - Get project statistics

### Issues
- `GET /api/issues` - Get all issues (paginated)
  - Query params: `projectId`, `status`, `assignee`, `page`, `limit`
- `POST /api/issues` - Create issue
  - Body: `{ projectId, title, description?, type?, priority?, assignee?, labels?, dueDate? }`
- `GET /api/issues/:id` - Get single issue with child issues
- `PUT /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue
- `PATCH /api/issues/:id/status` - Update issue status
  - Body: `{ status }`
- `GET /api/issues/:id/children` - Get child issues
- `POST /api/issues/:id/children` - Create child issue
- `GET /api/issues/:id/links` - Get linked issues
- `POST /api/issues/:id/links` - Link issues
- `GET /api/issues/:id/worklogs` - Get work logs
- `POST /api/issues/:id/worklogs` - Create work log
- `GET /api/issues/:id/activities` - Get activity feed

### Comments
- `GET /api/comments/issues/:issueId/comments` - Get comments for issue (paginated)
- `POST /api/comments/issues/:issueId/comments` - Create comment
  - Body: `{ content }`
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Attachments
- `GET /api/attachments/projects/:projectId/attachments` - Get project attachments
- `GET /api/attachments/issues/:issueId/attachments` - Get issue attachments
- `POST /api/attachments/issues/:issueId/attachments` - Upload attachment (multipart/form-data)
- `GET /api/attachments/:id/download` - Download attachment
- `DELETE /api/attachments/:id` - Delete attachment

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user

### Forms
- `GET /api/projects/:projectId/forms` - Get project forms
- `POST /api/projects/:projectId/forms` - Create form
- `GET /api/forms/:id` - Get form
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `POST /api/forms/:id/submit` - Submit form

### Reports
- `GET /api/reports/projects/:projectId/reports` - Get project reports
- `POST /api/reports/projects/:projectId/reports` - Create report
- `GET /api/reports/:id` - Get report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `GET /api/reports/:id/data` - Get report data

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Project**: Navigate to Projects page and create a new project
3. **Create Issues**: Click "Create Issue" button to add issues to projects
4. **Manage Issues**: Use the Kanban board to drag and drop issues between statuses
5. **View Details**: Click on any issue to view details and add comments

## Development

### Backend Development
- Uses nodemon for auto-restart during development
- ES6 modules (import/export)
- Express middleware for CORS, JSON parsing, and error handling

### Frontend Development
- Vite for fast development and HMR
- React Query for server state management
- Tailwind CSS for styling
- React Router for navigation

## Production Build

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
```
The build output will be in `frontend/dist`

## Security Features

### Implemented
- ✅ JWT authentication with secure token handling
- ✅ Password hashing with bcryptjs
- ✅ Input validation on all endpoints
- ✅ Project-level access control
- ✅ File type validation for uploads
- ✅ Environment variable validation
- ✅ Error handling without exposing sensitive information
- ✅ CORS configuration
- ✅ MongoDB injection protection via Mongoose

### Best Practices
- Password requirements: minimum 6 characters, must contain uppercase, lowercase, and number
- JWT tokens expire after 7 days (configurable)
- File uploads limited to 10MB
- Allowed file types: images, PDF, Office documents, text files, archives
- Project access restricted to members and leads
- Admin role has full access

## Code Quality

### Backend
- ✅ ES6 modules
- ✅ Consistent error handling
- ✅ Input validation middleware
- ✅ Pagination utilities
- ✅ Environment validation
- ✅ Comprehensive error logging

### Frontend
- ✅ Error boundaries for graceful error handling
- ✅ React Query for efficient data fetching
- ✅ Optimistic updates ready
- ✅ Loading states
- ✅ Toast notifications

## Testing

Currently, the project does not include automated tests. Recommended additions:
- Unit tests for controllers and utilities
- Integration tests for API endpoints
- E2E tests for critical user flows
- Frontend component tests

## Future Enhancements

- [ ] Unit and integration tests
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Advanced search and filtering
- [ ] Email notifications
- [ ] Sprint management
- [ ] Dark mode
- [ ] Mobile app
- [ ] Rate limiting
- [ ] Caching layer (Redis)
- [ ] Database migrations
- [ ] CI/CD pipeline

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

