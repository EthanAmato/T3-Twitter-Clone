import { User } from "@clerk/nextjs/dist/api";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";


import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 20 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 m"),
});

export const postsRouter = createTRPCRouter({
  // this next getAll is a public procedure that the client calls
  getAll: publicProcedure.query(async ({ ctx }) => {
    // take is equivalent of limit in sql, therefore we only will find 100 posts at a time
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });

    //create a string array containing the author ids for the 100 posts we get using the above method
    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((post) => post.authorId),
        limit: 100,
      })
    ).map(filterUserForClient);

    return posts.map((post) => {
      {
        const author = users.find((user) => user.id === post.authorId);
        if (!author || !author.username)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Author not found",
          });

        return {
          post: post,
          author: author,
        };
      }
    });
  }),

  //Zod is a validator often used for forms
  //invented originally to see if a given piece of data matches a specific shape

  create: privateProcedure
    .input(
      z.object({
        //ensures that thecontent is a string that is between 1 and 280 characters
        content: z.string().min(1).max(280),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.currentUserId;

      //Ensure that the author trying to post is functioning within our 20 requests per 1 min ruling
      //Now our project 1. Guarantees that you have to have a valid cookie to even post and 2. if you post too much you are blocked from doing so
      const { success } = await ratelimit.limit(authorId);
      if(!success) throw new TRPCError({code: "TOO_MANY_REQUESTS"});

      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });

      return post;
    }),
});
