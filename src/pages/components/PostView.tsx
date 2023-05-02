import React from "react";
import { RouterOutputs } from "~/utils/api";

//uses outputs of tRPC router as type for this component
//get the type exported from tRPC from posts getAll query and number specifies we only want 1
type PostWithUser = RouterOutputs["posts"]["getAll"][number];

export const PostView = (props: PostWithUser) => {
  const { post, author } = props;


  return (
    <div className="border-b border-slate-400 p-8" key={post.id}>
        <img src={author.profilePicture} className="rounded-full w-14 h-14" alt={`${author.username}'s Profile picture`}/>
      {post.content}
      {author?.username}
    </div>
  );
};
