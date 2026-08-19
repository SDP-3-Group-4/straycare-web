const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchPosts = async (tab?: string, userId?: string, lat?: number, lng?: number) => {
  const queryParams = new URLSearchParams();
  if (tab) queryParams.append('tab', tab);
  if (userId) queryParams.append('userId', userId);
  if (lat !== undefined) queryParams.append('lat', lat.toString());
  if (lng !== undefined) queryParams.append('lng', lng.toString());
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const response = await fetch(`${API_URL}/posts${queryString}`);
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
};

export const updatePost = async (id: string, authorId: string, data: any) => {
  const response = await fetch(`${API_URL}/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorId, ...data }),
  });
  if (!response.ok) throw new Error('Failed to update post');
  return response.json();
};

export const deletePost = async (id: string, authorId: string) => {
  const response = await fetch(`${API_URL}/posts/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorId }),
  });
  if (!response.ok) throw new Error('Failed to delete post');
  return response.json();
};

export const fetchUserProfile = async (id: string) => {
  const response = await fetch(`${API_URL}/users/${id}`);
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
};

export const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/users`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const fetchMarketplaceItems = async () => {
  const response = await fetch(`${API_URL}/marketplace`);
  if (!response.ok) throw new Error('Failed to fetch marketplace items');
  return response.json();
};

export const createPost = async (postData: any) => {
  const response = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  });
  if (!response.ok) throw new Error('Failed to create post');
  return response.json();
};

export const fetchChats = async (userId: string) => {
  const response = await fetch(`${API_URL}/chat?userId=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch chats');
  return response.json();
};

export const createChat = async (userId: string, targetUserId: string) => {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, targetUserId }),
  });
  if (!response.ok) throw new Error('Failed to create chat');
  return response.json();
};

export const fetchMessages = async (userId: string, chatId: string) => {
  const response = await fetch(`${API_URL}/chat/${chatId}/messages?userId=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
};

export const sendMessage = async (userId: string, chatId: string, content: string, imageUrl?: string) => {
  const response = await fetch(`${API_URL}/chat/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, content, imageUrl }),
  });
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
};
export const toggleBookmark = async (userId: string, postId: string) => {
  const response = await fetch(`${API_URL}/bookmarks/${postId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) throw new Error('Failed to toggle bookmark');
  return response.json();
};

export const fetchBookmarks = async (userId: string) => {
  const response = await fetch(`${API_URL}/bookmarks/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch bookmarks');
  return response.json();
};

export const fetchBookmarkStatus = async (userId: string, postId: string) => {
  const response = await fetch(`${API_URL}/bookmarks/${postId}/status/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch bookmark status');
  return response.json();
};

export const toggleLike = async (userId: string, postId: string) => {
  const response = await fetch(`${API_URL}/likes/${postId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) throw new Error('Failed to toggle like');
  return response.json();
};

export const fetchLikeStatus = async (userId: string, postId: string) => {
  const response = await fetch(`${API_URL}/likes/${postId}/status/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch like status');
  return response.json();
};

export const fetchNotifications = async (userId: string) => {
  const response = await fetch(`${API_URL}/notifications/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
};

export const markNotificationRead = async (id: string) => {
  const response = await fetch(`${API_URL}/notifications/${id}/read`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to mark notification read');
  return response.json();
};

export const markAllNotificationsRead = async (userId: string) => {
  const response = await fetch(`${API_URL}/notifications/read-all/${userId}`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to mark all notifications read');
  return response.json();
};

export const fetchConnections = async (userId: string) => {
  const response = await fetch(`${API_URL}/connections/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch connections');
  return response.json();
};

export const fetchConnectionStatus = async (userId1: string, userId2: string) => {
  const response = await fetch(`${API_URL}/connections/status/${userId1}/${userId2}`);
  if (!response.ok) throw new Error('Failed to fetch connection status');
  return response.json();
};

export const requestConnection = async (requesterId: string, recipientId: string) => {
  const response = await fetch(`${API_URL}/connections/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesterId, recipientId }),
  });
  if (!response.ok) throw new Error('Failed to request connection');
  return response.json();
};

export const acceptConnection = async (recipientId: string, requesterId: string) => {
  const response = await fetch(`${API_URL}/connections/${recipientId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesterId }),
  });
  if (!response.ok) throw new Error('Failed to accept connection');
  return response.json();
};

export const declineConnection = async (recipientId: string, requesterId: string) => {
  const response = await fetch(`${API_URL}/connections/${recipientId}/decline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesterId }),
  });
  if (!response.ok) throw new Error('Failed to decline connection');
  return response.json();
};

export const fetchComments = async (postId: string, userId?: string) => {
  const queryString = userId ? `?userId=${userId}` : '';
  const response = await fetch(`${API_URL}/posts/${postId}/comments${queryString}`);
  if (!response.ok) throw new Error('Failed to fetch comments');
  return response.json();
};

export const addComment = async (postId: string, userId: string, content: string) => {
  const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, content }),
  });
  if (!response.ok) throw new Error('Failed to add comment');
  return response.json();
};

export const updateComment = async (id: string, userId: string, content: string) => {
  const response = await fetch(`${API_URL}/comments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, content }),
  });
  if (!response.ok) throw new Error('Failed to update comment');
  return response.json();
};

export const deleteComment = async (id: string, userId: string) => {
  const response = await fetch(`${API_URL}/comments/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) throw new Error('Failed to delete comment');
  return response.json();
};

export const toggleCommentLike = async (id: string, userId: string) => {
  const response = await fetch(`${API_URL}/comments/${id}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) throw new Error('Failed to toggle comment like');
  return response.json();
};

export const donateToPost = async (postId: string, userId: string, amount: number) => {
  const response = await fetch(`${API_URL}/posts/${postId}/donate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount }),
  });
  if (!response.ok) throw new Error('Failed to process donation');
  return response.json();
};

export const createOrder = async (userId: string, total: number) => {
  const response = await fetch(`${API_URL}/marketplace/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, total }),
  });
  if (!response.ok) throw new Error('Failed to create order');
  return response.json();
};
export const fetchUserOrders = async (userId: string) => {
  const response = await fetch(`${API_URL}/marketplace/orders/user/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user orders');
  return response.json();
};

export const updateUserProfile = async (id: string, data: any) => {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update user profile');
  return response.json();
};
