import { NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const body = await req.json
      ? await req.json()
      : {};

    const { email, password, role, name } = body;

    // 🔴 Basic validation
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔐 ROLE VALIDATION (CC > OC)
    if (!["cc", "oc"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Only cc or oc allowed." },
        { status: 400 }
      );
    }

    // 1️⃣ Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    const uid = userRecord.uid;

    // 2️⃣ Create Firestore user document (UID = doc ID)
    await admin.firestore().collection("users").doc(uid).set({
      email,
      name: name || "",
      role, // cc or oc
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      uid,
      role,
    });
  } catch (err) {
    console.error("REGISTER USER API ERROR:", err);

    // 🔍 Helpful error messages
    if (err.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
