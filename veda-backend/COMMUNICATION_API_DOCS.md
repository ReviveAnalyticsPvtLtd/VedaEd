# Communication Module API Documentation

## Overview

The Communication Module provides comprehensive messaging, notice, complaint, and logging functionality for the VedaEdu system. It supports communication between Students, Teachers, Parents, and Admins.

## Base URL

```
http://localhost:5000/api/communication
```

## Models

### Message Model

- **sender**: ObjectId (ref to Student/Teacher/Parent/Admin)
- **senderModel**: String (Student/Teacher/Parent/Admin)
- **receiver**: ObjectId (ref to Student/Teacher/Parent/Admin)
- **receiverModel**: String (Student/Teacher/Parent/Admin)
- **subject**: String (required)
- **content**: String (required)
- **messageType**: String (text/file/image/announcement)
- **priority**: String (low/medium/high/urgent)
- **status**: String (sent/delivered/read/archived)
- **attachments**: Array of file objects
- **isImportant**: Boolean
- **replyTo**: ObjectId (ref to Message)
- **threadId**: ObjectId (ref to Message)

### Notice Model

- **title**: String (required)
- **content**: String (required)
- **author**: ObjectId (ref to Teacher/Admin)
- **authorModel**: String (Teacher/Admin)
- **category**: String (general/academic/exam/event/emergency/maintenance)
- **priority**: String (low/medium/high/urgent)
- **targetAudience**: String (all/students/teachers/parents/staff/specific_class/specific_grade)
- **specificTargets**: Array of ObjectIds
- **attachments**: Array of file objects
- **status**: String (draft/published/archived/expired)
- **publishDate**: Date
- **expiryDate**: Date
- **isPinned**: Boolean
- **views**: Array of view objects
- **tags**: Array of strings

### Complaint Model

- **complainant**: ObjectId (ref to Student/Teacher/Parent)
- **complainantModel**: String (Student/Teacher/Parent)
- **subject**: String (required)
- **description**: String (required)
- **category**: String (academic/behavioral/infrastructure/staff/other)
- **priority**: String (low/medium/high/urgent)
- **status**: String (submitted/under_review/in_progress/resolved/closed/rejected/Pending/Replied/Reviewed/Resolved/Rejected/Closed)
- **assignedTo**: ObjectId (ref to Teacher/Admin)
- **assignedToModel**: String (Teacher/Admin)
- **attachments**: Array of file objects
- **responses**: Array of response objects
- **resolution**: Object with resolution details
- **isAnonymous**: Boolean
- **tags**: Array of strings
- **dueDate**: Date

### Communication Log Model

- **user**: ObjectId (ref to Student/Teacher/Parent/Admin)
- **userModel**: String (Student/Teacher/Parent/Admin)
- **action**: String (message_sent/message_received/message_read/notice_viewed/etc.)
- **target**: ObjectId (ref to Message/Notice/Complaint/User)
- **targetModel**: String (Message/Notice/Complaint/User)
- **details**: Mixed object
- **ipAddress**: String
- **userAgent**: String
- **sessionId**: String
- **timestamp**: Date

## API Endpoints

### Message Endpoints

#### Create Message

```
POST /messages
```

**Body:**

```json
{
  "sender": "ObjectId",
  "senderModel": "Student|Teacher|Parent|Admin",
  "receiver": "ObjectId",
  "receiverModel": "Student|Teacher|Parent|Admin",
  "subject": "string",
  "content": "string",
  "messageType": "text|file|image|announcement",
  "priority": "low|medium|high|urgent",
  "attachments": [],
  "replyTo": "ObjectId"
}
```

#### Get Messages (Inbox)

```
GET /messages/:userId/:userModel?page=1&limit=10&status=sent&priority=high&isImportant=true
```

#### Get Sent Messages

```
GET /messages/sent/:userId/:userModel?page=1&limit=10
```

#### Get Single Message

```
GET /messages/single/:messageId?userId=ObjectId&userModel=string
```

#### Get Message Thread

```
GET /messages/thread/:threadId
```

#### Update Message Status

```
PUT /messages/:messageId/status
```

**Body:**

```json
{
  "status": "sent|delivered|read|archived",
  "userId": "ObjectId",
  "userModel": "string"
}
```

#### Delete Message

```
DELETE /messages/:messageId
```

**Body:**

```json
{
  "userId": "ObjectId",
  "userModel": "string"
}
```

### Notice Endpoints

#### Create Notice

```
POST /notices
```

**Body:**

```json
{
  "title": "string",
  "content": "string",
  "author": "ObjectId",
  "authorModel": "Teacher|Admin",
  "category": "general|academic|exam|event|emergency|maintenance",
  "priority": "low|medium|high|urgent",
  "targetAudience": "all|students|teachers|parents|staff|specific_class|specific_grade",
  "specificTargets": [],
  "specificTargetModel": "Student|Teacher|Parent|Class|Section",
  "attachments": [],
  "publishDate": "Date",
  "expiryDate": "Date",
  "isPinned": false,
  "tags": []
}
```

#### Get All Notices

```
GET /notices?page=1&limit=10&category=academic&priority=high&status=published&targetAudience=students&isPinned=true
```

#### Get Published Notices for User

```
GET /notices/published/:userId/:userModel?page=1&limit=10&category=academic
```

#### Get Single Notice

```
GET /notices/:noticeId?userId=ObjectId&userModel=string
```

#### Update Notice

```
PUT /notices/:noticeId
```

#### Publish Notice

```
PUT /notices/:noticeId/publish
```

**Body:**

```json
{
  "userId": "ObjectId",
  "userModel": "string"
}
```

#### Delete Notice

```
DELETE /notices/:noticeId
```

#### Get Notice Statistics

```
GET /notices/stats/summary
```

### Complaint Endpoints

#### Create Complaint

```
POST /complaints
```

**Body:**

```json
{
  "complainant": "ObjectId",
  "complainantModel": "Student|Teacher|Parent",
  "subject": "string",
  "description": "string",
  "category": "academic|behavioral|infrastructure|staff|other",
  "priority": "low|medium|high|urgent",
  "attachments": [],
  "isAnonymous": false,
  "tags": [],
  "dueDate": "Date"
}
```

#### Get All Complaints

```
GET /complaints?page=1&limit=10&status=submitted&category=academic&priority=high&assignedTo=ObjectId
```

#### Get User Complaints

```
GET /complaints/user/:userId/:userModel?page=1&limit=10&status=submitted
```

#### Get Single Complaint

```
GET /complaints/:complaintId?userId=ObjectId&userModel=string
```

#### Update Complaint Status

```
PUT /complaints/:complaintId/status
```

**Body:**

```json
{
  "status": "submitted|under_review|in_progress|resolved|closed|rejected|Pending|Replied|Reviewed|Resolved|Rejected|Closed",
  "userId": "ObjectId",
  "userModel": "string"
}
```

#### Assign Complaint

```
PUT /complaints/:complaintId/assign
```

**Body:**

```json
{
  "assignedTo": "ObjectId",
  "assignedToModel": "Teacher|Admin",
  "userId": "ObjectId",
  "userModel": "string"
}
```

#### Add Response to Complaint

```
PUT /complaints/:complaintId/response
```

**Body:**

```json
{
  "responder": "ObjectId",
  "responderModel": "Teacher|Admin",
  "response": "string",
  "isInternal": false,
  "userId": "ObjectId",
  "userModel": "string"
}
```

#### Resolve Complaint

```
PUT /complaints/:complaintId/resolve
```

**Body:**

```json
{
  "description": "string",
  "resolvedBy": "ObjectId",
  "resolvedByModel": "Teacher|Admin",
  "resolutionType": "resolved|dismissed|escalated",
  "userId": "ObjectId",
  "userModel": "string"
}
```

#### Delete Complaint

```
DELETE /complaints/:complaintId
```

#### Get Complaint Statistics

```
GET /complaints/stats/summary
```

### Communication Log Endpoints

#### Get Communication Logs

```
GET /logs?page=1&limit=10&userId=ObjectId&userModel=string&action=message_sent&startDate=Date&endDate=Date
```

#### Get User Logs

```
GET /logs/user/:userId/:userModel?page=1&limit=10&action=message_sent&startDate=Date&endDate=Date
```

#### Get Communication Statistics

```
GET /logs/stats/summary?startDate=Date&endDate=Date
```

#### Get Activity Summary

```
GET /logs/activity/:userId/:userModel?days=7
```

#### Create Log Entry

```
POST /logs
```

**Body:**

```json
{
  "user": "ObjectId",
  "userModel": "Student|Teacher|Parent|Admin",
  "action": "string",
  "target": "ObjectId",
  "targetModel": "Message|Notice|Complaint|User",
  "details": {},
  "ipAddress": "string",
  "userAgent": "string",
  "sessionId": "string"
}
```

#### Delete Old Logs

```
DELETE /logs/cleanup?days=90
```

### File Upload Endpoint

#### Upload Attachment

```
POST /upload/attachment
```

**Body:** FormData with file field

**Response:**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "filename": "string",
    "originalName": "string",
    "path": "string",
    "size": "number"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Success Responses

All endpoints return consistent success responses:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

## Pagination

Endpoints that return lists include pagination information:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50
  }
}
```

## Database Integration

The communication module integrates with existing models:

- **Student**: References student personal information
- **Teacher**: References teacher/staff information
- **Parent**: References parent information
- **Staff**: Used for admin and teacher roles

## Security Considerations

- All endpoints validate user existence before operations
- File uploads are handled securely with proper validation
- Communication logs track all user activities
- Anonymous complaints are supported for sensitive issues

## Usage Examples

### Sending a Message

```javascript
const response = await fetch("/api/communication/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sender: "studentId",
    senderModel: "Student",
    receiver: "teacherId",
    receiverModel: "Teacher",
    subject: "Question about Assignment",
    content: "I have a question about the math assignment...",
    priority: "medium",
  }),
});
```

### Creating a Notice

```javascript
const response = await fetch("/api/communication/notices", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "School Holiday Notice",
    content: "School will be closed on...",
    author: "adminId",
    authorModel: "Admin",
    category: "general",
    targetAudience: "all",
    priority: "high",
  }),
});
```

### Submitting a Complaint

```javascript
const response = await fetch("/api/communication/complaints", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    complainant: "studentId",
    complainantModel: "Student",
    subject: "Issue with Classroom",
    description: "The classroom temperature is too high...",
    category: "infrastructure",
    priority: "medium",
  }),
});
```
