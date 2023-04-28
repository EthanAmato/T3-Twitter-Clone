import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const postsRouter = createTRPCRouter({
  // this next getAll is a public procedure that the client calls
  getAll: publicProcedure.query(async ({ ctx }) => {
    // take is equivalent of limit in sql, therefore we only will find 100 posts at a time
    const posts = await ctx.prisma.post.findMany({ 
      take: 2,
    });
    

    //create a string array containing the author ids for the 100 posts we get using the above method
    const users = await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    });

    console.log(users)

    return posts
  })
});
