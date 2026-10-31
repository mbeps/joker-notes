# **Joker Notes**

![screenshotr_2023-12-30T19-34-34](https://github.com/mbeps/motion/assets/58662575/77c4cbda-d580-4126-83bf-b3ef12fd28b9)


Joker Notes is a note-taking web application for creating, organising, and publishing rich-text notes. Organise thoughts with nested documents, media covers, and real-time synchronisation. Publish notes for public viewing or manage their lifecycle through trash recovery.

# Features

Joker Notes is a rich-text note-taking application similar to Notion for creating, organising, and publishing notes.
Features nested hierarchical documents, real-time reactive synchronisation, trash recovery, and public note sharing.

## Authentication & Account Management
Joker Notes ensures a secure and seamless user experience with robust authentication options:
- **Email and Password Sign Up:** Users can sign up using their email and password.
- **Email and Password Login:** Users can log in using their email and password.
- **Third-Party Authentication:** Users can authenticate using various third-party providers, including Google, Microsoft, LinkedIn, GitHub, Discord, and Apple.

## User Interface & Experience
We prioritize user comfort and customization:
- **Light and Dark Mode:** Users can switch between light and dark mode to suit their preference or ambient light conditions.

## Rich Text Notes
Create, customize, and manage your notes with ease:
- **Rich Text Editing:** Users can create notes with rich text formatting, similar to Notion, allowing for a variety of text customizations and styles.
- **Images and Cover Images:** Users can enhance their notes by adding images and cover images to visually represent the content.
- **Publishing Notes:** Users have the option to publish their notes, making them publicly visible (but not editable) to share their content with others.
- **Nested Notes and Notebooks:** Users can create structured documentation and organize their thoughts more efficiently with the ability to create nested notes and notebooks.
- **Note Management:** Users can move notes to trash, restore them, or permanently delete them, giving full control over their note lifecycle.

## Global Admin Dashboard
A protected administrative dashboard at `/admin` visible only to users configured as global administrators in `config/env.ts`.
- Displays compact metric cards (Total, Active, Published, Authors) with value-on-the-right layout.
- Shows author emails (resolved from Clerk via `/api/admin/users`) instead of UUIDs.
- Table columns: Note title, Author email, Status, Subpage count, Created date, Actions.
- Per-row actions: Open note, Archive/Restore (state-dependent), Delete (with confirmation).
- Search filters by title or author email.
- Author emails are resolved server-side from the Clerk Backend `UserApi` (`/api/admin/users`).
- Metric cards and table rows use Base UI `Tooltip` for action descriptions.
- Metric cards are compact single-row cards (icon + label left, value right).
- Admin-only API route at `/api/admin/users` resolves user IDs to primary emails.

## Model Context Protocol (MCP)
Joker Notes connects with AI assistants to inspect and manage notes:
- **Stateless MCP Server:** Connect AI assistants such as Google Gemini, Claude, and ChatGPT through Streamable HTTP at `/api/mcp`.
- **OAuth 2.1 & Interactive Consent:** Authorise AI clients securely with PKCE, Dynamic Client Registration, and an explicit consent screen.
- **Full Note Lifecycle Management:** Allow AI assistants to search, read, create, update, archive, restore, and delete notes within user permissions.

# Tech Stack

## Frontend

- **[Next.JS](https://nextjs.org/)**: A powerful React-based framework that allows for server-side rendering (SSR) and generation of static websites, ensuring fast load times and a dynamic user experience.
- **[React.JS](https://react.dev/)**: A powerful JavaScript library used for building user interfaces. It allows us to create reusable components and manage the application's state efficiently, ensuring a fast and interactive user experience.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework used for creating custom and responsive designs quickly and efficiently without having to leave your HTML.
- **[Shadcn UI](https://ui.shadcn.com/)**: A comprehensive collection of accessible and customizable components built with Radix UI and Tailwind CSS, offering developers an easy start and consistency across the application.
- **[BlockNote](https://www.blocknotejs.org/)**: A rich text editor providing robust functionality for creating, managing, and displaying rich text notes, similar to Notion, enhancing the note-taking experience with versatile content creation capabilities.

## Backend

- **[Clerk Auth](https://clerk.com/)**: A user-friendly authentication and user management service, providing various authentication strategies and a comprehensive user management system.
- **[Zod](https://zod.dev/)**: A TypeScript-first schema declaration and validation library that ensures type-safe data handling and REST APIs.

- **[Convex](https://www.convex.dev/)**: A developer-friendly database emphasizing reactivity and ease of use. It combines a relational data model with JSON-like documents, offering intuitive JavaScript APIs, automatic query optimization, and built-in reactivity for real-time applications.
- **[EdgeStore](https://edgestore.dev/)**: A file storage solution specifically designed for Next.js, providing a type-safe way to manage file uploads and retrievals. It integrates seamlessly with Next.js, offering access control, metadata handling, lifecycle hooks, and automatic thumbnail generation, among other features.
- **[LogTape](https://logtape.org/)**: A lightweight, structured, and non-blocking logging library for JavaScript and TypeScript with columnar ANSI formatting and environment-level control.
- **[Model Context Protocol](https://modelcontextprotocol.io/)**: An open protocol enabling AI models to interact securely with application tools and data through Streamable HTTP.

# Requirements
Below are the requirements to run this project:
- Node 24 or above
- Clerk Authentication configured 
- Convex Database configured 
- EdgeStore configured

# Model Context Protocol (MCP)

Joker Notes provides a stateless Model Context Protocol (MCP) server at `/api/mcp` over Streamable HTTP, supporting protocol revisions `2024-11-05` and `2026-07-28` for clients such as Google Gemini, Claude, and ChatGPT.

## Authorisation & Discovery

- **Server URL:** `http://localhost:3000/api/mcp` (or your deployment domain)
- **OAuth 2.1:** PKCE (RFC 7636) and Dynamic Client Registration (RFC 7591) at `/api/oauth/register`
- **Consent Screen:** User authorisation at `/oauth/consent` to approve or deny access
- **Discovery Endpoints:** `/.well-known/oauth-protected-resource/api/mcp`, `/.well-known/oauth-authorization-server`, and `/.well-known/openid-configuration`

## Available Tools

The MCP server provides eight document management tools with tenant isolation:

| Tool               | Description                                                           | Parameters                                                                                                                        |
| ------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `list_documents`   | List active documents. Filter by parent folder or search by title.    | `query` (optional string), `parentDocument` (optional string)                                                                     |
| `get_document`     | Retrieve a document note and its contents by ID.                      | `documentId` (string)                                                                                                             |
| `create_document`  | Create a new document note under an optional parent note.             | `title` (string), `parentDocument` (optional string)                                                                              |
| `update_document`  | Update a document note's title, content, icon, or publication status. | `id` (string), `title` (optional string), `content` (optional string), `icon` (optional string), `isPublished` (optional boolean) |
| `archive_document` | Move a document and all its nested children to trash.                 | `id` (string)                                                                                                                     |
| `restore_document` | Restore an archived document and its descendants from trash.          | `id` (string)                                                                                                                     |
| `delete_document`  | Permanently delete a document note from the database.                 | `id` (string)                                                                                                                     |
| `list_trash`       | List all archived notes currently stored in trash.                    | None                                                                                                                              |

## Global Admin Dashboard
A protected administrative dashboard at `/admin` visible only to users configured as global administrators in `config/env.ts`.
- Displays compact metric cards (Total, Active, Published, Authors) with value-on-the-right layout.
- Shows author emails (resolved from Clerk via `/api/admin/users`) instead of UUIDs.
- Table columns: Note title, Author email, Status, Subpage count, Created date, Actions.
- Per-row actions: Open note, Archive/Restore (state-dependent), Delete (with confirmation).
- Search filters by title or author email.
- Author emails are resolved server-side from the Clerk Backend `UserApi` (`/api/admin/users`).
- Metric cards and table rows use Base UI `Tooltip` for action descriptions.
- Metric cards are compact single-row cards (icon + label left, value right).
- Admin-only API route at `/api/admin/users` resolves user IDs to primary emails.

## Model Context Protocol (MCP)

To successfully run Joker Notes on your local environment, follow these detailed instructions. 
Ensure all prerequisites like Node.js are installed beforehand.

## 1. Clone Project Locally
Initiate by cloning the Joker Notes repository to your local machine. Use the following command in your terminal:

```sh
git clone https://github.com/mbeps/joker-notes.git
```

## 2. Install Dependencies
Navigate to the project's root directory. 
Install all necessary dependencies to set up your local environment:

```sh
pnpm install
```

## 3. Set Up Environment Variables & Modify `convex-dev`
Create a `.env.local` file at the root of your project. 
Populate it with the following environment variables:

```env
# Convex Database
CONVEX_DEPLOYMENT=""
NEXT_PUBLIC_CONVEX_URL=""

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

# EdgeStore
EDGE_STORE_ACCESS_KEY=""
EDGE_STORE_SECRET_KEY=""

# Logging (optional, defaults to "info")
# Supported levels: "debug" | "info" | "warn" | "warning" | "error" | "fatal"
LOG_LEVEL="info"
```

Replace the placeholders with your actual keys and URLs from Convex, Clerk, and EdgeStore.

Additionally, for the `convex-dev` command, since `.env` variables cannot be read directly, modify the relevant file with the following configuration:

```js
// const issuerURL = process.env.ISSUER_URL

const convex = {
  providers: [
    {
      domain: 'your_public_convex_url',
      applicationID: 'convex'
    }
  ]
}

export default convex;
```

Ensure to modify the domain and applicationID if different for your setup.

## 4. Logging Configuration
Joker Notes uses [LogTape](https://logtape.org/) for structured, non-blocking server telemetry with fixed-width columnar ANSI formatting.

Log verbosity is controlled via the `LOG_LEVEL` environment variable in `.env.local`:

| Level              | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `debug`            | Detailed query traces, request routing, and internal diagnostic logs |
| `info` *(default)* | Standard operational events and successful service actions           |
| `warn` / `warning` | Recoverable issues, validation warnings, or unauthorized requests    |
| `error`            | Unhandled exceptions, database errors, or route handler failures     |
| `fatal`            | Critical, unrecoverable system errors                                |

## 5. Running Database (Convex)
Keep the Convex database operational during development by executing the following command. 
This is essential for real-time data interaction:

```sh
pnpm convex-dev
```

## 6. Run the Next.JS Application
With your environment variables configured and database running, initiate the Next.js server in another terminal window:

```sh
pnpm dev
```

Alternatively you can build the project fully and run it with the followig commands:

```sh
pnpm build
pnpm start
```

The application should now be running at [`http://localhost:3000`](http://localhost:3000).

**Note:** It's crucial to run both `pnpm convex-dev` for the Convex database and `pnpm dev` for the Next.js server concurrently for the application to function properly.

# References
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Next.JS Documentation](https://nextjs.org/docs)
- [React.JS Documentation](https://react.dev/reference/react)
- [Tailwind CSS Documentation](https://v2.tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/docs/installation/next) 
- [Radix UI Documentation](https://www.radix-ui.com/themes/docs/overview/getting-started)
- [Block Note Documentation](https://www.blocknotejs.org/docs)
- [Clerk Authentication Documentation](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Zod Documentation](https://zod.dev/)
- [Convex Database Documentation](https://docs.convex.dev/quickstart/nextjs)
- [Edge Store Documentation](https://edgestore.dev/)
- [LogTape Documentation](https://logtape.org/)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)