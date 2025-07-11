import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import styles from "./Home.module.css";
import Post, { PostProps } from "./Posts/Post";
import { getAllPosts } from "../../Utils/post_service";
import { FaPlus } from "react-icons/fa";

// Define the backend IPost structure
export interface IPost {
  id: string;
  title: string;
  content: string;
  owner: {
    id: string;
    username: string;
    image: string;
  };
  usersWhoLiked: string[];
  comments: {
    id: string;
    user: {
      id: string;
      username: string;
      image: string;
    };
    text: string;
  }[];
  imageUrl: string;
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<PostProps[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  const fetchPosts = async (pageNumber = 1) => {
    try {
      setIsLoading(true);
      const res = await getAllPosts(pageNumber, 5);
      const newPosts = Array.isArray(res.posts) ? res.posts : [];
      if (pageNumber === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      }
      setHasMore(pageNumber < res.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load posts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  const handleCreatePost = () => {
    navigate("/newpost"); // Navigate to the "Create New Post" page
  };

  return (
    <div className={styles.container}>
      <NavBar />

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.postsContainer}>
          {isLoading && <p>Loading...</p>}
          {error && <p className={styles.error}>Error: {error}</p>}
          {Array.isArray(posts) && posts.length > 0
            ? posts.map((post) => (
                <Post
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  content={post.content}
                  owner={post.owner}
                  usersWhoLiked={post.usersWhoLiked}
                  comments={post.comments}
                  imageUrl={post.imageUrl}
                />
              ))
            : !isLoading &&
              !error && <p className={styles.noPosts}>No posts available.</p>}
        </div>

        {hasMore && !isLoading && (
          <button onClick={loadMore} className={styles.loadMoreButton}>
            Load More
          </button>
        )}
      </main>

      {/* Create Post Button */}
      <button
        className={styles.createPostButton}
        onClick={handleCreatePost}
        title="Create a New Post"
      >
        <FaPlus className={styles.plusIcon} />
      </button>
    </div>
  );
};

export default Home;
