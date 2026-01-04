# n8n-nodes-supabase

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for **Supabase** - the open-source Firebase alternative providing PostgreSQL database, authentication, instant REST APIs, realtime subscriptions, storage, and edge functions.

![n8n](https://img.shields.io/badge/n8n-community--node-green)
![Supabase](https://img.shields.io/badge/Supabase-API-3ECF8E)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## Features

- **Database Operations** - Full PostgREST integration with select, insert, update, upsert, delete, RPC calls, and count operations
- **Authentication** - Complete auth flow support including sign up, sign in, OAuth, OTP, password reset, and session management
- **User Administration** - Admin operations for user management including create, update, delete, invite, and link generation
- **Storage** - Bucket and file management with upload, download, signed URLs, and image transformations
- **Edge Functions** - Invoke and manage Deno serverless functions
- **Realtime** - WebSocket channel configuration for database changes, broadcast, and presence
- **Management API** - Project, organization, database, and secrets management
- **Trigger Node** - Webhook-based triggers for database events, auth events, and storage events

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-supabase`
5. Accept the risks and click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-supabase

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-supabase.git
cd n8n-nodes-supabase

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom nodes
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-supabase

# Restart n8n
n8n start
```

## Credentials Setup

The Supabase node supports three authentication modes:

| Auth Type | Description | Use Case |
|-----------|-------------|----------|
| **Anon Key** | Public API key that respects Row Level Security (RLS) policies | Client-side operations, respecting user permissions |
| **Service Role Key** | Secret admin key that bypasses RLS | Server-side operations requiring full access |
| **Management API** | Personal Access Token for Supabase Management API | Project and organization management |

### Credential Fields

| Field | Required | Description |
|-------|----------|-------------|
| Project URL | Yes | Your Supabase project URL (e.g., `https://xyzcompany.supabase.co`) |
| Auth Type | Yes | Choose: Anon Key, Service Role Key, or Management API |
| Anon Key | Conditional | Public anon key (when Auth Type is Anon Key) |
| Service Role Key | Conditional | Service role secret key (when Auth Type is Service Role Key) |
| Management API Token | Conditional | Personal Access Token (when Auth Type is Management API) |
| Region | No | Optional region for Management API operations |

### Finding Your Keys

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** > **API**
4. Find your Project URL and API keys

For Management API Token:
1. Go to your [Account Settings](https://supabase.com/dashboard/account/tokens)
2. Generate a new Personal Access Token

## Resources & Operations

### Database (PostgREST)

| Operation | Description |
|-----------|-------------|
| Select | Query data with filters, ordering, pagination |
| Insert | Insert one or more rows |
| Update | Update rows matching filters |
| Upsert | Insert or update rows (on conflict) |
| Delete | Delete rows matching filters |
| RPC | Call stored database functions |
| Count | Count rows with optional filters |

### Auth

| Operation | Description |
|-----------|-------------|
| Sign Up | Register new user with email/password |
| Sign In | Authenticate with email/password |
| Sign In with OTP | Magic link or OTP authentication |
| Sign In with OAuth | Get OAuth provider URL |
| Sign Out | Sign out user (global/local/others) |
| Get User | Get current authenticated user |
| Update User | Update user attributes |
| Reset Password | Send password reset email |
| Verify OTP | Verify OTP token |
| Refresh Session | Refresh access token |
| Set Session | Set session manually |
| Get Session | Get current session |

### Users (Admin)

| Operation | Description |
|-----------|-------------|
| List Users | List all users with pagination |
| Get User by ID | Retrieve user by UUID |
| Create User | Create user (admin) |
| Update User by ID | Update user (admin) |
| Delete User | Delete or soft-delete user |
| Invite by Email | Send invitation email |
| Generate Link | Generate auth link (signup/magiclink/recovery/invite) |

### Storage

| Operation | Description |
|-----------|-------------|
| List Buckets | List all storage buckets |
| Get Bucket | Get bucket details |
| Create Bucket | Create new bucket |
| Update Bucket | Update bucket settings |
| Delete Bucket | Delete bucket |
| Empty Bucket | Remove all files from bucket |
| List Files | List files in bucket/folder |
| Upload File | Upload file (binary) |
| Download File | Download file (binary) |
| Get Public URL | Get public URL with optional transformations |
| Create Signed URL | Create temporary signed URL |
| Move File | Move or rename file |
| Copy File | Copy file to new location |
| Delete Files | Delete multiple files |

### Edge Functions

| Operation | Description |
|-----------|-------------|
| Invoke | Execute edge function with JSON body |
| List Functions | List all edge functions |
| Get Function | Get function details |
| Deploy Function | Deploy new function version |

### Realtime

| Operation | Description |
|-----------|-------------|
| Create Channel | Create realtime channel config |
| Subscribe to Changes | Subscribe to database changes |
| Subscribe to Broadcast | Subscribe to broadcast events |
| Subscribe to Presence | Subscribe to presence tracking |
| Unsubscribe | Unsubscribe from channel |

### Management (Projects)

| Operation | Description |
|-----------|-------------|
| List Projects | List all projects |
| Get Project | Get project details |
| Create Project | Create new project |
| Delete Project | Delete project |
| Pause Project | Pause project |
| Restore Project | Restore paused project |
| Get API Keys | Get project API keys |
| Get Settings | Get project settings |

### Management (Organizations)

| Operation | Description |
|-----------|-------------|
| List Organizations | List all organizations |
| Get Organization | Get organization details |
| Create Organization | Create new organization |
| Get Members | Get organization members |

### Management (Database)

| Operation | Description |
|-----------|-------------|
| Run SQL | Execute raw SQL query |
| Get Schemas | List database schemas |
| Get Tables | List tables in schema |
| Get Columns | Get table columns |
| Get Types | Get custom types |
| Get Extensions | List extensions |
| Enable Extension | Enable PostgreSQL extension |

### Management (Secrets)

| Operation | Description |
|-----------|-------------|
| List Secrets | List project secrets |
| Create Secret | Create new secret |
| Delete Secrets | Delete multiple secrets |

## Trigger Node

The Supabase Trigger node supports webhook-based events:

| Event | Description |
|-------|-------------|
| Row Inserted | Trigger when new row is inserted |
| Row Updated | Trigger when row is updated |
| Row Deleted | Trigger when row is deleted |
| User Created | Trigger when user registers |
| User Signed In | Trigger when user signs in |
| User Deleted | Trigger when user is deleted |
| Object Created | Trigger when file is uploaded |
| Object Deleted | Trigger when file is deleted |

### Setting Up Triggers

Supabase webhooks require manual configuration in your Supabase project:

1. Go to **Database** > **Webhooks** in your Supabase dashboard
2. Create a new webhook pointing to your n8n webhook URL
3. Configure the events and tables to monitor
4. The trigger node provides the webhook URL to use

## Usage Examples

### Query Database with Filters

```javascript
// Select users where status is 'active' and age >= 18
Resource: Database
Operation: Select
Table: users
Filters:
  - Column: status, Operator: eq, Value: active
  - Column: age, Operator: gte, Value: 18
Order By: created_at DESC
Limit: 10
```

### Upload File to Storage

```javascript
// Upload file to images bucket
Resource: Storage
Operation: Upload File
Bucket: images
Path: profile-pictures/user123.jpg
Binary Property: data
```

### Invoke Edge Function

```javascript
// Call a custom edge function
Resource: Edge Functions
Operation: Invoke
Function Name: send-notification
Body: {
  "userId": "123",
  "message": "Hello from n8n!"
}
```

### Create User (Admin)

```javascript
// Create user with admin privileges
Resource: Users (Admin)
Operation: Create User
Email: newuser@example.com
Password: securepassword123
Email Confirm: true
User Metadata: {
  "role": "member",
  "department": "engineering"
}
```

## Supabase Concepts

| Concept | Description |
|---------|-------------|
| **Project URL** | Unique URL for your Supabase project (e.g., `https://xyzcompany.supabase.co`) |
| **Anon Key** | Public API key that respects Row Level Security policies |
| **Service Role Key** | Secret admin key that bypasses all security policies |
| **RLS** | Row Level Security - PostgreSQL policies that control data access |
| **PostgREST** | Auto-generated REST API from your PostgreSQL schema |
| **Bucket** | Storage container for files |
| **Edge Function** | Deno-based serverless function running at the edge |
| **Realtime** | WebSocket-based real-time subscriptions |

## PostgREST Query Operators

| Operator | Description | Example |
|----------|-------------|---------|
| eq | Equals | `status=eq.active` |
| neq | Not equals | `status=neq.deleted` |
| gt | Greater than | `age=gt.18` |
| gte | Greater than or equal | `age=gte.21` |
| lt | Less than | `price=lt.100` |
| lte | Less than or equal | `price=lte.50` |
| like | Pattern match (case sensitive) | `name=like.*john*` |
| ilike | Pattern match (case insensitive) | `email=ilike.*@gmail.com` |
| is | IS NULL or IS TRUE | `deleted_at=is.null` |
| in | IN array | `id=in.(1,2,3)` |
| contains | Array contains | `tags=cs.{tag1,tag2}` |
| overlaps | Arrays overlap | `roles=ov.{admin,editor}` |

## Error Handling

The node provides detailed error messages for common Supabase errors:

| Error Code | Description | Resolution |
|------------|-------------|------------|
| PGRST301 | JWT expired | Refresh the session or re-authenticate |
| PGRST401 | Unauthorized | Check API key permissions |
| PGRST404 | Table not found | Verify table name and permissions |
| 23505 | Unique violation | Record with same unique key exists |
| 42501 | Permission denied | Check RLS policies |

Use the "Continue On Fail" option to handle errors gracefully in your workflow.

## Security Best Practices

1. **Never expose Service Role Key** - Only use in secure server-side environments
2. **Use Anon Key with RLS** - Define proper Row Level Security policies
3. **Rotate keys regularly** - Regenerate API keys periodically
4. **Limit Management API scope** - Use tokens with minimal required permissions
5. **Validate inputs** - Always validate user inputs before database operations

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Watch mode for development
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Support

- **Documentation**: [Supabase Docs](https://supabase.com/docs)
- **n8n Community**: [n8n Community Forum](https://community.n8n.io/)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-supabase/issues)

## Acknowledgments

- [Supabase](https://supabase.com/) for the excellent open-source platform
- [n8n](https://n8n.io/) for the powerful workflow automation tool
- The open-source community for inspiration and contributions
