//for non-defined routes

import { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";

const ProfilePage: NextPage = () => {
  const router = useRouter();
  const username = router.query.slug!.slice(1) as string;
  
  const { data, isLoading } = api.profiles.getUserByUsername.useQuery({
    username
  });
  

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>@{data.username}'s Profile</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div>{data.username}</div>
      </main>
    </>
  );
};
import superjson from "superjson";
import { useRouter } from "next/router";
//will be treated like a static asset
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, currentUserId: null },
    transformer: superjson,
  });

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("no slug");

  //lets us fetch data ahead of time and then hydrate it through server side props
  await ssg.profiles.getUserByUsername.prefetch({ username: slug.slice(1) });

  return {
    props: {
      //takes all the things we fetched and puts it into a state that getServerSideProps
      //can understand
      //Means that data is there before page loads
      trpcState: ssg.dehydrate(),
    },
  };
};

export const getStaticPaths = () => {
  //takes paths and fallback behavior
  //The paths key determines which paths will be pre-rendered. For example, suppose that
  //you have a page that uses Dynamic Routes named pages/posts/[id].js.

  //If fallback is 'blocking', new paths not returned by getStaticPaths will wait for the HTML to be generated,
  //identical to SSR (hence why blocking), and then be cached for future requests so it only happens once per path.
  return { paths: [], fallback: "blocking" };
};

export default ProfilePage;
