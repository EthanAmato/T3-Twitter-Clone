/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";

import { prisma } from "~/server/db";

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * Additional middleware for every single tRPC request
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = (_opts: CreateNextContextOptions) => {
  const { req } = _opts;

  //Can pass req to clerk. Technically not fetching user from Clerk each time since Clerk is using JWT
  //it is able to verify whether a user is authenticated on our server using the signature of the JWT.
  //Skips a callback to  their server to see if user is authenticated.
  const sesh = getAuth(req);

  //user can be User | null | undefined
  const userId = sesh.userId;
  console.log(userId)
  return {
    prisma,
    currentUserId: userId,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getAuth } from "@clerk/nextjs/server";

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

//won't always have auth, but we can make a procedure that enforces that we do
//extend public Procedure with new middleware. Useful for attaching auth and ensuring authentication
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  //accessing the object sent back by createTRPCContext defined above
  //if there is no valid session token received back from the useAuth hook from clerk, throw error
  if (!ctx.currentUserId) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "User is not authenticated" 
    });
  }

  //enforces that session exists
  return next({
    ctx: {
      currentUserId: ctx.currentUserId,
    },
  });
});

export const privateProcedure = t.procedure.use(enforceUserIsAuthed)