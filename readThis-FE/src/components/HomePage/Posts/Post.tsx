import React, { useState } from "react";
import { FaHeart, FaComment } from "react-icons/fa";
import { likePost, unlikePost } from "../../../Utils/post_service";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./Post.module.css";
import { DEFAULT_IMAGE } from "../../../Utils/vars";

// Define PostProps interface
export interface PostProps {
  id: string;
  title: string;
  content: string;
  owner: {
    id: string;
    username: string;
    image: string;
  };
  imageUrl: string;
  usersWhoLiked: string[];
  comments: {
    id: string;
    owner: {
      id: string;
      username: string;
      image: string;
    };
    text: string;
  }[];
}

const Post: React.FC<PostProps> = ({
  id,
  title,
  content,
  owner,
  usersWhoLiked = [],
  comments = [],
  imageUrl,
}) => {
  const navigate = useNavigate();
  const [, setOpen] = useState(false);
  const [liked, setLiked] = useState(
    localStorage.getItem("userId")
      ? usersWhoLiked.includes(localStorage.getItem("userId")!)
      : false
  );


  const handleLike = async () => {
    try {
      if (liked) {
        await unlikePost(id);
        setLiked(false);
        usersWhoLiked.splice(
          usersWhoLiked.indexOf(localStorage.getItem("userId")!),
          1
        );
      } else {
        await likePost(id);
        setLiked(true);
        usersWhoLiked.push(localStorage.getItem("userId")!);
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setOpen(true);
      }
      console.log(error);
    }
  };

  const handleViewPost = () => {
    navigate(`/post/${id}`);
  };

  return (
    <div className={styles.post}>
      {/* Post Title */}
      <h3 className={styles.title} onClick={handleViewPost}>
        {title}
      </h3>

      {imageUrl && (
        <img
          src={`${imageUrl}`}
          alt="Post image"
          className={styles.postImage}
          onError={(event) => {
            event.currentTarget.src = DEFAULT_IMAGE;
          }}
        />
      )}

      {/* Post Content */}
      <p className={styles.content}>{content}</p>

      {/* Post Author */}
      <p className={styles.author}>Written by: {owner.username}</p>

      {/* Like and Comment Actions */}
      <div className={styles.actionContainer}>
        {/* Like Section */}
        <div className={styles.likeContainer}>
          <FaHeart
            className={`${styles.likeIcon} ${liked ? styles.liked : ""}`}
            onClick={handleLike}
          />
          <span className={styles.likeCount}>{usersWhoLiked.length}</span>
        </div>

        {/* Comment Section - */}
        <div className={styles.commentContainer} onClick={handleViewPost}>
          {" "}
          <FaComment className={styles.commentIcon} />
          <span className={styles.commentCount}>{comments.length}</span>
        </div>
      </div>
    </div>
  );
};

export default Post;
