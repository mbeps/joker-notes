import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|md|mp4|webm|png|jpg|jpeg|svg|gif|ico|woff2)).*)",
  ],
};

