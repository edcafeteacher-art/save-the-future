export interface Env {
  DB: D1Database;
  POSTERS: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ok:true,service:"save-the-future-api"});
    }
    if (url.pathname === "/api/submissions" && request.method === "GET") {
      const result = await env.DB.prepare(
        "SELECT id, poster_no, title, idea, interactive, status, audience_count, created_at FROM submissions WHERE status IN ('published','winner') ORDER BY created_at DESC"
      ).all();
      return Response.json(result.results);
    }
    return Response.json({error:"not_found"}, {status:404});
  }
};