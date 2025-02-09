import {useRouter} from "next/navigation";

export function checkUserRole(allowedRoles) {
  if (typeof window === "undefined") return null; //Prevent errors in SSR
  const router = useRouter();  
  const storedUser = localStorage.getItem("user");
  
    if (!storedUser) {
      router.push("/login"); // Redirect if no user is found
      return null;
    }
  
    try {
      const parsedUser = JSON.parse(storedUser);
  
      if (!allowedRoles.includes(parsedUser.role)) {
        router.push (`/dashboard/${parsedUser.role}`); // Redirect unauthorized users
        return null;
      }
  
      return parsedUser.role; // Return the user role if valid
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
      return null;
    }
  }
  