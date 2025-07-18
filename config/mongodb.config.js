import fp from "fastify-plugin";
import mongoose from "mongoose";

export default fp(async function (fastify) {
  const dbUrl = process.env.MONGODB_URL;
  if (!dbUrl) {
    console.error("❌ MONGODB_URL is not defined");
    process.exit(1);
  }

  try {
    await mongoose.connect(dbUrl);
    console.log("✅ MongoDB connected");
    fastify.decorate("mongoose", mongoose);

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
});
