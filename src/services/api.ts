const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

import { getAuthToken } from '../firebase';

export const UNAUTHORIZED_EVENT = 'straycare:unauthorized';
export const CONNECTIONS_UPDATED_EVENT = 'straycare:connections-updated';

async function request(path: string, init: RequestInit = {}): Promise<any> {
  const token = await getAuthToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');
  headers.set('Accept-Charset', 'utf-8');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (response.status === 401) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new Error('Session expired. Please sign in again.');
  }
  if (response.status === 429) {
    const text = await response.text();
    throw new Error(text ? JSON.parse(text).message || 'Rate limit exceeded. Please wait a moment.' : 'Rate limit exceeded. Please wait a moment.');
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.message) message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch { /* non-JSON error body */ }
    const err: any = new Error(message);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

const postJson = (path: string, data: any) =>
  request(path, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(data) });

const putJson = (path: string, data: any) =>
  request(path, { method: 'PUT', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(data) });

const deleteJson = (path: string, data: any) =>
  request(path, { method: 'DELETE', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(data) });

export const fetchPosts = (tab?: string, userId?: string, lat?: number, lng?: number) => {
  const queryParams = new URLSearchParams();
  if (tab) queryParams.append('tab', tab);
  if (userId) queryParams.append('userId', userId);
  if (lat !== undefined) queryParams.append('lat', lat.toString());
  if (lng !== undefined) queryParams.append('lng', lng.toString());

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return request(`/posts${queryString}`);
};

export const createPost = (postData: any) => postJson('/posts', postData);

export const updatePost = (id: string, data: any) => putJson(`/posts/${id}`, data);

export const deletePost = (id: string) => deleteJson(`/posts/${id}`, {});

export const fetchUserProfile = async (id: string) => {
  try {
    return await request(`/users/${id}?t=${Date.now()}`);
  } catch (e: any) {
    if (e?.status === 404) return null;
    throw e;
  }
};

export const createUserProfile = (userData: any) => postJson('/users', userData);

export const fetchUsers = () => request('/users');

export const fetchMarketplaceItems = () => request('/marketplace');

export const fetchChats = (userId: string) => request(`/chat?userId=${userId}`);

export const createChat = (targetUserId: string) =>
  postJson('/chat', { targetUserId });

export const fetchMessages = (userId: string, chatId: string) =>
  request(`/chat/${chatId}/messages?userId=${userId}`);

export const sendMessage = (chatId: string, content: string, imageUrl?: string) =>
  postJson(`/chat/${chatId}/messages`, { content, imageUrl });

export const deleteChat = (chatId: string) =>
  request(`/chat/${chatId}`, { method: 'DELETE' });

export const clearChat = (chatId: string) =>
  postJson(`/chat/${chatId}/clear`, {});

export const blockChat = (chatId: string) =>
  postJson(`/chat/${chatId}/block`, {});

export const leaveChat = deleteChat;

export const toggleBookmark = (postId: string) => postJson(`/bookmarks/${postId}`, {});

export const fetchBookmarks = (userId: string) => request(`/bookmarks/${userId}`);

export const fetchBookmarkStatus = (postId: string, userId: string) =>
  request(`/bookmarks/${postId}/status/${userId}`);

export const toggleLike = (postId: string) => postJson(`/likes/${postId}`, {});

export const fetchLikeStatus = (postId: string, userId: string) =>
  request(`/likes/${postId}/status/${userId}`);

export const fetchNotifications = (userId: string) => request(`/notifications/${userId}`);

export const markNotificationRead = (id: string) => postJson(`/notifications/${id}/read`, {});

export const markAllNotificationsRead = (userId: string) =>
  postJson(`/notifications/read-all/${userId}`, {});

export const fetchConnections = (userId: string) => request(`/connections/${userId}`);

export const fetchConnectionStatus = (userId1: string, userId2: string) =>
  request(`/connections/status/${userId1}/${userId2}`);

export const requestConnection = (recipientId: string) =>
  postJson('/connections/request', { recipientId });

export const acceptConnection = (requesterId: string) =>
  postJson(`/connections/${requesterId}/accept`, {});

export const declineConnection = (requesterId: string) =>
  postJson(`/connections/${requesterId}/decline`, {});

export const disconnectConnection = (userId: string) =>
  request(`/connections/${userId}`, { method: 'DELETE' });

export const fetchComments = (postId: string, userId?: string) => {
  const queryString = userId ? `?userId=${userId}` : '';
  return request(`/posts/${postId}/comments${queryString}`);
};

export const addComment = (postId: string, content: string) =>
  postJson(`/posts/${postId}/comments`, { content });

export const updateComment = (id: string, content: string) => putJson(`/comments/${id}`, { content });

export const deleteComment = (id: string) => deleteJson(`/comments/${id}`, {});

export const toggleCommentLike = (id: string) => postJson(`/comments/${id}/like`, {});

export const donateToPost = (postId: string, amount: number) =>
  postJson(`/posts/${postId}/donate`, { amount });

export const createOrder = (total: number) => postJson('/marketplace/order', { total });

export const fetchUserOrders = (userId: string) => request(`/marketplace/orders/user/${userId}`);

export const touchPresence = (_uid: string) => postJson('/users/presence', {});

export const updateUserProfile = (id: string, data: any) => putJson(`/users/${id}`, data);

export const submitVetApplication = (data: {
  fullName: string;
  dob?: string;
  clinic: string;
  nid: string;
  photoName?: string;
  photoBase64?: string;
  docName?: string;
  docMimeType?: string;
  docBase64?: string;
}) => postJson('/vet-applications', data);

export const fetchVetApplicationStatus = (userId: string) => request(`/vet-applications/${userId}`);