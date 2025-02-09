export function checkUserRole(allowedRoles) {
    const storedUser = localStorage.getItem("user");
  
    if (!storedUser) {
      window.location.href = "/login"; // Redirect if no user is found
      return null;
    }
  
    try {
      const parsedUser = JSON.parse(storedUser);
  
      if (!allowedRoles.includes(parsedUser.role)) {
        window.location.href = "/dashboard/" + parsedUser.role; // Redirect unauthorized users
        return null;
      }
  
      return parsedUser.role; // Return the user role if valid
    } catch (error) {
      console.error("Error parsing user data:", error);
      window.location.href = "/login";
      return null;
    }
  }
  