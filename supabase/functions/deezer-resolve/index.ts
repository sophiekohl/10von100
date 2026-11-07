import { createResolver } from './handler.mjs';
Deno.serve(createResolver({url:Deno.env.get('SUPABASE_URL')!,key:Deno.env.get('SUPABASE_ANON_KEY')!}));
