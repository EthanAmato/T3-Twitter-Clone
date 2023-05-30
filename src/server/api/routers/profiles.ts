import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";
export const profileRouter = createTRPCRouter({
  getUserByUsername: publicProcedure.input(z.object({ username: z.string() })).
    query(async ({ctx, input}) => {
        //get the first user from the query and get it out of the array
        const [user] = await clerkClient.users.getUserList({
            username: [input.username]
        })
        if (!user) {
            throw new TRPCError({
                code:"INTERNAL_SERVER_ERROR",
                message:"User Not Found"
            })
        }

        return filterUserForClient(user)

    })
});
