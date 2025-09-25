// API configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log("🌐 API Call:", url, "Options:", options);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  console.log("📡 API Response Status:", response.status, response.statusText);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("❌ API Error:", errorData);
    throw new Error(
      errorData.message ||
        `Failed to ${
          endpoint.includes("friends") ? "get friends list" : "perform API call"
        }`
    );
  }

  const data = await response.json();
  console.log("✅ API Response Data:", data);
  return data;
};

// Helper to add auth token
export const apiCallWithAuth = async (endpoint, options = {}, user) => {
  console.log("🔐 API Call with Auth:", endpoint);
  console.log("👤 User object:", user ? "User exists" : "No user");

  if (!user) {
    console.error("❌ No user provided for authenticated API call");
    throw new Error("User authentication required");
  }

  try {
    const token = await user.getIdToken();
    console.log(
      "🎫 Token for API call:",
      token ? token.substring(0, 50) + "..." : "No token"
    );

    if (!token) {
      console.error("❌ No token available");
      throw new Error("Authentication token not available");
    }

    return apiCall(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch (error) {
    console.error("❌ Error getting token for API call:", error);
    throw error;
  }
};
