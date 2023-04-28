import { SignIn, SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { CreatePostWizard } from "./components/CreatePostWizard";
import { api } from "~/utils/api";

const Home: NextPage = () => {

  const user = useUser()

  //this code runs on user's device while the tRPC router code it calls runs on our servers
  const { data, isLoading } = api.posts.getAll.useQuery();

  if (isLoading) return <div>Loading...</div>
  if (!data) return <div>Something Went Wrong...</div>

  console.log(data)

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center h-screen">
        {/* div is full width unless we are > threshold for md */}
        <div className="w-full h-full md:max-w-2xl border-slate-400 border-x">
          <div className="flex p-4 border-b-2 border-slate-400">
            {!user.isSignedIn &&
              <div className="flex justify-center">
                <SignInButton />
              </div>
            }
            {!!user.isSignedIn &&
              <CreatePostWizard />
            }
          </div>
          <div className="flex flex-col">
            {
              data?.map((post) => (
                <div className="p-8 border-b border-slate-400" key={post.id}>{post.content}</div>
              )
              )
            }
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
