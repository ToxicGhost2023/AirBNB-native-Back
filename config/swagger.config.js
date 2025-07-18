export const fastifySwaggerConfig = {
  swagger: {
    info: {
      title: "fastify Swagger",
      description: "swagger: apies of shovers",
      version: "0.1.0",
    },
    tags: [
      { name: "authentication", description: "SignUp for Users" },
      { name: "profile", description: "user can read & write (profile)" },
    ],
    schemes: ["http"],
    consumes: [
      "application/json",
      "application/x-www-urlencoded",
      "multipart/form-data",
    ],

    securityDefinitions: {
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "authorization",
      },
    },
  },
};
export const fastifySwaggerUiConfig = {
  routePrefix: "/swagger",
  exposeRoute: true,
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
};
