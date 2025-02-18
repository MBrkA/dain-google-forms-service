# Google Forms DAIN Service

This DAIN service provides integration with Google Forms, allowing users to manage Google Forms through a simple interface.

## Available Tools

### Form Management
- **Create Form**: Create a new Google Form with custom title
- **Get Form**: Retrieve details of an existing form
- **Update Form**: Update title, description and settings of a form
- **Get Responses**: Get form responses with pagination support

### Form Item Management  
- **Add Form Item**: Add new questions, text blocks or page breaks
- **Delete Form Item**: Remove items from a form
- **Move Form Item**: Reorder items within a form

## Setup

1. Configure environment variables in `.env`:
2. Install dependencies and start service:
```bash
Copy
npm install
npm start
```
The service will start on port 2022.

## Authentication
Uses Google OAuth2 for authentication. Service will prompt for auth when needed.