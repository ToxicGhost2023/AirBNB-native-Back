import { UserModel } from "../model/user.model.js";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { extname, join } from "path";
import bcrypt from "bcrypt";

export const signUpHandler = async (req, reply) => {
  try {
    const parts = await req.parts();
    let email, password, userName;
    let filePart = null;

    for await (const part of parts) {
      if (part.file) {
        const buffer = await part.toBuffer();
        filePart = { ...part, buffer };
      } else {
        if (part.fieldname === "email") email = part.value;
        else if (part.fieldname === "password") password = part.value;
        else if (part.fieldname === "userName") userName = part.value;
      }
    }

    if (!email || !password || !userName) {
      return reply.status(400).send({ error: "اطلاعات ناقص است." });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return reply.status(400).send({ error: "این حساب قبلاً ایجاد شده است." });
    }

    let profilePicturePath = null;
    if (filePart) {
      const allowedTypes = [
        "image/jpeg",
        "image/JPG ",
        "image/png",
        "image/HEIC ",
        "image/HEIF",
        "image/gif",
      ];
      if (!allowedTypes.includes(filePart.mimetype)) {
        return reply
          .status(400)
          .send({ error: "فقط فایل‌های JPEG، PNG و GIF مجاز هستند." });
      }

      const uploadDir = join(process.cwd(), "uploads");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const fileExt = extname(filePart.filename) || ".jpg";
      const fileName = `${uniqueSuffix}${fileExt}`;
      profilePicturePath = `/uploads/${fileName}`;
      const buffer = await filePart.toBuffer();
      await writeFile(join(uploadDir, fileName), buffer);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      email,
      password: hashedPassword,
      userName,
      verifiedMobile: true,
      profilePicture: profilePicturePath,
    });

    await user.save();

    const token = req.server.jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      { expiresIn: "7d" }
    );

    return reply
      .setCookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        signed: false,
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      })
      .send({
        status: 200,
        message: "ثبت‌نام موفق بود.",
        token,
        user: {
          email: user.email,
          userName: user.userName,
          userId: user._id,
          role: user.role,
          profilePicture: user.profilePicture,
        },
      });
  } catch (error) {
    console.error("خطای ثبت‌نام:", error);
    return reply
      .status(500)
      .send({ error: "خطای سرور", details: error.message });
  }
};

export const loginHandler = async (req, reply) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return reply.status(400).send({ error: "ایمیل و رمز عبور الزامی است." });
    }

    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      return reply
        .status(401)
        .send({ error: "کاربری با این ایمیل وجود ندارد." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return reply.status(401).send({ error: "رمز عبور اشتباه است." });
    }

    const token = req.server.jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      { expiresIn: "7d" }
    );

    return reply
      .setCookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        signed: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      })
      .send({
        status: 200,
        message: "ورود موفق بود.",
        token,
        user: {
          email: user.email,
          userName: user.userName,
          userId: user._id,
          role: user.role,
          profilePicture: user.profilePicture,
        },
      });
  } catch (error) {
    console.error("خطای ورود:", error);
    return reply
      .status(500)
      .send({ error: "خطای سرور", details: error.message });
  }
};

export const logOutHandler = async (req, reply) => {
  try {
    return reply
      .clearCookie("accessToken", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
      .send({ status: 200, message: "خروج با موفقیت انجام شد." });
  } catch (error) {
    console.error("خطای خروج:", error);
    return reply
      .status(500)
      .send({ error: "خطای سرور", details: error.message });
  }
};

export const getDataUser = async (req, reply) => {
  try {
    // احراز هویت کاربر با JWT
    await req.jwtVerify();
    const userId = req.user.userId;

    const user = await UserModel.findById(userId).select(
      "email userName role profilePicture"
    );
    if (!user) {
      return reply.status(404).send({ error: "کاربر یافت نشد." });
    }

    return reply.send({
      status: 200,
      user: {
        email: user.email,
        userName: user.userName,
        userId: user._id,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("خطای دریافت اطلاعات کاربر:", error);
    return reply
      .status(500)
      .send({ error: "خطای سرور", details: error.message });
  }
};

export const uploadProfilePictureHandler = async (req, reply) => {
  try {
    // احراز هویت کاربر
    await req.jwtVerify();
    const userId = req.user.userId;

    // دریافت فایل
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ error: "هیچ فایلی آپلود نشد." });
    }

    // اعتبارسنجی نوع فایل
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(data.mimetype)) {
      return reply
        .status(400)
        .send({ error: "فقط فایل‌های JPEG، PNG و GIF مجاز هستند." });
    }

    // ذخیره فایل
    const uploadDir = join(process.cwd(), "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = `${uniqueSuffix}${extname(data.filename)}`;
    const filePath = `/uploads/${fileName}`;
    await writeFile(join(uploadDir, fileName), await data.toBuffer());

    // به‌روزرسانی کاربر
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { profilePicture: filePath },
      { new: true }
    );

    if (!user) {
      return reply.status(404).send({ error: "کاربر یافت نشد." });
    }

    return reply.send({
      status: 200,
      message: "تصویر پروفایل با موفقیت آپلود شد.",
      userId: user._id,
      imageUrl: filePath,
    });
  } catch (error) {
    console.error("خطای آپلود تصویر پروفایل:", error);
    return reply
      .status(500)
      .send({ error: "خطای سرور", details: error.message });
  }
};
