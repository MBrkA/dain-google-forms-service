# Google Forms DAIN Service

This DAIN service provides integration with Google Forms, allowing users to create and retrieve Google Forms through a simple interface.

## Features

- Create new Google Forms with custom titles
- Retrieve existing Google Forms details
- OAuth2 authentication with Google
- User-friendly UI components for form management

## Tools

### Create Form
Creates a new Google Form with the specified title and optional document title.

Required parameters:
- \`title\`: The title of the form visible to respondents

Optional parameters:
- \`documentTitle\`: The title visible in Google Drive (defaults to form title)

### Get Form
Retrieves details of an existing Google Form.

Required parameters:
- \`formId\`: The ID of the form to retrieve

## Setup

1. Set up required environment variables:
   - \`DAIN_API_KEY\`: Your DAIN API key
   - \`GOOGLE_CLIENT_ID\`: Google OAuth client ID
   - \`GOOGLE_CLIENT_SECRET\`: Google OAuth client secret
   - \`TUNNEL_URL\`: Your public URL for OAuth callbacks (optional, defaults to localhost)

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the service:
   \`\`\`bash
   npm start
   \`\`\`

## Authentication

The service uses Google OAuth2 for authentication. Users must authenticate before using any of the tools. The service will automatically prompt for authentication when needed.

## Error Handling

All tools include comprehensive error handling with user-friendly error messages and appropriate UI components for error display.
