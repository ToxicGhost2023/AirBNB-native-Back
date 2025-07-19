import {
  getDataUser,
  loginHandler,
  signUpHandler,
  uploadProfilePictureHandler,
} from "../handlers/auth.handler.js";

const signUpRoute = {
  schema: {
    tags: ["authentication"],
    summary: "sigup for user",
    // body: {
    //   type: "object",
    //   properties: {
    //     email: {
    //       type: "string",
    //     },
    //     password: {
    //       type: "string",
    //     },
    //     userName: {
    //       type: "string",
    //     },
    //   },
    // },
    response: {
      201: {
        type: "object",
      },
    },
  },
  handler: signUpHandler,
};

export const loginRoute = {
  method: "POST",
  url: "/login",
  schema: {
    tags: ["authentication"],
    summary: "ورود کاربر",
    body: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: {
          type: "string",
          format: "email",
        },
        password: {
          type: "string",
        },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string" },
          token: { type: "string" },
          user: {
            type: "object",
            properties: {
              email: { type: "string" },
              userName: { type: "string" },
              role: { type: "string" },
            },
          },
        },
      },
    },
  },
  handler: loginHandler,
};

export const userInformation = {
  schema: {
    tags: ["user"],
    summary: "جزییات کاربر",
    security: [{ apiKey: [] }],
    response: {
      201: {
        type: "object",
      },
    },
  },

  handler: getDataUser,
};

export const uploadProfilePictureRoute = {
  method: "POST",
  url: "/api/upload-profile-picture",
  schema: {
    tags: ["profile"],
    summary: "آپلود تصویر پروفایل",
    consumes: ["multipart/form-data"],
    // از تعریف body خودداری کن چون validation باعث ارور میشه
    response: {
      200: {
        type: "object",
        properties: {
          userId: { type: "string" },
          imageUrl: { type: "string" },
        },
      },
    },
  },
  handler: uploadProfilePictureHandler,
};
export default function authRouters(fastify, option, done) {
  fastify.post("/signup", signUpRoute);
  fastify.post("/login", loginRoute);
  fastify.post("/upload-profile-picture", uploadProfilePictureRoute);
  fastify.get("/information", userInformation);
  done();
}
