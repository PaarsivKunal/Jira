export const CONSTANTS = {
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100
    },
    FILE_UPLOAD: {
        MAX_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        ALLOWED_DOC_TYPES: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
    },
    ROLES: {
        ADMIN: 'admin',
        MANAGER: 'manager',
        PROJECT_MANAGER: 'project_manager',
        DEVELOPER: 'developer',
        VIEWER: 'viewer'
    },
    ISSUE: {
        TYPE: {
            BUG: 'Bug',
            TASK: 'Task',
            STORY: 'Story',
            EPIC: 'Epic'
        },
        STATUS: {
            TODO: 'To Do',
            IN_PROGRESS: 'In Progress',
            IN_REVIEW: 'In Review',
            DONE: 'Done'
        },
        PRIORITY: {
            LOW: 'Low',
            MEDIUM: 'Medium',
            HIGH: 'High',
            CRITICAL: 'Critical'
        }
    }
};
