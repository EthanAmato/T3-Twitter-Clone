import {
  SignIn,
  SignInButton,
  SignOutButton,
  useUser,
} from "@clerk/clerk-react";
import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import router, { useRouter } from "next/router";
import { useSession } from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
dayjs.extend(relativeTime);
//uses outputs of tRPC router as type for this component
//get the type exported from tRPC from posts getAll query and number specifies we only want 1
type PostWithUser = RouterOutputs["posts"]["getAll"][number];

export const PostView = (props: PostWithUser) => {
  const { post, author } = props;

  return (
    <div className="flex gap-3 border-b border-slate-400 p-4" key={post.id}>
      <Image
        src={author.profilePicture}
        className="h-14 w-14 rounded-full"
        alt={`@${author.username}'s Profile picture`}
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex gap-1 font-bold text-slate-300">
          {/* Link allows for prefetching */}
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{` • ${dayjs(
              post.createdAt
            ).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-xl">{post.content}</span>
      </div>
    </div>
  );
};

export const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState("");

  //obtain context of the tRPC cache -
  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      //Invalidating a query (getAll in this case) tells React Query / tRPC that a query is now out of date and that it is
      //necessary to refetch it
      //In this case, we have added a new post to the database and as soon as that post has been successfully added, the current
      //State of the feed is no longer valid and needs to be updated. This is why we invalidate the getAll so that Feed can refetch
      //the most up to date data
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post! Please try again later.");
      }
    },
  });

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <img
        className="h-14 w-14 rounded-full"
        src={user.profileImageUrl}
        alt="Profile Image"
      />
      <input
        className="grow bg-transparent p-2 outline-none"
        placeholder="Speak your truth!"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting} //disabled when we are in the process of mutating to the DB using tRPC mutation route
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            mutate({ content: input });
            setInput("");
          }
        }}
      />
      {input !== "" && !isPosting && (
        <button
          onClick={() => {
            mutate({ content: input });
            setInput("");
          }}
        >
          Post
        </button>
      )}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading, error } = api.posts.getAll.useQuery();

  if (postsLoading) {
    return (
      <>
        <LoadingPage />
      </>
    );
  }

  if (!data) return <div>Something went wrong...</div>;

  return (
    <div className="flex flex-col">
      {data?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = (props) => {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  console.log("soft reload");

  //this code runs on user's device while the tRPC router code it calls runs on our servers
  //start fetching asap - thanks to react query, you only need to fetch data once and then subsequent fetches can access the cached data
  //tRPC integrates with React Query to provide a simple and efficient way to fetch and cache data on the client-side. The useQuery() function
  //is a hook provided by React Query that simplifies the process of fetching and caching data.
  api.posts.getAll.useQuery();

  if (!userLoaded) return <div />;

  return (
    <>
      <Head>
        <title>T3 Twitter Clone</title>
        <meta name="description" content="Get the benefits of sharing your thoughts without the clutter of traditional twitter ;)" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        {/* div is full width unless we are > threshold for md */}
        <div className="h-full w-full border-x border-slate-400 md:max-w-2xl">
          <div className="flex border-b-2 border-slate-400 p-4">
            {!isSignedIn && (
              <div className="flex justify-center">
                <SignInButton />
              </div>
            )}
            {!!isSignedIn && (
              <>
                <CreatePostWizard />
                <SignOutButton />
              </>
            )}
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
