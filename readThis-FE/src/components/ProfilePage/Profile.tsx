import React, { useState, useEffect } from "react";
import NavBar from "../NavBar/NavBar";
import IconButton from "@mui/material/IconButton";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
// import { useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";
import { getMyProfile, updateProfile } from "../../Utils/user_service";
import { getMyPosts } from "../../Utils/post_service";
import { SERVER_URL } from "../../Utils/vars";
import Post, { PostProps } from "../HomePage/Posts/Post";

interface IUser {
  id: string;
  username: string;
  email: string;
  imageUrl: string;
}

export interface IPost {
  id: string;
  title: string;
  content: string;
  owner: {
    id: string;
    username: string;
    image: string;
  }; // Backend uses 'owner' instead of 'author'
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
  imageUrl: string;
}

const Profile: React.FC = () => {
  // const navigate = useNavigate();
  const [user, setUser] = useState<IUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newProfileImage, setNewProfileImage] = useState<string | null>(null);
  const [newProfileImageFile, setNewProfileImageFile] = useState<File | null>(null);
  const [posts, setPosts] = useState<PostProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const userData = await getMyProfile();
      setUser(userData);
      setNewUsername(userData.username);
    } catch (err: any) {
      setError(err.message || "Failed to fetch user data.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
        try {
          setIsLoading(true);
          const data = await getMyPosts(); // Fetch backend posts
  
          // Transform IPost to PostProps
          const transformedPosts: PostProps[] = data.map((post) => ({
            id: post.id,
            title: post.title,
            content: post.content,
            owner: post.owner, // Map 'owner' to 'author'
            usersWhoLiked: post.usersWhoLiked,
            comments: post.comments,
            imageUrl: post.imageUrl,
          }));
          console.log("Profile image URL in React:", user?.imageUrl);
          setPosts(transformedPosts);
          setError(null);
        } catch (err: any) {
          setError(err.response?.data?.message || "Failed to load posts.");
        } finally {
          setIsLoading(false);
        }
      };

  useEffect(() => {
    fetchUserData();
    fetchUserPosts();
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setNewProfileImage(URL.createObjectURL(event.target.files[0]));
      setNewProfileImageFile(event.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (user) {
      const formData = new FormData();
      formData.append("username", newUsername);
      if (newProfileImageFile) formData.append("image", newProfileImageFile);

      try {
        const updatedUser = await updateProfile(formData);
        setUser(updatedUser);
        setNewProfileImage(null);
        setIsEditing(false);
      } catch (err: any) {
        setError(err.message || "Error saving profile.");
      }
    }
  };

  if (isLoading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!user) return <div className={styles.error}>No user data found.</div>;

  return (
    <div className={styles.container}>
      <NavBar />
      <div className={styles.profileBox}>
        <h2 className={styles.sectionTitle}>My Profile</h2>
        <div className={styles.profileCard}>
          <div className={styles.profileImageContainer}>
            {isEditing ? (
              <>
                <label htmlFor="profileImageUpload" className={styles.uploadIcon}>
                  <CloudUploadIcon fontSize="large" />
                </label>
                <input
                  type="file"
                  id="profileImageUpload"
                  accept="image/*"
                  className={styles.hiddenInput}
                  onChange={handleImageChange}
                />
              </>
            ) : (
              <img
                className={styles.profileImage}
                src={
                  newProfileImage ||
                  (user.imageUrl?.startsWith("http") ? user.imageUrl : `${SERVER_URL}${user.imageUrl}`)
                }
                alt={user.username}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              
            )}
          </div>
          <div className={styles.profileDetails}>
            {isEditing ? (
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className={styles.usernameInput}
              />
            ) : (
              <h3 className={styles.username}>{user.username}</h3>
            )}
            <p className={styles.email}>{user.email}</p>
          </div>
          <IconButton
            className={styles.editButton}
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            {isEditing ? <SaveIcon /> : <EditIcon />}
          </IconButton>
        </div>
      </div>

      <div className={styles.postsBox}>
          {isLoading && <p>Loading...</p>}
          {error && <p className={styles.error}>Error: {error}</p>}
          {!isLoading && !error && posts.length > 0
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
              !error && (
                <p className={styles.noPosts}>
                  No posts available at the moment.
                </p>
              )}
        </div>
    </div>
  );
};

export default Profile;