Introducing Motion Notes, a versatile and user-centric platform designed to revolutionize the way you create, manage, and publish notes. Building upon the concept of intuitive and interactive platforms, Motion Notes brings together a powerful suite of features aimed at boosting productivity and enhancing user experience. From seamless sign-up processes and customizable viewing options to sophisticated note organization and management, Motion Notes caters to all your note-taking needs. Whether you're jotting down ideas, compiling research, or sharing insights, our platform is engineered to provide a seamless, flexible, and enjoyable note-taking journey. Get ready to experience the next level of note-taking with Motion Notes.

# **Features**

Our platform, Motion Notes, offers a variety of features aimed at enhancing productivity and user experience through an intuitive and feature-rich notes application. Here are the key features:

## **Authentication and Account Management**
Motion Notes ensures a secure and seamless user experience with robust authentication options:
- **Email and Password Sign Up:** Users can sign up using their email and password.
- **Email and Password Login:** Users can log in using their email and password.
- **Third-Party Authentication:** Users can authenticate using various third-party providers, including Google, Microsoft, LinkedIn, GitHub, Discord, and Apple.

## **User Interface and Experience**
We prioritize user comfort and customization:
- **Light and Dark Mode:** Users can switch between light and dark mode to suit their preference or ambient light conditions.

## **Rich Text Notes**
Create, customize, and manage your notes with ease:
- **Rich Text Editing:** Users can create notes with rich text formatting, similar to Notion, allowing for a variety of text customizations and styles.
- **Images and Cover Images:** Users can enhance their notes by adding images and cover images to visually represent the content.
- **Publishing Notes:** Users have the option to publish their notes, making them publicly visible (but not editable) to share their content with others.
- **Nested Notes and Notebooks:** Users can create structured documentation and organize their thoughts more efficiently with the ability to create nested notes and notebooks.
- **Note Management:** Users can move notes to trash, restore them, or permanently delete them, giving full control over their note lifecycle.

These features are designed to provide a comprehensive, user-friendly experience for personal or professional note-taking and content management. Motion Notes is built to be flexible, powerful, and accessible, catering to a wide range of note-taking and organizational needs.

# **Tech Stack**

Our platform, Motion Notes, is built on a robust and modern technology stack designed to deliver a seamless and feature-rich user experience. Here's a breakdown of the technologies employed:

## **Frontend**

- **[Next.js](https://nextjs.org/)**: A powerful React-based framework that allows for server-side rendering (SSR) and generation of static websites, ensuring fast load times and a dynamic user experience.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework used for creating custom and responsive designs quickly and efficiently without having to leave your HTML.
- **[Shadcn UI](https://ui.shadcn.com/)**: A comprehensive collection of accessible and customizable components built with Radix UI and Tailwind CSS, offering developers an easy start and consistency across the application.
- **[BlockNote](#)**: A rich text editor providing robust functionality for creating, managing, and displaying rich text notes, similar to Notion, enhancing the note-taking experience with versatile content creation capabilities.

## **Backend**

- **[Node.js](https://nodejs.org/en/)**: A JavaScript runtime built on Chrome's V8 JavaScript engine, known for its efficiency and scalability in building network applications.
- **[Clerk Auth](https://clerk.com/)**: A user-friendly authentication and user management service, providing various authentication strategies and a comprehensive user management system.
- **[Zod](https://github.com/colinhacks/zod)**: A TypeScript-first schema declaration and validation library that ensures type-safe data handling and REST APIs.

- **[Convex](https://www.convex.dev/)**: A developer-friendly database emphasizing reactivity and ease of use. It combines a relational data model with JSON-like documents, offering intuitive JavaScript APIs, automatic query optimization, and built-in reactivity for real-time applications.
- **[EdgeStore](https://edgestore.dev/)**: A file storage solution specifically designed for Next.js, providing a type-safe way to manage file uploads and retrievals. It integrates seamlessly with Next.js, offering access control, metadata handling, lifecycle hooks, and automatic thumbnail generation, among other features.

This tech stack is carefully selected to ensure that Motion Notes offers a smooth, efficient, and highly customizable user experience. It reflects our commitment to leveraging the best tools available for developing high-quality, robust, and user-friendly applications.

# **Running Application Locally**

To successfully run Motion Notes on your local environment, follow these detailed instructions. Ensure all prerequisites like Node.js are installed beforehand.

## 1. **Clone the Project Locally**
Initiate by cloning the Motion Notes repository to your local machine. Use the following command in your terminal:

```sh
git clone https://github.com/mbeps/motion.git
```

## 2. **Install Dependencies**
Navigate to the project's root directory. Install all necessary dependencies to set up your local environment:

```sh
yarn install
```

## 3. **Set Up Environment Variables and Modify `convex-dev`**
Create a `.env.local` file at the root of your project. Populate it with the following environment variables:

```env
# Convex Database
CONVEX_DEPLOYMENT=your_convex_deployment_string
NEXT_PUBLIC_CONVEX_URL=your_public_convex_url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk & Convex
ISSUER_URL=your_issuer_url

# EdgeStore
EDGE_STORE_ACCESS_KEY=your_edge_store_access_key
EDGE_STORE_SECRET_KEY=your_edge_store_secret_key
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

## 4. **Running Database (Convex)**
Keep the Convex database operational during development by executing the following command. This is essential for real-time data interaction:

```sh
yarn convex-dev
```

## 5. **Run the Next.js Application**
With your environment variables configured and database running, initiate the Next.js server in another terminal window:

```sh
yarn dev
```

This command starts the development server, usually available at `localhost:3000`. Access it via your browser to interact with your instance of Motion Notes.

**Note:** It's crucial to run both `yarn convex-dev` for the Convex database and `yarn dev` for the Next.js server concurrently for the application to function properly.

