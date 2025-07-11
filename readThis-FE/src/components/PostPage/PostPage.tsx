import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Post, { PostProps } from "../HomePage/Posts/Post";
import NavBar from "../NavBar/NavBar";
import {
  getPostById,
  addComment,
  updatePost,
  deletePost,
} from "../../Utils/post_service";
import { Button, Typography } from "@mui/material";
import styles from "./PostPage.module.css";
import { FaEdit, FaTrash } from "react-icons/fa";

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostProps | null>(null);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const userId = localStorage.getItem("userId");

  console.log("post-----    ", post);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!id) {
          setError("Post ID is missing");
          return;
        }
        const data = await getPostById(id);
        setPost(data);
      } catch (error) {
        console.error("Error loading post:", error);
        setError("Failed to load post.");
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    console.log("📌 isEditing changed:", isEditing);
  }, [isEditing]);

  const handleCommentSubmit = async () => {
    if (!id || !comment.trim()) {
      setError("Comment cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addComment(id, comment);
      console.log("✅ Comment added. Reloading post...");

      const updatedPost = await getPostById(id);
      setPost(updatedPost);

      setComment("");
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError("Failed to add comment.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedTitle(post?.title || "");
    setEditedContent(post?.content || "");
  };

  const handleSave = async () => {
    if (!post) return;
    try {
      const formData = new FormData();
      formData.append("title", editedTitle);
      formData.append("content", editedContent);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const updatedPost = await updatePost(post.id, formData);

      console.log("updated post---   ", updatedPost);

      setPost(updatedPost);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTitle(post?.title || "");
    setEditedContent(post?.content || "");
    setSelectedImage(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleDelete = async () => {
    console.log("delete post----");
    if (!post) return;

    try {
      await deletePost(post.id);
      console.log("✅ Post deleted successfully.");
      window.location.href = "/";
    } catch (error) {
      console.error("❌ Error deleting post:", error);
      setError("Failed to delete post.");
    }
  };

  if (error) return <p className={styles.error}>{error}</p>;
  if (!post) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <NavBar />
      <main className={styles.main}>
        <div className={styles.postPageContainer}>
          {post.owner.id === userId && (
            <div
              className={`${styles.buttonContainer} ${
                isEditing ? styles.hidden : ""
              }`}
            >
              <button className={styles.editButton} onClick={handleEdit}>
                <FaEdit />
              </button>
              <button className={styles.deleteButton} onClick={handleDelete}>
                <FaTrash />
              </button>
            </div>
          )}

          {isEditing ? (
            <>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className={styles.input}
              />
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className={styles.textarea}
              />
            </>
          ) : (
            <Post
              id={post.id}
              title={post.title}
              content={post.content}
              owner={post.owner}
              usersWhoLiked={post.usersWhoLiked}
              comments={post.comments}
              imageUrl={post.imageUrl}
            />
          )}

          {isEditing && (
            <div className={styles.uploadContainer}>
              <Button
                variant="outlined"
                component="label"
                className={styles.uploadButton}
              >
                Upload new image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </Button>
              {selectedImage && (
                <Typography variant="body2" className={styles.imageName}>
                  Selected file: {selectedImage.name}
                </Typography>
              )}
            </div>
          )}

          {isEditing && (
            <div className={styles.editButtons}>
              <button className={styles.saveButton} onClick={handleSave}>
                Save
              </button>
              <button className={styles.cancelButton} onClick={handleCancel}>
                Cancel
              </button>
            </div>
          )}

          {/* comments */}
          <div className={styles.commentSection}>
            <h3 className={styles.commentTitle}>Comments</h3>
            {post.comments.length > 0 ? (
              <div className={styles.commentList}>
                {post.comments.map((comment) => (
                  <div key={comment.id} className={styles.comment}>
                    <p className={styles.commentUser}>
                      {comment.owner.username}:
                    </p>
                    <p>{comment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noComments}>
                No comments yet. Be the first!
              </p>
            )}

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={styles.commentInput}
              placeholder="Write your comment here..."
            />
            <button
              onClick={handleCommentSubmit}
              className={styles.commentButton}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Comment"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostPage;