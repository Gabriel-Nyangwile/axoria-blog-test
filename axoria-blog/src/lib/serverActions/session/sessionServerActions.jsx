"use server";
import { connectToDB } from "@/lib/utils/db/connectToDB";
import { User } from "@/lib/models/user";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import { Session } from "@/lib/models/session";
import { cookies } from "next/headers";
import  { revalidateTag} from "next/cache"

export async function register(formData) {
  //On déstructure en définissant une constante avec nos données résultants de formulaire en objet classique depuis l'objet formData :

  const { userName, email, password, passwordRepeat } =
    Object.fromEntries(formData);
  //On vérifie que les champs ne sont pas vides

  try {
    if (typeof userName !== "string" || userName.trim().length < 3) {
      throw new AppError("Username must be at least 3 characters long");
    }
    if (typeof password !== "string" || password.trim().length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }
    if (password !== passwordRepeat) {
      throw new AppError("Passwords do not match");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== "string" || !emailRegex.test(email.trim())) {
      throw new AppError("Invalid email format");
    }

    await connectToDB();
    const user = await User.findOne({ 
      $or: [{ userName }, { email: email }]
    });

    if (user) {
      throw new Error(user.userName === userName ? "Username already exists" : "Email already exists");
    }
    const normalizedUserName = slugify(userName, { lower: true, strict: true });
    //On va saler le mot de passe ! On fera appel à une librairie qui s'appelle bcryptjs (à installer via npm install)

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      userName,
      normalizedUserName,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    console.log("User saved to db");
    return { success: true };
  } catch (error) {
    console.log("Error while registering :", error);
    // On gère les erreurs en renvoyant un message d'erreur approprié

    if(error instanceof AppError){
      throw error
    }

    throw new Error(
      error.message || "An error occured while registering !"
    );
  }
}
export async function login(formData) {
  const { userName, password } = Object.fromEntries(formData);
  if (!userName || !password) {
    throw new Error("Username and password are required");
  }
  try {
    await connectToDB();
    const user = await User.findOne({ userName });
    if (!user) {
      throw new Error("Invalid credentials");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }
    // Here you would typically create a session or a JWT token

    let session;
    const existingSession = await Session.findOne({
      userId: user._id,
      expiresAt: { $gt: new Date() }, // Check for active session
    });
    if (existingSession) {
      session = existingSession;
      existingSession.expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ); // Extend session by 1 week
      await existingSession.save();
    } else {
      session = new Session({
        userId: user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      });
      await session.save();
    }

    const cookieStore = await cookies();

    cookieStore.set("sessionId", session._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 1 week
      sameSite: "lax", // Adjust as necessary for your application
    });
    revalidateTag("auth-session");//On met en cache l'authentification'
    return { success: true, userId: user._id.toString() };

  } catch (error) {
    console.log("Error while logging in the user :", error);
    throw new Error(
      error.message || "An error occured while logging in the user !"
    );
  }
}
export async function logOut() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;
  

  try {
    await Session.findByIdAndDelete(sessionId);
    cookieStore.set("sessionId", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0, // Expire the cookie immediately
      sameSite: "strict",
    });
    revalidateTag("auth-session");//On met en cache l'authentification'
    return { success: true };

  } catch (error) {
    console.log("Error while logging out the user :", error);
    return {
      success: false,
      error: error.message || "An error occured while logging out the user !",
    };
  }
}
export async function isPrivatePage(pathname) {
  const privateSegments = ["/dashboard", "/settings/profile"];
  return privateSegments.some(
    (segment) => pathname === segment || pathname.startsWith(segment + "/")
  );
}

export async function SAsessionInfo() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;
    
    if (!sessionId) {
        return { success: false, userId: null};
    }
    
    await connectToDB();
    
    const session = await Session.findById(sessionId);

    if (!session || session.expiredAt < new Date()) {
        return { success: false, userId: null};
    }
    
    const user = await User.findById(session.userId);
    
    if (!user) {
        return { success: false, userId: null};
    }

    return {success: true, userId: user._id.toString()};

}