import api from "./api";
import { SERVER_URL } from "./vars";

// Interfaces for API responses
interface IUser {
  id: string;
  username: string;
  email: string;
  imageUrl: string;
  refreshToken?: string[];
}

interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  id: string;
}

// Register a new user
export const registerUser = async (formData: FormData): Promise<IUser> => {
  const response = await api.post<IUser>(
    `/auth/register`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Login a user
export const loginUser = async (
  username: string,
  password: string
): Promise<IAuthResponse> => {
  const response = await api.post<IAuthResponse>(`${SERVER_URL}/auth/login`, {
    username,
    password,
  });
  // Save tokens in localStorage
  console.log("testing");
  console.log(response);
  console.log(response.data.id);
  localStorage.setItem("userId", response.data.id);
  saveTokens(response.data.accessToken, response.data.refreshToken);
  return response.data;
};

// Logout a user
export const logoutUser = async (refreshToken: string): Promise<void> => {
  await api.post(`${SERVER_URL}/auth/logout`, { refreshToken });
  clearTokens(); // Clear tokens from localStorage
};

// Refresh tokens
export const refreshTokens = async (): Promise<void> => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token found");

  const response = await api.post(`${SERVER_URL}/auth/refresh`, {
    refreshToken,
  });
  const { accessToken, refreshToken: newRefreshToken } = response.data;

  // Save new tokens
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", newRefreshToken);
};

// Get user's profile (new addition)
export const getMyProfile = async (): Promise<IUser> => {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("No access token found.");

  const response = await api.get<IUser>(`${SERVER_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
};

// Token Management Utilities
export const saveTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

export const clearTokens = (): void => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

export const updateProfile = async (formData: FormData): Promise<IUser> => {
  const token = localStorage.getItem("accessToken");
  const response = await api.put<IUser>(`${SERVER_URL}/auth/profile`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  image: string;
  __v: number;
}

export const getUser = async (): Promise<UserResponse> => {
  const { data, status } = await api.get(`${SERVER_URL}/auth/me`);
  if (status !== 200) {
      throw new Error('Error getting user');
  }

  return data;
};


export const googleSignin = async (tokenId: string): Promise<void> => {
  const { data, status } = await api.post(`${SERVER_URL}/auth/google-auth`, {
    credential: tokenId,
  });

  if (status !== 200) {
    throw new Error('Error logging in with Google');
  }

  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('userId', (await getUser()).id);
};