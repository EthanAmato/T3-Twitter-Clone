//Now routed to /post/ID_of_post

import { useUser } from "@clerk/nextjs";
import { NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

const SinglePostPage: NextPage = (props) => {
  return (
    <>
      <Head>
        <title>Post</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div>Single Post Page</div>
      </main>
    </>
  );
};

export default SinglePostPage;
