import { User } from "@clerk/nextjs/dist/api";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profilePicture: user.profileImageUrl,
  };
};

export const postsRouter = createTRPCRouter({
  // this next getAll is a public procedure that the client calls
  getAll: publicProcedure.query(async ({ ctx }) => {
    // take is equivalent of limit in sql, therefore we only will find 100 posts at a time
    const posts = await ctx.prisma.post.findMany({
      take: 100,
    });

    //create a string array containing the author ids for the 100 posts we get using the above method
    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((post) => post.authorId),
        limit: 100,
      })
    ).map(filterUserForClient);

    return posts.map((post) => {{
      const author = users.find((user) => user.id === post.authorId);
      if(!author) throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Author not found"})

      return {
        post: post,
        author: author
      }
    }});
  }),
});
