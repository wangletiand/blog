export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    if (request.method === 'POST' && pathname === '/api/register') {
      const { email, password } = await request.json();
      await env.KV.put(`user:${email}`, password);
      return new Response('ok');
    }
    if (request.method === 'POST' && pathname === '/api/login') {
      const { email, password } = await request.json();
      const saved = await env.KV.get(`user:${email}`);
      return new Response(saved === password ? 'ok' : 'fail');
    }
    if (request.method === 'POST' && pathname === '/api/posts') {
      const { title, summary, content } = await request.json();
      const id = Date.now().toString();
      await env.KV.put(`post:${id}`, JSON.stringify({ id, title, summary, content }));
      return new Response('ok');
    }
    if (pathname === '/api/posts') {
      const list = await env.KV.list({ prefix: 'post:' });
      const posts = await Promise.all(list.keys.map(async key => {
        const post = JSON.parse(await env.KV.get(key.name));
        return { id: post.id, title: post.title, summary: post.summary };
      }));
      return Response.json(posts);
    }
    if (pathname.startsWith('/api/posts/') && pathname.endsWith('/comments')) {
      const id = pathname.split('/')[3];
      if (request.method === 'POST') {
        const { content } = await request.json();
        const key = `post:${id}:comments`;
        const raw = await env.KV.get(key) || '[]';
        const comments = JSON.parse(raw);
        comments.push({ content });
        await env.KV.put(key, JSON.stringify(comments));
        return new Response('ok');
      } else {
        const raw = await env.KV.get(`post:${id}:comments`) || '[]';
        return Response.json(JSON.parse(raw));
      }
    }
    if (pathname.startsWith('/api/posts/')) {
      const id = pathname.split('/')[3];
      const post = await env.KV.get(`post:${id}`);
      return Response.json(JSON.parse(post));
    }
    return new Response('Not found', { status: 404 });
  }
};
