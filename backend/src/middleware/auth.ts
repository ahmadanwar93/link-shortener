import { FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../lib/auth.js";
import { Session, User } from "better-auth";

// this is module augmentation
// we are modifying the FastifyRequest type globally
// for unauthenticated route, the user and session will be null

declare module "fastify" {
  interface FastifyRequest {
    user: User | null;
    session: Session | null;
  }
}

// basically we want to write a hook into interact with Fastify lifecycle
// the end goal is to add user and session data before the request handler
// similar to middleware
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Convert Fastify headers to Fetch API Headers
    const headers = new Headers();
    Object.entries(request.headers).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.append(key, value);
        }
      }
    });

    // function call, not another API call
    const sessionData = await auth.api.getSession({ headers });

    if (!sessionData?.user) {
      return reply.status(401).send({
        error: "Unauthorized",
        code: "AUTH_REQUIRED",
      });
    }

    // Attach to request for use in route handlers
    request.user = sessionData.user;
    request.session = sessionData.session;
  } catch (error) {
    request.log.error({ err: error }, "Auth middleware error");
    return reply.status(401).send({
      error: "Authentication failed",
      code: "AUTH_FAILURE",
    });
  }
}
